import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { emitDomainEvent } from "@/lib/domain-events";
import {
  RechargeWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

/**
 * Sub-etapa 10 (revised) — Recharge webhook ingress.
 *
 * Upgrades the previous synchronous handler to the dedup + outbox pattern
 * established in Sub-etapa 6 (Gorgias) and Sub-etapa 8 (Intercom). At-least-
 * once delivery from Recharge is normalized to exactly-once acceptance via
 * `webhook_dedup` (unique on `provider, event_id`), and downstream processing
 * happens asynchronously via the domain-events worker.
 *
 * Pipeline (target ack < 500ms):
 *   1. HMAC verify (`RechargeWebhookVerifier` — Sub-etapa 5).
 *      Recharge signing is `sha256(client_secret + body)` literal concat,
 *      NOT HMAC — see verifier doc + anti-HMAC test guarding against
 *      accidental `createHmac` "fixes".
 *   2. Parse + extract event_id from `payload.id` (top-level).
 *   3. Resolve tenant via `MemberConnection` lookup.
 *   4. Fast-path dedup check.
 *   5. Atomic transaction: insert `webhook_dedup` + emit `webhook.recharge`
 *      domain event. Unique-violation race is treated as duplicate.
 *   6. 200 `{ status: "accepted" }`.
 *
 * Heavy work (writing `IntegrationWebhookEvent`, future mapper → canonical
 * billing tables) runs asynchronously via the domain-events worker invoking
 * `rechargeHandler`.
 */

const verifier = new RechargeWebhookVerifier(
  process.env.RECHARGE_WEBHOOK_SECRET ?? "",
);

const PROVIDER = "recharge" as const;
const EVENT_TYPE = "webhook.recharge" as const;

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
  if (Array.isArray(target)) {
    return target.includes("provider") && target.includes("eventId");
  }
  return typeof target === "string" && target.includes("provider");
}

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const headers = headersToRecord(request);

  // 1. Signature verify.
  const verification = await verifier.verify(rawBody, headers);
  if (!verification.ok) {
    return apiError(verification.reason, verification.statusCode);
  }

  // 2. Parse + extract event_id from `payload.id`.
  let parsed: { id?: unknown };
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return apiError("invalid JSON body", 400);
  }

  const eventId =
    typeof parsed.id === "string"
      ? parsed.id
      : typeof parsed.id === "number"
        ? String(parsed.id)
        : null;
  if (!eventId) {
    return apiError("payload.id required for webhook deduplication", 400);
  }

  // Topic header is the canonical Recharge event type signal.
  const rechargeEventType = headers["x-recharge-topic"] ?? "unknown";

  // 3. Tenant resolution.
  const tenant = await resolveTenantFromPayload(PROVIDER, parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  // 4. Fast-path dedup.
  const seen = await prisma.webhookDedup.findUnique({
    where: { provider_eventId: { provider: PROVIDER, eventId } },
    select: { id: true },
  });
  if (seen) {
    return apiSuccess({ status: "duplicate" });
  }

  // 5. Atomic insert + emit.
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
            recharge_event_type: rechargeEventType,
            recharge_event_id: eventId,
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
    console.error("POST /api/webhooks/recharge dedup+emit error:", e);
    return apiError("Failed to record webhook", 500);
  }

  return apiSuccess({ status: "accepted" });
}
