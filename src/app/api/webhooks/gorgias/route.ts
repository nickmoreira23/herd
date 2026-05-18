import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { emitDomainEvent } from "@/lib/domain-events";
import {
  GorgiasWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

/**
 * Sub-etapa 6 — Gorgias webhook ingress.
 *
 * Pipeline (target ack < 500ms):
 *   1. HMAC verify (Sub-etapa 5).
 *   2. Parse + validate payload (extract event_id from `id`).
 *   3. Resolve tenant via `MemberConnection` lookup.
 *   4. Fast-path dedup check — return 200 immediately if already seen.
 *   5. Atomic transaction: insert `webhook_dedup` row + emit `webhook.gorgias`
 *      domain event. Unique-constraint race on (provider, event_id) is
 *      caught and treated as a duplicate (concurrent retry from provider).
 *   6. 200 `{ status: "accepted" }`.
 *
 * Heavy work (writing `IntegrationWebhookEvent`, downstream side-effects)
 * runs asynchronously via `domain-events` worker → `gorgiasHandler`.
 */

const verifier = new GorgiasWebhookVerifier(
  process.env.GORGIAS_WEBHOOK_SECRET ?? "",
);

const PROVIDER = "gorgias" as const;
const EVENT_TYPE = "webhook.gorgias" as const;

function headersToRecord(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function isPrismaUniqueViolation(
  err: unknown,
  targetConstraint: string,
): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { target?: unknown } };
  if (e.code !== "P2002") return false;
  const target = e.meta?.target;
  // `target` may be a string (constraint name) or array of column names —
  // accept either shape that mentions our intended constraint.
  if (typeof target === "string") return target === targetConstraint;
  if (Array.isArray(target)) {
    return (
      target.includes("provider") && target.includes("event_id")
    );
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
  let parsed: { id?: unknown; event?: unknown; type?: unknown };
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return apiError("invalid JSON body", 400);
  }

  const eventId = typeof parsed.id === "string" ? parsed.id : null;
  if (!eventId) {
    // Dedup needs a stable event identifier. A composite hash would be
    // fragile (fields can vary between deliveries of the same event), so
    // reject instead of synthesizing one.
    return apiError("payload.id required for webhook deduplication", 400);
  }

  const gorgiasEventType =
    typeof parsed.event === "string"
      ? parsed.event
      : typeof parsed.type === "string"
        ? parsed.type
        : "unknown";

  // 3. Tenant resolution.
  const tenant = await resolveTenantFromPayload(PROVIDER, parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  // 4. Fast-path dedup check (best-effort — race-condition safety net
  //    is the unique constraint in step 5).
  const seen = await prisma.webhookDedup.findUnique({
    where: { provider_eventId: { provider: PROVIDER, eventId } },
    select: { id: true },
  });
  if (seen) {
    return apiSuccess({ status: "duplicate" });
  }

  // 5. Atomic insert + emit. The dedup row and the outbox event must land
  //    together — committing one without the other leaves an inconsistent
  //    ledger. Concurrent retries from Gorgias race here; the loser hits a
  //    unique-violation and we swallow it as a duplicate.
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
            gorgias_event_type: gorgiasEventType,
            gorgias_event_id: eventId,
            body: parsed,
          },
        },
        tx,
      );
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e, "webhook_dedup_provider_event_id_key")) {
      return apiSuccess({ status: "duplicate" });
    }
    console.error("POST /api/webhooks/gorgias dedup+emit error:", e);
    return apiError("Failed to record webhook", 500);
  }

  return apiSuccess({ status: "accepted" });
}
