import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { emitDomainEvent } from "@/lib/domain-events";
import {
  IntercomWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

/**
 * Sub-etapa 8 — Intercom webhook ingress.
 *
 * Mirrors the Sub-etapa 6 Gorgias pipeline:
 *   1. HMAC-SHA256 verify with `X-Hub-Signature: sha256=<hex>` (Sub-etapa 5).
 *   2. Parse + extract event_id from `payload.id`. 400 if absent.
 *   3. Resolve tenant via `MemberConnection` lookup.
 *   4. Fast-path dedup check on `(provider, event_id)`.
 *   5. Atomic transaction: `webhook_dedup.create` + `emitDomainEvent`.
 *      Unique-constraint race on concurrent Intercom retry → caught as
 *      duplicate (`P2002`).
 *   6. 200 `{ status: "accepted" }`.
 *
 * Heavy work (writing IWE, downstream side-effects) runs asynchronously
 * via `domain-events` worker → `intercomHandler`.
 */

const verifier = new IntercomWebhookVerifier(
  process.env.INTERCOM_WEBHOOK_SECRET ?? "",
);

const PROVIDER = "intercom" as const;
const EVENT_TYPE = "webhook.intercom" as const;

function headersToRecord(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function isPrismaUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { target?: unknown } };
  if (e.code !== "P2002") return false;
  const target = e.meta?.target;
  if (typeof target === "string") {
    return target === "webhook_dedup_provider_event_id_key";
  }
  if (Array.isArray(target)) {
    return target.includes("provider") && target.includes("event_id");
  }
  return false;
}

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const headers = headersToRecord(request);

  // 1. HMAC verify.
  const verification = await verifier.verify(rawBody, headers);
  if (!verification.ok) {
    return apiError(verification.reason, verification.statusCode);
  }

  // 2. Parse + extract event_id.
  let parsed: { id?: unknown; topic?: unknown };
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return apiError("invalid JSON body", 400);
  }

  const eventId = typeof parsed.id === "string" ? parsed.id : null;
  if (!eventId) {
    // Intercom webhook deliveries carry a top-level `id`. Synthesizing a
    // composite hash from other fields is fragile (Intercom's payload
    // shape varies by topic) — reject explicitly rather than fall back.
    return apiError("payload.id required for webhook deduplication", 400);
  }

  const intercomTopic =
    typeof parsed.topic === "string" ? parsed.topic : "unknown";

  // 3. Tenant resolution.
  const tenant = await resolveTenantFromPayload(PROVIDER, parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  // 4. Fast-path dedup check. The unique constraint in step 5 is the real
  //    safety net against concurrent retries.
  const seen = await prisma.webhookDedup.findUnique({
    where: { provider_eventId: { provider: PROVIDER, eventId } },
    select: { id: true },
  });
  if (seen) {
    return apiSuccess({ status: "duplicate" });
  }

  // 5. Atomic dedup + outbox emit. Same transaction or nothing.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.webhookDedup.create({
        data: { provider: PROVIDER, eventId },
      });

      await emitDomainEvent(
        {
          aggregateType: "webhook",
          aggregateId: tenant.tenantId,
          eventType: EVENT_TYPE,
          payload: {
            tenantId: tenant.tenantId,
            intercom_topic: intercomTopic,
            intercom_event_id: eventId,
            body: parsed,
          },
        },
        tx,
      );
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      return apiSuccess({ status: "duplicate" });
    }
    console.error("POST /api/webhooks/intercom dedup+emit error:", e);
    return apiError("Failed to record webhook", 500);
  }

  return apiSuccess({ status: "accepted" });
}
