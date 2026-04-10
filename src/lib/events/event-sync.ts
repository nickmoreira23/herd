import { prisma } from "@/lib/prisma";
import { GoogleCalendarService } from "@/lib/services/google-calendar";
import type { CalendarEvent as GCalEvent } from "@/lib/services/google-calendar";

// ─── Sync calendar events to local database ───────────────────────

export interface SyncResult {
  calendarsProcessed: number;
  eventsUpserted: number;
  eventsDeleted: number;
  errors: string[];
}

/**
 * Syncs events from all connected calendar integrations into the local
 * CalendarEvent table for RAG searchability and UI rendering.
 *
 * Uses Google Calendar's incremental sync tokens when available.
 */
export async function syncCalendarEvents(): Promise<SyncResult> {
  const result: SyncResult = {
    calendarsProcessed: 0,
    eventsUpserted: 0,
    eventsDeleted: 0,
    errors: [],
  };

  // Find connected Google Calendar integration
  const calIntegration = await prisma.integration.findUnique({
    where: { slug: "google-calendar" },
  });
  if (!calIntegration || calIntegration.status !== "CONNECTED") {
    return result;
  }

  const calService = new GoogleCalendarService(calIntegration.id);

  // Fetch all calendars for the user
  let calendars;
  try {
    calendars = await calService.listCalendars();
  } catch (err) {
    result.errors.push(
      `Failed to list calendars: ${err instanceof Error ? err.message : "Unknown error"}`
    );
    return result;
  }

  // Upsert CalendarEventSync records for each calendar
  for (const cal of calendars) {
    try {
      const syncRecord = await prisma.calendarEventSync.upsert({
        where: {
          source_externalCalendarId: {
            source: "GOOGLE_CALENDAR",
            externalCalendarId: cal.id,
          },
        },
        create: {
          source: "GOOGLE_CALENDAR",
          externalCalendarId: cal.id,
          calendarName: cal.summary,
          calendarColor: cal.backgroundColor || null,
          timeZone: cal.timeZone || null,
          integrationId: calIntegration.id,
        },
        update: {
          calendarName: cal.summary,
          calendarColor: cal.backgroundColor || null,
          timeZone: cal.timeZone || null,
        },
      });

      if (!syncRecord.isActive) continue;

      // Sync events for this calendar
      const syncStats = await syncCalendarEventsForCalendar(
        calService,
        cal.id,
        syncRecord.id,
        syncRecord.syncToken
      );

      result.eventsUpserted += syncStats.upserted;
      result.calendarsProcessed++;

      // Update sync metadata
      await prisma.calendarEventSync.update({
        where: { id: syncRecord.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: null,
          syncToken: syncStats.newSyncToken || syncRecord.syncToken,
        },
      });
    } catch (err) {
      const msg = `Calendar "${cal.summary}": ${err instanceof Error ? err.message : "Unknown error"}`;
      result.errors.push(msg);

      // Record error on the sync record
      const existing = await prisma.calendarEventSync.findUnique({
        where: {
          source_externalCalendarId: {
            source: "GOOGLE_CALENDAR",
            externalCalendarId: cal.id,
          },
        },
      });
      if (existing) {
        await prisma.calendarEventSync.update({
          where: { id: existing.id },
          data: { lastSyncError: msg },
        });
      }
    }
  }

  // Cleanup old events (> 90 days past)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.calendarEvent.deleteMany({
    where: { endAt: { lt: cutoff } },
  });
  result.eventsDeleted = deleted.count;

  return result;
}

// ─── Per-calendar sync ────────────────────────────────────────────

async function syncCalendarEventsForCalendar(
  calService: GoogleCalendarService,
  calendarId: string,
  calendarSyncId: string,
  existingSyncToken: string | null
): Promise<{ upserted: number; newSyncToken: string | null }> {
  let upserted = 0;
  let newSyncToken: string | null = null;

  // Try incremental sync first
  if (existingSyncToken) {
    try {
      const stats = await fetchAndUpsertEvents(
        calService,
        calendarId,
        calendarSyncId,
        { syncToken: existingSyncToken }
      );
      return stats;
    } catch (err) {
      // 410 Gone means the sync token is invalid — fall back to full sync
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("410")) {
        throw err;
      }
      // Clear invalid sync token
      await prisma.calendarEventSync.update({
        where: { id: calendarSyncId },
        data: { syncToken: null },
      });
    }
  }

  // Full sync: fetch events from 30 days ago to 90 days ahead
  const timeMin = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const timeMax = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  const stats = await fetchAndUpsertEvents(
    calService,
    calendarId,
    calendarSyncId,
    { timeMin, timeMax, singleEvents: true, orderBy: "startTime" }
  );

  return stats;
}

async function fetchAndUpsertEvents(
  calService: GoogleCalendarService,
  calendarId: string,
  calendarSyncId: string,
  params: {
    syncToken?: string;
    timeMin?: string;
    timeMax?: string;
    singleEvents?: boolean;
    orderBy?: "startTime" | "updated";
  }
): Promise<{ upserted: number; newSyncToken: string | null }> {
  let upserted = 0;
  let pageToken: string | undefined;
  let newSyncToken: string | null = null;

  do {
    const response = await calService.listEvents(calendarId, {
      ...params,
      maxResults: 250,
      pageToken,
    });

    for (const event of response.items || []) {
      if (!event.id) continue;

      if (event.status === "cancelled") {
        // Handle cancelled events: update status if exists, skip otherwise
        await prisma.calendarEvent.updateMany({
          where: {
            calendarSyncId,
            externalEventId: event.id,
          },
          data: {
            status: "CANCELLED",
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
          },
        });
        continue;
      }

      const startAt = parseEventDateTime(event.start);
      const endAt = parseEventDateTime(event.end);
      if (!startAt || !endAt) continue;

      const isAllDay = !event.start.dateTime && !!event.start.date;
      const meetingUrl = extractMeetingUrl(event);

      // Upsert the event
      await prisma.calendarEvent.upsert({
        where: {
          calendarSyncId_externalEventId: {
            calendarSyncId,
            externalEventId: event.id,
          },
        },
        create: {
          calendarSyncId,
          externalEventId: event.id,
          title: event.summary || "Untitled Event",
          description: event.description || null,
          location: event.location || null,
          startAt,
          endAt,
          isAllDay,
          timeZone: event.start.timeZone || null,
          status: mapEventStatus(event.status),
          syncStatus: "SYNCED",
          htmlLink: event.htmlLink || null,
          meetingUrl,
          conferenceData: event.conferenceData
            ? JSON.parse(JSON.stringify(event.conferenceData))
            : undefined,
          recurrence: event.recurrence || [],
          recurringEventId: event.recurringEventId || null,
          organizerEmail: event.organizer?.email || null,
          organizerName: event.organizer?.displayName || null,
          visibility: event.visibility || null,
          transparency: event.transparency || null,
          colorId: event.colorId || null,
          lastSyncedAt: new Date(),
        },
        update: {
          title: event.summary || "Untitled Event",
          description: event.description || null,
          location: event.location || null,
          startAt,
          endAt,
          isAllDay,
          timeZone: event.start.timeZone || null,
          status: mapEventStatus(event.status),
          syncStatus: "SYNCED",
          htmlLink: event.htmlLink || null,
          meetingUrl,
          conferenceData: event.conferenceData
            ? JSON.parse(JSON.stringify(event.conferenceData))
            : undefined,
          recurrence: event.recurrence || [],
          recurringEventId: event.recurringEventId || null,
          organizerEmail: event.organizer?.email || null,
          organizerName: event.organizer?.displayName || null,
          visibility: event.visibility || null,
          transparency: event.transparency || null,
          colorId: event.colorId || null,
          lastSyncedAt: new Date(),
        },
      });

      // Sync attendees: delete existing and recreate
      const upsertedEvent = await prisma.calendarEvent.findUnique({
        where: {
          calendarSyncId_externalEventId: {
            calendarSyncId,
            externalEventId: event.id,
          },
        },
        select: { id: true },
      });

      if (upsertedEvent && event.attendees && event.attendees.length > 0) {
        await prisma.calendarEventAttendee.deleteMany({
          where: { eventId: upsertedEvent.id },
        });
        await prisma.calendarEventAttendee.createMany({
          data: event.attendees.map((a) => ({
            eventId: upsertedEvent.id,
            email: a.email,
            displayName: a.displayName || null,
            responseStatus: a.responseStatus || "needsAction",
            isOrganizer: a.organizer || false,
            isSelf: a.self || false,
          })),
        });
      }

      upserted++;
    }

    pageToken = response.nextPageToken;
    if (!response.nextPageToken && response.nextSyncToken) {
      newSyncToken = response.nextSyncToken;
    }
  } while (pageToken);

  return { upserted, newSyncToken };
}

// ─── Helpers ──────────────────────────────────────────────────────

function parseEventDateTime(
  dt: { dateTime?: string; date?: string } | undefined
): Date | null {
  if (!dt) return null;
  if (dt.dateTime) return new Date(dt.dateTime);
  if (dt.date) return new Date(dt.date);
  return null;
}

function mapEventStatus(
  status: "confirmed" | "tentative" | "cancelled"
): "CONFIRMED" | "TENTATIVE" | "CANCELLED" {
  switch (status) {
    case "confirmed":
      return "CONFIRMED";
    case "tentative":
      return "TENTATIVE";
    case "cancelled":
      return "CANCELLED";
    default:
      return "CONFIRMED";
  }
}

function extractMeetingUrl(event: GCalEvent): string | null {
  // Google Meet link
  if (event.hangoutLink) return event.hangoutLink;

  // Conference data entry points
  const conf = event.conferenceData;
  if (conf?.entryPoints && Array.isArray(conf.entryPoints)) {
    for (const ep of conf.entryPoints) {
      if (
        (ep as Record<string, unknown>).entryPointType === "video" &&
        typeof (ep as Record<string, unknown>).uri === "string"
      ) {
        return (ep as Record<string, unknown>).uri as string;
      }
    }
  }

  return null;
}
