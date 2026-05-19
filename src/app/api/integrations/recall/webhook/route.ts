import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecallWebhookVerifier } from "@/lib/webhooks";
import { processRecording } from "@/lib/meetings/process-recording";

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
 * Tenant scope: `Meeting` is NOT in `TENANT_SCOPED_MODELS` — recordings are
 * not tenant-isolated. The handler therefore does not call
 * `resolveTenantFromPayload` / `withTenant`. See AGENTS.md
 * "Recall integration — divergência arquitetural consciente" for the
 * conscious-divergence rationale.
 *
 * Sub-etapa 8.5: the heavy-lifting pipeline (download + transcribe +
 * summarize) is delegated to the canonical `processRecording` in
 * `src/lib/meetings/process-recording.ts`. This route still owns:
 *   - signature verification
 *   - the synchronous Meeting status state machine (so the UI sees the
 *     state flip immediately, without waiting on the worker that
 *     processRecording uses)
 *   - kicking off processRecording fire-and-forget for `call_ended`/`done`
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
        // Fire-and-forget — webhook should return fast. The canonical
        // pipeline is idempotent by step, so a retry from Recall or a
        // cron-orphan recovery pass won't duplicate Deepgram/Anthropic
        // work. Webhook path uses defaults (no insights, no knowledge
        // save) — knowledge save is preserved as the cron-with-agent
        // path's concern (Sub-etapa 8.5 behavior preservation).
        processRecording(meeting.id).catch((err) =>
          console.error("[recall/webhook] processRecording failed", {
            meetingId: meeting.id,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
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
