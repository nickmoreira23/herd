import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  fetchAllUpcomingEvents,
  getConnectedCalendarProviders,
} from "@/lib/meetings/calendar-providers";
import { prisma } from "@/lib/prisma";

/**
 * GET — Fetch upcoming meetings from all connected calendar/meeting integrations.
 * Returns normalized events + which providers are connected + existing meeting records.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursAhead = Number(searchParams.get("hours") || "48");

    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + hoursAhead * 60 * 60 * 1000
    ).toISOString();

    // Fetch from all connected calendar providers
    const [events, connectedProviders] = await Promise.all([
      fetchAllUpcomingEvents(timeMin, timeMax),
      getConnectedCalendarProviders(),
    ]);

    // Also fetch existing Meeting records that have bots deployed
    const existingMeetings = await prisma.meeting.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: { in: ["SCHEDULED", "RECORDING", "PROCESSING"] },
      },
      select: {
        id: true,
        title: true,
        meetingUrl: true,
        calendarEventId: true,
        platform: true,
        status: true,
        externalBotId: true,
        scheduledAt: true,
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Enrich calendar events with bot status from existing meeting records
    const enrichedEvents = events.map((event) => {
      const matchingMeeting = existingMeetings.find(
        (m) =>
          m.calendarEventId === event.externalId ||
          (m.meetingUrl && event.meetingUrl && m.meetingUrl === event.meetingUrl)
      );

      return {
        ...event,
        meetingRecordId: matchingMeeting?.id || null,
        botStatus: matchingMeeting?.externalBotId ? "deployed" : null,
        recordingStatus: matchingMeeting?.status || null,
      };
    });

    // Sort by start time
    enrichedEvents.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return apiSuccess({
      events: enrichedEvents,
      connectedProviders,
      totalEvents: enrichedEvents.length,
      onlineMeetings: enrichedEvents.filter((e) => e.isOnlineMeeting).length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch upcoming meetings";
    return apiError(msg, 500);
  }
}
