import type { DomainEvent } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 8 — Intercom outbox handler.
 *
 * Mirrors `gorgiasHandler` (Sub-etapa 6) verbatim in structure:
 *  - One handler per provider registered under a single eventType
 *    (`"webhook.intercom"`).
 *  - Sub-event dispatch on `payload.intercom_topic` lives inside the
 *    handler rather than as N entries in the registry — keeps the
 *    registry as `Record<exact-string, handler>` (no wildcards).
 *
 * Tenant context: `event.aggregateId` carries the tenant UUID set at
 * emit-time by the route handler. IWE writes MUST run inside
 * `withTenant(...)` — the Prisma Extension sets `app.tenant_id` so the
 * `iwe_tenant_isolation` policy (Sub-etapa 6) permits the INSERT.
 *
 * The current behavior is paridade with the pre-Sub-etapa 8 synchronous
 * handler: log the event into `IntegrationWebhookEvent` with `eventType
 * = payload.intercom_topic`. Future sub-etapas can add per-topic
 * routing (e.g. conversation.user.replied → message ingestion).
 */

interface IntercomOutboxPayload {
  tenantId: string;
  intercom_topic: string;
  intercom_event_id: string;
  body: unknown;
}

function isIntercomPayload(value: unknown): value is IntercomOutboxPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tenantId === "string" &&
    typeof v.intercom_topic === "string" &&
    typeof v.intercom_event_id === "string"
  );
}

// Topics declared in the Intercom adapter manifest (Sub-etapa 7). The
// switch below short-circuits to the "log to IWE" branch for any of them;
// new topics arriving from Intercom fall to the default arm and emit a
// console.warn but don't fail the event (worker would otherwise mark the
// event failed and retry — undesirable for a purely informational topic
// we haven't routed yet).
const KNOWN_INTERCOM_TOPICS = new Set<string>([
  "conversation.user.created",
  "conversation.user.replied",
  "conversation.admin.replied",
  "conversation.admin.assigned",
  "contact.created",
  "contact.tag.created",
]);

export async function intercomHandler(
  event: DomainEvent,
  client: PrismaClient | Prisma.TransactionClient,
): Promise<void> {
  if (!isIntercomPayload(event.payload)) {
    throw new Error(
      `intercom handler: invalid payload shape for event ${event.id}`,
    );
  }

  if (event.aggregateId !== event.payload.tenantId) {
    throw new Error(
      `intercom handler: aggregateId/payload.tenantId mismatch for event ${event.id}`,
    );
  }

  const { intercom_topic, body } = event.payload;

  if (!KNOWN_INTERCOM_TOPICS.has(intercom_topic)) {
    // Unknown topic — log and ack without raising. Idempotency on retry is
    // automatic because we don't touch state.
    console.warn(
      `intercom handler: unhandled topic "${intercom_topic}" for event ${event.id}`,
    );
    return;
  }

  await withTenant(event.aggregateId, async () => {
    const integration = await client.integration.findUnique({
      where: { slug: "intercom" },
    });
    if (!integration) {
      throw new Error("intercom handler: integration row 'intercom' is missing");
    }

    await client.integrationWebhookEvent.create({
      data: {
        // tenantId is injected by the Extension under withTenant. Cast
        // matches the pattern established in Sub-etapa 6 — Prisma's
        // generated input type marks tenantId required, but the
        // Extension fills it from the GUC at runtime.
        integrationId: integration.id,
        eventType: intercom_topic,
        payload: JSON.stringify(body),
      } as unknown as Prisma.IntegrationWebhookEventCreateInput,
    });
  });
}
