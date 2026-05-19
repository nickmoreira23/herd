import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RecallAiService } from "@/lib/services/recall-ai";

/**
 * Sub-etapa 8.5 — canonical Recall recording pipeline.
 *
 * Single source of truth for download → transcribe → summarize → (optional
 * insights + knowledge save). Prior to 8.5 the same pipeline existed in
 * three independent copies:
 *   - `processRecording` private to the Recall webhook route
 *   - `processCompletedMeeting` in `meeting-agent.ts` (called by cron+agent)
 *   - `checkCompletedRecordings` in `meeting-scheduler.ts` (cron fallback)
 *
 * All three now delegate here. Adding a fix once propagates to every caller.
 *
 * ## Idempotency by step
 *
 * Each expensive step is skipped if its output is already present on the
 * Meeting row. Replays — whether from a duplicated webhook, a cron orphan
 * recovery pass, or a manual retry — do not re-charge Deepgram or
 * Anthropic for work that already landed.
 *
 *   - transcript exists      → skip download + transcribe + Update#1
 *   - summary exists         → skip summarize + Update#2
 *   - both exist + options off → no-op (and no API calls)
 *
 * ## Status semantics
 *
 * This function does NOT set `status: PROCESSING` on entry. Callers do that
 * when they transition the Meeting into the active pipeline (webhook handler
 * on `bot.status_change → done`, cron when polling Recall finds `done`).
 * The function flips to `READY` after Update#1 lands.
 *
 * ## Error semantics
 *
 *   - Fatal failure (transcribe stage or earlier) → `status: ERROR` + `errorMessage`.
 *   - Partial failure (summarize stage) → `summaryError` set, `status` stays `READY`.
 *
 * ## Audio URL
 *
 * Always fetched via `RecallAiService.getBot(externalBotId)`. Callers do NOT
 * pass `audioUrl` — fonte única elimina divergência ("which audioUrl is the
 * caller using?" debug class).
 */

export interface ProcessRecordingOptions {
  /** Transcribe step. Default: true. */
  autoTranscribe?: boolean;
  /** Summarize step. Default: true. Skipped when transcript is empty. */
  autoSummarize?: boolean;
  /** Generate next-step suggestions via Anthropic. Default: false. */
  generateNextSteps?: boolean;
  /** Generate strategic suggestions via Anthropic. Default: false. */
  generateSuggestions?: boolean;
  /** Save the meeting into the Knowledge base after summarize. Default: false. */
  saveToKnowledge?: boolean;
}

const DEFAULT_OPTIONS: Required<ProcessRecordingOptions> = {
  autoTranscribe: true,
  autoSummarize: true,
  generateNextSteps: false,
  generateSuggestions: false,
  saveToKnowledge: false,
};

export async function processRecording(
  meetingId: string,
  options?: ProcessRecordingOptions,
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    console.error("[processRecording] meeting not found", { meetingId });
    return;
  }
  if (!meeting.externalBotId) {
    console.error("[processRecording] missing externalBotId; cannot fetch audio", {
      meetingId,
    });
    return;
  }

  try {
    // ─── Transcribe stage (skip if transcript already present) ─────────
    if (!meeting.transcript && opts.autoTranscribe) {
      const service = await RecallAiService.fromIntegration();
      if (!service) throw new Error("Recall.ai integration not connected");

      const bot = await service.getBot(meeting.externalBotId);
      if (!bot.audio_url) {
        // Bot status reported done but audio not ready — likely a webhook
        // arriving slightly before Recall finishes uploading. Cron retry
        // will pick it up; don't error out here.
        return;
      }

      const audioRes = await fetch(bot.audio_url);
      if (!audioRes.ok) {
        throw new Error(`audio download failed: HTTP ${audioRes.status}`);
      }

      const buffer = Buffer.from(await audioRes.arrayBuffer());
      const { writeFile, unlink } = await import("fs/promises");
      const { join } = await import("path");
      const { tmpdir } = await import("os");
      const tmpPath = join(tmpdir(), `recall-${meeting.externalBotId}.mp4`);
      await writeFile(tmpPath, buffer);

      let transcriptText = "";
      try {
        const { transcribeAudio } = await import(
          "@/lib/audios/audio-transcriber"
        );
        transcriptText = await transcribeAudio(tmpPath);
      } finally {
        await unlink(tmpPath).catch(() => {});
      }

      const duration =
        meeting.startedAt && meeting.endedAt
          ? (meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000
          : null;

      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          transcript: transcriptText || null,
          chunkCount: transcriptText
            ? Math.ceil(transcriptText.length / 1000)
            : 0,
          audioFileUrl: bot.audio_url,
          audioMimeType: "audio/mp4",
          duration,
          status: "READY",
          processedAt: new Date(),
        },
      });

      // Refresh local copy — `meeting.transcript` is now non-null.
      const refreshed = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });
      if (refreshed) meeting = refreshed;
    }

    // ─── Summarize stage (skip if summary already present) ─────────────
    if (!meeting.summary && opts.autoSummarize && meeting.transcript) {
      try {
        const { summarizeMeeting } = await import(
          "@/lib/meetings/meeting-summarizer"
        );
        const summary = await summarizeMeeting(
          meeting.transcript,
          meeting.title,
        );

        let actionItems = summary.actionItems as unknown as Prisma.InputJsonValue;
        let keyTopics = summary.keyTopics;

        // ─── Optional insights ───────────────────────────────────────
        if (opts.generateNextSteps || opts.generateSuggestions) {
          try {
            const { generateMeetingInsights } = await import(
              "@/lib/meetings/meeting-summarizer"
            );
            const insights = await generateMeetingInsights(
              meeting.transcript,
              summary.summary,
              meeting.title,
              {
                generateNextSteps: opts.generateNextSteps,
                generateSuggestions: opts.generateSuggestions,
              },
            );
            const merged = ((summary.actionItems ?? []) as Array<
              Record<string, unknown>
            >).slice();
            if (insights.nextSteps?.length) {
              for (const step of insights.nextSteps) {
                merged.push({
                  text: step,
                  assignee: null,
                  dueDate: null,
                  completed: false,
                  type: "next_step",
                });
              }
            }
            actionItems = merged as unknown as Prisma.InputJsonValue;
            keyTopics = [
              ...summary.keyTopics,
              ...(insights.suggestions || []).map((s) => `💡 ${s}`),
            ];
          } catch (insightsErr) {
            // Insights are best-effort; failure here doesn't poison the
            // base summary. Log but don't surface.
            console.error("[processRecording] insights failed (non-fatal)", {
              meetingId,
              error:
                insightsErr instanceof Error
                  ? insightsErr.message
                  : String(insightsErr),
            });
          }
        }

        await prisma.meeting.update({
          where: { id: meetingId },
          data: {
            summary: summary.summary,
            actionItems,
            keyTopics,
            // Clear any prior summary failure marker now that we succeeded.
            summaryError: null,
          },
        });
      } catch (summarizeErr) {
        const msg =
          summarizeErr instanceof Error
            ? summarizeErr.message
            : String(summarizeErr);
        console.error("[processRecording] summarize failed", {
          meetingId,
          error: msg,
        });
        // Partial failure: transcript is fine, summary missing. Surface the
        // reason on the Meeting row; status stays READY.
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { summaryError: msg },
        });
      }
    }

    // ─── Knowledge save (best-effort, gated by option) ────────────────
    if (opts.saveToKnowledge) {
      try {
        const { saveMeetingToKnowledge } = await import(
          "@/lib/meetings/meeting-knowledge"
        );
        await saveMeetingToKnowledge(meetingId);
      } catch (knowledgeErr) {
        // Knowledge save is best-effort — same convention as pre-8.5 code.
        console.error("[processRecording] knowledge save failed (non-fatal)", {
          meetingId,
          error:
            knowledgeErr instanceof Error
              ? knowledgeErr.message
              : String(knowledgeErr),
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[processRecording] fatal pipeline failure", {
      meetingId,
      error: msg,
    });
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: "ERROR",
        errorMessage: msg,
      },
    });
  }
}
