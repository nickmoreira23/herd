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
 * Check meetings that have a Recall.ai bot but are still in SCHEDULED
 * or RECORDING status. If the bot has finished, download the audio,
 * transcribe, and summarize.
 */
export async function checkCompletedRecordings(): Promise<number> {
  let processed = 0;

  const recallService = await RecallAiService.fromIntegration();
  if (!recallService) return processed;

  // Find meetings with bots still pending
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

        // Download audio and write to temp file
        const audioRes = await fetch(bot.audio_url);
        if (audioRes.ok) {
          const buffer = Buffer.from(await audioRes.arrayBuffer());
          const { writeFile, unlink } = await import("fs/promises");
          const { join } = await import("path");
          const { tmpdir } = await import("os");
          const tmpPath = join(
            tmpdir(),
            `recall-${meeting.externalBotId}.mp4`
          );
          await writeFile(tmpPath, buffer);

          const { transcribeAudio } = await import(
            "@/lib/knowledge/audio-transcriber"
          );
          const transcriptText = await transcribeAudio(tmpPath);

          // Clean up temp file
          await unlink(tmpPath).catch(() => {});

          const duration =
            meeting.startedAt && meeting.endedAt
              ? (meeting.endedAt.getTime() -
                  meeting.startedAt.getTime()) /
                1000
              : null;

          await prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              transcript: transcriptText,
              chunkCount: Math.ceil(transcriptText.length / 1000),
              audioFileUrl: bot.audio_url,
              audioMimeType: "audio/mp4",
              duration,
              status: "READY",
              processedAt: new Date(),
            },
          });

          // Auto-summarize (best-effort)
          try {
            const { summarizeMeeting } = await import(
              "@/lib/meetings/meeting-summarizer"
            );
            const summary = await summarizeMeeting(
              transcriptText,
              meeting.title
            );
            await prisma.meeting.update({
              where: { id: meeting.id },
              data: {
                summary: summary.summary,
                actionItems: summary.actionItems,
                keyTopics: summary.keyTopics,
              },
            });
          } catch {
            // Summary is optional
          }

          // Save to knowledge base (best-effort)
          try {
            const { saveMeetingToKnowledge } = await import(
              "@/lib/meetings/meeting-knowledge"
            );
            await saveMeetingToKnowledge(meeting.id);
          } catch {
            // Knowledge pipeline is optional
          }

          processed++;
        }
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
