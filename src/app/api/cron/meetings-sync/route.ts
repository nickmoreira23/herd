import { NextResponse } from "next/server";
import {
  syncCalendarMeetings,
  checkCompletedRecordings,
} from "@/lib/meetings/meeting-scheduler";
import {
  getAgentConfig,
  processCompletedMeeting,
} from "@/lib/meetings/meeting-agent";
import { RecallAiService } from "@/lib/services/recall-ai";
import { prisma } from "@/lib/prisma";

/**
 * GET — Scheduled sync for meetings.
 *
 * Runs on a schedule (e.g., Vercel Cron every 15 minutes).
 *
 * 1. Syncs upcoming calendar events (from all connected providers) into
 *    Meeting records and deploys Recall.ai bots for eligible meetings
 *    based on the Meeting Agent's decision engine.
 * 2. Polls Recall.ai for completed recordings and triggers the full
 *    post-meeting pipeline (transcription + summarization + insights).
 *
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    calendarSync: { created: number; botsSent: number; providers: string[] } | null;
    recordings: { processed: number } | null;
    agentPipeline: { processed: number } | null;
    errors: string[];
  } = {
    calendarSync: null,
    recordings: null,
    agentPipeline: null,
    errors: [],
  };

  // Get agent config for processing decisions
  let agentConfig;
  try {
    agentConfig = await getAgentConfig();
  } catch (e) {
    results.errors.push("Failed to load agent config");
  }

  // 1. Sync calendar events to meetings & deploy bots
  try {
    results.calendarSync = await syncCalendarMeetings();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Calendar sync failed";
    results.errors.push(msg);
  }

  // 2. Check for completed Recall.ai recordings
  // Use the enhanced agent pipeline if config is available
  if (agentConfig) {
    try {
      let processed = 0;
      const recallService = await RecallAiService.fromIntegration();
      if (recallService) {
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
              // Use the full agent pipeline instead of basic processing
              await processCompletedMeeting(
                meeting.id,
                bot.audio_url,
                agentConfig
              );
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
      }
      results.agentPipeline = { processed };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Agent pipeline check failed";
      results.errors.push(msg);
    }
  } else {
    // Fallback to basic recording check
    try {
      const processed = await checkCompletedRecordings();
      results.recordings = { processed };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Recording check failed";
      results.errors.push(msg);
    }
  }

  return NextResponse.json(results);
}
