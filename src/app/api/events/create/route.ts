import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleCalendarService } from "@/lib/services/google-calendar";
import type { CreateEventInput } from "@/lib/services/google-calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      startAt,
      endAt,
      isAllDay,
      calendarSyncId,
      platform,
      meetingUrl,
      attendees,
    } = body;

    if (!title || !startAt || !endAt || !calendarSyncId) {
      return NextResponse.json(
        { error: "Missing required fields: title, startAt, endAt, calendarSyncId" },
        { status: 400 }
      );
    }

    // Look up the calendar sync record
    const calendarSync = await prisma.calendarEventSync.findUnique({
      where: { id: calendarSyncId },
    });

    if (!calendarSync) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    if (!calendarSync.integrationId) {
      return NextResponse.json(
        { error: "No integration linked to this calendar" },
        { status: 400 }
      );
    }

    // Build the Google Calendar event
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    const eventInput: CreateEventInput = {
      summary: title,
      description: description || undefined,
      location: location || undefined,
      start: isAllDay
        ? { date: startDate.toISOString().split("T")[0] }
        : { dateTime: startDate.toISOString() },
      end: isAllDay
        ? { date: endDate.toISOString().split("T")[0] }
        : { dateTime: endDate.toISOString() },
      attendees: attendees?.map((a: { email: string; name?: string }) => ({
        email: a.email,
        displayName: a.name || undefined,
      })),
    };

    // Create the event via Google Calendar API
    const calService = new GoogleCalendarService(
      calendarSync.integrationId
    );

    const createdEvent = await calService.createEvent(
      calendarSync.externalCalendarId,
      eventInput
    );

    // Upsert the event into the local database
    const localEvent = await prisma.calendarEvent.upsert({
      where: {
        calendarSyncId_externalEventId: {
          calendarSyncId: calendarSync.id,
          externalEventId: createdEvent.id,
        },
      },
      create: {
        calendarSyncId: calendarSync.id,
        externalEventId: createdEvent.id,
        title: createdEvent.summary || title,
        description: createdEvent.description || description || null,
        location:
          createdEvent.location || location || null,
        startAt: startDate,
        endAt: endDate,
        isAllDay: isAllDay || false,
        timeZone: createdEvent.start?.timeZone || null,
        status: "CONFIRMED",
        syncStatus: "SYNCED",
        htmlLink: createdEvent.htmlLink || null,
        meetingUrl: meetingUrl || createdEvent.hangoutLink || null,
        conferenceData: createdEvent.conferenceData
          ? JSON.parse(JSON.stringify(createdEvent.conferenceData))
          : undefined,
        recurrence: createdEvent.recurrence || [],
        organizerEmail: createdEvent.organizer?.email || null,
        organizerName: createdEvent.organizer?.displayName || null,
        lastSyncedAt: new Date(),
      },
      update: {
        title: createdEvent.summary || title,
        description: createdEvent.description || description || null,
        location:
          createdEvent.location || location || null,
        startAt: startDate,
        endAt: endDate,
        isAllDay: isAllDay || false,
        status: "CONFIRMED",
        syncStatus: "SYNCED",
        htmlLink: createdEvent.htmlLink || null,
        meetingUrl: meetingUrl || createdEvent.hangoutLink || null,
        lastSyncedAt: new Date(),
      },
      include: {
        attendees: true,
        calendarSync: {
          select: {
            id: true,
            calendarName: true,
            calendarColor: true,
            source: true,
          },
        },
      },
    });

    // Sync attendees if present
    if (createdEvent.attendees && createdEvent.attendees.length > 0) {
      await prisma.calendarEventAttendee.deleteMany({
        where: { eventId: localEvent.id },
      });
      await prisma.calendarEventAttendee.createMany({
        data: createdEvent.attendees.map(
          (a: {
            email: string;
            displayName?: string;
            responseStatus?: string;
            organizer?: boolean;
            self?: boolean;
          }) => ({
            eventId: localEvent.id,
            email: a.email,
            displayName: a.displayName || null,
            responseStatus: a.responseStatus || "needsAction",
            isOrganizer: a.organizer || false,
            isSelf: a.self || false,
          })
        ),
      });
    }

    return NextResponse.json({ data: localEvent });
  } catch (err) {
    console.error("[POST /api/events/create]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create event",
      },
      { status: 500 }
    );
  }
}
