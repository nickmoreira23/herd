import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  syncCalendarMeetings,
  checkCompletedRecordings,
} from "@/lib/meetings/meeting-scheduler";

// headers() forces dynamic rendering — opt-out of Next 16 Cache Components
// static caching. `noStore()` from `next/cache` is no-op in Next 16
// (Sub-etapa 17.0.6 confirmed via Railway prod). Canonical pattern in 17.0.7.
import {
  getAgentConfig,
  processCompletedMeeting,
} from "@/lib/meetings/meeting-agent";
import { RecallAiService } from "@/lib/services/recall-ai";
import { prisma } from "@/lib/prisma";
import { processRecording } from "@/lib/meetings/process-recording";

/**
 * How long a Meeting can sit in PROCESSING before it is treated as
 * orphaned and re-driven through the canonical pipeline. Typical
 * Deepgram + Anthropic completion is < 2 minutes; 15 minutes is a
 * generous ceiling that won't false-positive on a meeting that's
 * actively being processed in another worker.
 *
 * The canonical pipeline is idempotent by step, so re-running on a
 * partially-processed Meeting is safe — already-transcribed/summarized
 * Meetings skip the expensive Deepgram/Anthropic calls.
 */
const PROCESSING_ORPHAN_THRESHOLD_MS = 15 * 60 * 1000;

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
  // Reading from headers() (Dynamic API) opts the route out of static
  // caching; return value discarded — see module docblock.
  await headers();
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    calendarSync: { created: number; botsSent: number; providers: string[] } | null;
    recordings: { processed: number } | null;
    agentPipeline: { processed: number } | null;
    processingOrphans: { recovered: number } | null;
    errors: string[];
  } = {
    calendarSync: null,
    recordings: null,
    agentPipeline: null,
    processingOrphans: null,
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

  // 3. Recover Meetings stuck in PROCESSING beyond the threshold.
  //    Pre-8.5 this was a silent failure mode — a Meeting whose webhook
  //    arrived but whose async pipeline died (process restart, transient
  //    network failure, etc.) sat at PROCESSING forever. The canonical
  //    pipeline is idempotent by step, so re-driving it is safe.
  try {
    const cutoff = new Date(Date.now() - PROCESSING_ORPHAN_THRESHOLD_MS);
    const stuck = await prisma.meeting.findMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: cutoff },
        externalBotId: { not: null },
      },
      select: { id: true },
    });

    let recovered = 0;
    for (const meeting of stuck) {
      try {
        // Use defaults (no insights, no knowledge save) — orphan recovery
        // mirrors the webhook path's behavior, not the cron-with-agent's
        // richer pipeline. If we wanted insights on recovery, that'd be
        // a separate decision (changing recovery semantics).
        await processRecording(meeting.id);
        recovered++;
      } catch (err) {
        console.error(
          `[meetings-sync] PROCESSING orphan recovery failed for ${meeting.id}:`,
          err,
        );
      }
    }
    results.processingOrphans = { recovered };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Processing orphan recovery failed";
    results.errors.push(msg);
  }

  return NextResponse.json(results);
}
