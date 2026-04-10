import { prisma } from "@/lib/prisma";
import { GoogleCalendarService } from "@/lib/services/google-calendar";
import { MicrosoftCalendarService } from "@/lib/services/microsoft-calendar";
import { ZoomService } from "@/lib/services/zoom";

// ─── Normalized Types ──────────────────────────────────────────────

export interface NormalizedAttendee {
  name: string;
  email: string;
  responseStatus: string;
}

export interface NormalizedEvent {
  externalId: string;
  title: string;
  description: string | null;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  meetingUrl: string | null;
  platform: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "OTHER";
  attendees: NormalizedAttendee[];
  isOnlineMeeting: boolean;
  sourceIntegration: string; // slug of the calendar integration
}

// ─── Platform Detection ───────────────────────────────────────────

const MEETING_URL_PATTERNS: Record<string, "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS"> = {
  "meet.google.com": "GOOGLE_MEET",
  "zoom.us": "ZOOM",
  "teams.microsoft.com": "MICROSOFT_TEAMS",
  "teams.live.com": "MICROSOFT_TEAMS",
};

function detectPlatform(url: string): "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "OTHER" {
  for (const [domain, platform] of Object.entries(MEETING_URL_PATTERNS)) {
    if (url.includes(domain)) return platform;
  }
  return "OTHER";
}

// ─── Google Calendar Provider ──────────────────────────────────────

async function fetchGoogleCalendarEvents(
  integrationId: string,
  timeMin: string,
  timeMax: string
): Promise<NormalizedEvent[]> {
  const service = new GoogleCalendarService(integrationId);
  const response = await service.listEvents("primary", {
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (response.items || [])
    .filter((event) => event.id && event.start)
    .map((event) => {
      // Extract meeting URL
      let meetingUrl: string | null = null;
      const eventAny = event as unknown as Record<string, unknown>;
      if (typeof eventAny.hangoutLink === "string") {
        meetingUrl = eventAny.hangoutLink;
      }
      if (!meetingUrl && event.conferenceData) {
        const conf = event.conferenceData;
        if (conf.entryPoints && Array.isArray(conf.entryPoints)) {
          for (const ep of conf.entryPoints as Array<Record<string, unknown>>) {
            if (ep.entryPointType === "video" && typeof ep.uri === "string") {
              meetingUrl = ep.uri;
              break;
            }
          }
        }
      }
      if (!meetingUrl) {
        const text = `${event.description || ""} ${event.location || ""}`;
        const urlMatch = text.match(
          /https?:\/\/[^\s<>"]+(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|teams\.live\.com)[^\s<>"']*/i
        );
        if (urlMatch) meetingUrl = urlMatch[0];
      }

      const startTime = event.start.dateTime || event.start.date || "";
      const endTime = event.end?.dateTime || event.end?.date || "";

      return {
        externalId: event.id,
        title: event.summary || "Untitled Event",
        description: event.description || null,
        startTime,
        endTime,
        meetingUrl,
        platform: meetingUrl ? detectPlatform(meetingUrl) : "OTHER",
        attendees: (event.attendees || []).map((a) => ({
          name: a.displayName || a.email,
          email: a.email,
          responseStatus: a.responseStatus,
        })),
        isOnlineMeeting: !!meetingUrl,
        sourceIntegration: "google-calendar",
      };
    });
}

// ─── Microsoft Outlook Provider ────────────────────────────────────

async function fetchMicrosoftOutlookEvents(
  integrationId: string,
  timeMin: string,
  timeMax: string
): Promise<NormalizedEvent[]> {
  const service = new MicrosoftCalendarService(integrationId);
  const response = await service.listEvents({
    startDateTime: timeMin,
    endDateTime: timeMax,
    top: 50,
    orderBy: "start/dateTime",
  });

  return (response.value || [])
    .filter((event) => event.id && !event.isCancelled)
    .map((event) => {
      // Extract meeting URL
      let meetingUrl: string | null = null;
      if (event.onlineMeeting?.joinUrl) {
        meetingUrl = event.onlineMeeting.joinUrl;
      } else if (event.onlineMeetingUrl) {
        meetingUrl = event.onlineMeetingUrl;
      }
      if (!meetingUrl && event.body?.content) {
        const urlMatch = event.body.content.match(
          /https?:\/\/[^\s<>"]+(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com|teams\.live\.com)[^\s<>"']*/i
        );
        if (urlMatch) meetingUrl = urlMatch[0];
      }

      // Determine platform
      let platform: NormalizedEvent["platform"] = "OTHER";
      if (meetingUrl) {
        platform = detectPlatform(meetingUrl);
      } else if (event.isOnlineMeeting && event.onlineMeetingProvider === "teamsForBusiness") {
        platform = "MICROSOFT_TEAMS";
      }

      return {
        externalId: event.id,
        title: event.subject || "Untitled Event",
        description: event.bodyPreview || null,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        meetingUrl,
        platform,
        attendees: (event.attendees || []).map((a) => ({
          name: a.emailAddress.name,
          email: a.emailAddress.address,
          responseStatus: a.status?.response || "none",
        })),
        isOnlineMeeting: event.isOnlineMeeting || !!meetingUrl,
        sourceIntegration: "microsoft-outlook",
      };
    });
}

// ─── Zoom Meetings Provider ───────────────────────────────────────

async function fetchZoomMeetings(
  integrationId: string,
  _timeMin: string,
  _timeMax: string
): Promise<NormalizedEvent[]> {
  const service = new ZoomService(integrationId);
  const response = await service.listUpcomingMeetings();

  return (response.meetings || [])
    .map((meeting) => ({
      externalId: String(meeting.id),
      title: meeting.topic || "Untitled Zoom Meeting",
      description: meeting.agenda || null,
      startTime: meeting.start_time,
      endTime: new Date(
        new Date(meeting.start_time).getTime() + meeting.duration * 60000
      ).toISOString(),
      meetingUrl: meeting.join_url,
      platform: "ZOOM" as const,
      attendees: [] as NormalizedAttendee[],
      isOnlineMeeting: true,
      sourceIntegration: "zoom",
    }));
}

// ─── Provider Registry ────────────────────────────────────────────

interface CalendarProviderConfig {
  slug: string;
  fetch: (integrationId: string, timeMin: string, timeMax: string) => Promise<NormalizedEvent[]>;
}

const CALENDAR_PROVIDERS: CalendarProviderConfig[] = [
  { slug: "google-calendar", fetch: fetchGoogleCalendarEvents },
  { slug: "microsoft-outlook", fetch: fetchMicrosoftOutlookEvents },
  { slug: "zoom", fetch: fetchZoomMeetings },
];

// ─── Public API ───────────────────────────────────────────────────

/**
 * Fetch upcoming events from ALL connected calendar/meeting integrations.
 * Deduplicates by meeting URL when the same meeting appears in multiple calendars.
 */
export async function fetchAllUpcomingEvents(
  timeMin: string,
  timeMax: string
): Promise<NormalizedEvent[]> {
  const allEvents: NormalizedEvent[] = [];

  for (const provider of CALENDAR_PROVIDERS) {
    const integration = await prisma.integration.findUnique({
      where: { slug: provider.slug },
    });

    if (!integration || integration.status !== "CONNECTED") continue;

    try {
      const events = await provider.fetch(integration.id, timeMin, timeMax);
      allEvents.push(...events);
    } catch (err) {
      console.error(`Failed to fetch events from ${provider.slug}:`, err);
      // Continue with other providers
    }
  }

  // Deduplicate by meeting URL — keep the richest record (most attendees)
  return deduplicateEvents(allEvents);
}

/**
 * Get a list of connected calendar/meeting integrations.
 */
export async function getConnectedCalendarProviders(): Promise<
  Array<{ slug: string; name: string; integrationId: string }>
> {
  const providers: Array<{ slug: string; name: string; integrationId: string }> = [];

  for (const provider of CALENDAR_PROVIDERS) {
    const integration = await prisma.integration.findUnique({
      where: { slug: provider.slug },
    });
    if (integration && integration.status === "CONNECTED") {
      providers.push({
        slug: integration.slug,
        name: integration.name,
        integrationId: integration.id,
      });
    }
  }

  return providers;
}

// ─── Deduplication ────────────────────────────────────────────────

function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const seen = new Map<string, NormalizedEvent>();
  const result: NormalizedEvent[] = [];

  for (const event of events) {
    // Dedup by meeting URL
    if (event.meetingUrl) {
      const normalizedUrl = event.meetingUrl.split("?")[0].toLowerCase();
      const existing = seen.get(normalizedUrl);

      if (existing) {
        // Keep the one with more attendees or from the calendar source
        if (event.attendees.length > existing.attendees.length) {
          // Replace with richer record
          const idx = result.indexOf(existing);
          if (idx !== -1) result[idx] = event;
          seen.set(normalizedUrl, event);
        }
        continue;
      }

      seen.set(normalizedUrl, event);
    }

    result.push(event);
  }

  return result;
}
