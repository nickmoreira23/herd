import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecallWebhookVerifier } from "@/lib/webhooks";

// Recall.ai delegates webhook delivery to Svix; signature format follows Svix
// conventions (HMAC-SHA256 over `${id}.${timestamp}.${body}`, key derived
// from the `whsec_` secret). See `RecallWebhookVerifier` for details.
const verifier = new RecallWebhookVerifier(
  process.env.RECALL_WEBHOOK_SECRET ?? "",
);

function headersToRecord(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

/**
 * POST — Handle Recall.ai webhook events for bot lifecycle.
 *
 * Events handled:
 *   - bot.status_change  (in_call_recording, call_ended, done, fatal)
 *
 * When a recording completes, async processing is triggered to download
 * audio, transcribe, and summarize the meeting.
 *
 * Tenant scope: `Meeting` is NOT in `TENANT_SCOPED_MODELS` — recordings are
 * not tenant-isolated at this stage. The handler therefore does not call
 * `resolveTenantFromPayload` / `withTenant`. If/when `Meeting` becomes
 * tenant-scoped, add the tenant resolution shim here (likely via the owning
 * `NetworkProfile` → `Organization` chain rather than `MemberConnection`).
 */
export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const headers = headersToRecord(req);

  const verification = await verifier.verify(rawBody, headers);
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.reason },
      { status: verification.statusCode },
    );
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { event, data } = body;

  // Must have a bot_id to look up the meeting
  if (!data || typeof data.bot_id !== "string") {
    return NextResponse.json({ ok: true });
  }

  const meeting = await prisma.meeting.findFirst({
    where: { externalBotId: data.bot_id },
  });

  if (!meeting) {
    return NextResponse.json({ ok: true });
  }

  switch (event) {
    case "bot.status_change": {
      const status = (data.status as { code?: string } | undefined)?.code;

      if (status === "in_call_recording") {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: "RECORDING", startedAt: new Date() },
        });
      } else if (status === "call_ended" || status === "done") {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: "PROCESSING", endedAt: new Date() },
        });
        // Trigger async processing (don't await — webhook should return fast)
        processRecording(meeting.id, data.bot_id).catch(console.error);
      } else if (status === "fatal") {
        const message =
          (data.status as { message?: string } | undefined)?.message ??
          "Bot encountered a fatal error";
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            status: "ERROR",
            errorMessage: message,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Download the recording audio from the Recall.ai bot, transcribe it
 * with Deepgram, and run AI summarization.
 */
async function processRecording(
  meetingId: string,
  botId: string,
): Promise<void> {
  try {
    const { RecallAiService } = await import("@/lib/services/recall-ai");
    const service = await RecallAiService.fromIntegration();
    if (!service) throw new Error("Recall.ai not connected");

    const bot = await service.getBot(botId);

    if (bot.audio_url) {
      const audioRes = await fetch(bot.audio_url);
      if (audioRes.ok) {
        const buffer = Buffer.from(await audioRes.arrayBuffer());

        // Write to a temp file so the transcriber can read it
        const { writeFile, unlink } = await import("fs/promises");
        const { join } = await import("path");
        const { tmpdir } = await import("os");
        const tmpPath = join(tmpdir(), `recall-${botId}.mp4`);
        await writeFile(tmpPath, buffer);

        const { transcribeAudio } = await import(
          "@/lib/audios/audio-transcriber"
        );
        const transcriptText = await transcribeAudio(tmpPath);

        // Clean up temp file
        await unlink(tmpPath).catch(() => {});

        // Calculate duration from startedAt / endedAt
        const m = await prisma.meeting.findUnique({
          where: { id: meetingId },
        });
        const duration =
          m?.startedAt && m?.endedAt
            ? (m.endedAt.getTime() - m.startedAt.getTime()) / 1000
            : null;

        await prisma.meeting.update({
          where: { id: meetingId },
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
            m?.title || "Virtual Meeting",
          );
          await prisma.meeting.update({
            where: { id: meetingId },
            data: {
              summary: summary.summary,
              actionItems: summary.actionItems,
              keyTopics: summary.keyTopics,
            },
          });
        } catch {
          // Summary is optional — meeting is still READY
        }
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Processing failed";
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "ERROR", errorMessage: message },
    });
  }
}
