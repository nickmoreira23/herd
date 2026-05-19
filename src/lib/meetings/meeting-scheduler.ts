import { prisma } from "@/lib/prisma";
import { RecallAiService } from "@/lib/services/recall-ai";
import {
  fetchAllUpcomingEvents,
  type NormalizedEvent,
} from "@/lib/meetings/calendar-providers";

// ─── Sync calendar events to meetings ──────────────────────────────

/**
 * Fetch upcoming events (next 24 h) from ALL connected calendar integrations
 * and create Meeting records for any that contain a virtual meeting URL.
 * If Recall.ai is connected, a recording bot is also deployed.
 */
export async function syncCalendarMeetings(): Promise<{
  created: number;
  botsSent: number;
  providers: string[];
}> {
  let created = 0;
  let botsSent = 0;
  const providers: string[] = [];

  // Fetch events from all connected providers
  const timeMin = new Date().toISOString();
  const timeMax = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  let events: NormalizedEvent[];
  try {
    events = await fetchAllUpcomingEvents(timeMin, timeMax);
  } catch {
    return { created, botsSent, providers };
  }

  if (events.length === 0) return { created, botsSent, providers };

  // Track which providers contributed events
  const seenProviders = new Set<string>();
  for (const e of events) seenProviders.add(e.sourceIntegration);
  providers.push(...seenProviders);

  // Get Recall.ai service (may be null if not connected)
  const recallService = await RecallAiService.fromIntegration();

  for (const event of events) {
    // Skip events without meeting URLs
    if (!event.meetingUrl) continue;

    // Skip if already tracked (by externalId+source or by meetingUrl)
    const existing = await prisma.meeting.findFirst({
      where: {
        OR: [
          { calendarEventId: event.externalId },
          { meetingUrl: event.meetingUrl },
        ],
      },
    });
    if (existing) continue;

    // Create meeting record
    const meeting = await prisma.meeting.create({
      data: {
        title: event.title,
        description: event.description,
        meetingType: "VIRTUAL",
        platform: event.platform,
        status: "SCHEDULED",
        calendarEventId: event.externalId,
        meetingUrl: event.meetingUrl,
        scheduledAt: new Date(event.startTime),
        participantCount: event.attendees.length,
      },
    });
    created++;

    // Create participant records from attendees
    if (event.attendees.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: event.attendees.map((a) => ({
          meetingId: meeting.id,
          name: a.name || a.email || "Unknown",
          email: a.email || null,
          role: a.responseStatus || null,
        })),
      });
    }

    // Deploy Recall.ai bot if the service is connected
    if (recallService) {
      try {
        const bot = await recallService.createBot({
          meeting_url: event.meetingUrl,
          bot_name: "HERD Notetaker",
          join_at: event.startTime,
          recording_mode: "audio_only",
          automatic_leave: {
            waiting_room_timeout: 600,
            noone_joined_timeout: 300,
            everyone_left_timeout: 30,
          },
        });

        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { externalBotId: bot.id },
        });
        botsSent++;
      } catch (err) {
        console.error(
          `Failed to deploy bot for meeting ${meeting.id}:`,
          err
        );
      }
    }
  }

  return { created, botsSent, providers };
}

// ─── Poll for completed recordings ─────────────────────────────────

/**
 * Sub-etapa 8.5 delegate.
 *
 * Cron fallback path: scan meetings still in SCHEDULED/RECORDING, ask
 * Recall for the bot's latest status, and trigger the canonical pipeline
 * when the bot reports `done`. `fatal` flips the Meeting to ERROR with
 * a generic message — there's no body to delegate to.
 *
 * Pre-8.5 this function carried an inline copy of the download →
 * transcribe → summarize → knowledge-save pipeline; that body now lives
 * in `process-recording.ts`. Behavior preserved exactly: no insights,
 * `saveToKnowledge: true`.
 */
export async function checkCompletedRecordings(): Promise<number> {
  const { processRecording } = await import("./process-recording");

  let processed = 0;

  const recallService = await RecallAiService.fromIntegration();
  if (!recallService) return processed;

  const pendingMeetings = await prisma.meeting.findMany({
    where: {
      externalBotId: { not: null },
      status: { in: ["SCHEDULED", "RECORDING"] },
    },
  });

  for (const meeting of pendingMeetings) {
    if (!meeting.externalBotId) continue;

    try {
      const bot = await recallService.getBot(meeting.externalBotId);
      const latestStatus =
        bot.status_changes?.[bot.status_changes.length - 1]?.code;

      if (latestStatus === "done" && bot.audio_url) {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: "PROCESSING" },
        });

        // Pre-8.5 fallback included `saveMeetingToKnowledge` (best-effort)
        // and did NOT generate insights. Mirror exactly via canonical opts.
        await processRecording(meeting.id, {
          saveToKnowledge: true,
        });

        processed++;
      } else if (latestStatus === "fatal") {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            status: "ERROR",
            errorMessage: "Recording bot encountered an error",
          },
        });
      }
    } catch (err) {
      console.error(
        `Error checking bot for meeting ${meeting.id}:`,
        err
      );
    }
  }

  return processed;
}
