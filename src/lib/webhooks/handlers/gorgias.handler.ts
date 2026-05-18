import type { DomainEvent } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 6 — Gorgias outbox handler.
 *
 * Invoked by the `domain-events` worker for events with `eventType === "webhook.gorgias"`.
 * Each event represents one accepted Gorgias delivery; the dedup ledger
 * (`webhook_dedup`) guaranteed exactly-once acceptance at the ingress, and
 * domain-events' attempts counter + `idempotencyKey` give us at-most-once
 * application-level processing on top.
 *
 * The handler dispatches by `payload.gorgias_event_type` so that one entry in
 * `HANDLER_REGISTRY` covers every Gorgias sub-event (ticket.created,
 * customer.updated, etc.) — no wildcard registry needed.
 *
 * Tenant context: `event.aggregateId` holds the tenant UUID (set at emit
 * time). Operations on tenant-scoped tables (IWE) MUST run inside
 * `withTenant(...)` — the Prisma Extension sets the `app.tenant_id` GUC
 * so RLS allows the write. Without this wrap, RLS rejects the INSERT.
 */

interface GorgiasOutboxPayload {
  tenantId: string;
  gorgias_event_type: string;
  gorgias_event_id: string;
  body: unknown;
}

function isGorgiasPayload(value: unknown): value is GorgiasOutboxPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tenantId === "string" &&
    typeof v.gorgias_event_type === "string" &&
    typeof v.gorgias_event_id === "string"
  );
}

export async function gorgiasHandler(
  event: DomainEvent,
  client: PrismaClient | Prisma.TransactionClient,
): Promise<void> {
  if (!isGorgiasPayload(event.payload)) {
    throw new Error(
      `gorgias handler: invalid payload shape for event ${event.id}`,
    );
  }

  // aggregateId is the tenantId UUID, set when the route emitted the event.
  // Cross-check against payload.tenantId for defense-in-depth — these should
  // always agree; mismatch indicates a producer bug worth surfacing loudly.
  if (event.aggregateId !== event.payload.tenantId) {
    throw new Error(
      `gorgias handler: aggregateId/payload.tenantId mismatch for event ${event.id}`,
    );
  }

  const { gorgias_event_type, body } = event.payload;

  await withTenant(event.aggregateId, async () => {
    // Note: `client` may be the runtime singleton OR a tx client. The runtime
    // singleton carries the tenant-scoping Extension; a tx opened from it
    // inherits the extension. Either way, the IWE INSERT below sees the
    // `app.tenant_id` GUC set via the Extension's implicit $transaction.
    const integration = await client.integration.findUnique({
      where: { slug: "gorgias" },
    });
    if (!integration) {
      throw new Error("gorgias handler: integration row 'gorgias' is missing");
    }

    await client.integrationWebhookEvent.create({
      data: {
        // tenantId is injected by the Extension from withTenant context.
        // Explicit cast through unknown because the Prisma generated type
        // marks the field as required after IWE NOT NULL (Sub-etapa 6).
        integrationId: integration.id,
        eventType: gorgias_event_type,
        payload: JSON.stringify(body),
      } as unknown as Prisma.IntegrationWebhookEventCreateInput,
    });
  });
}
