import type { DomainEvent } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 10 (revised) — Recharge outbox handler.
 *
 * Invoked by the `domain-events` worker for events with
 * `eventType === "webhook.recharge"`. Replicates the Gorgias / Intercom
 * pattern (Sub-etapas 6 / 8): one entry in `HANDLER_REGISTRY`, internal
 * dispatch by `payload.recharge_event_type`.
 *
 * Scope: writes the raw payload to `IntegrationWebhookEvent` in the
 * tenant scope. The raw → canonical billing mapping (Charge / Subscription
 * / BillingCustomer normalization) is Sub-etapa 11.
 *
 * Tenant context: `event.aggregateId` holds the tenant UUID. IWE writes
 * MUST run inside `withTenant(...)` — the Prisma Extension sets the
 * `app.tenant_id` GUC so RLS allows the write.
 */

interface RechargeOutboxPayload {
  tenantId: string;
  recharge_event_type: string;
  recharge_event_id: string;
  body: unknown;
}

function isRechargePayload(value: unknown): value is RechargeOutboxPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tenantId === "string" &&
    typeof v.recharge_event_type === "string" &&
    typeof v.recharge_event_id === "string"
  );
}

export async function rechargeHandler(
  event: DomainEvent,
  client: PrismaClient | Prisma.TransactionClient,
): Promise<void> {
  if (!isRechargePayload(event.payload)) {
    throw new Error(
      `recharge handler: invalid payload shape for event ${event.id}`,
    );
  }

  if (event.aggregateId !== event.payload.tenantId) {
    throw new Error(
      `recharge handler: aggregateId/payload.tenantId mismatch for event ${event.id}`,
    );
  }

  const { recharge_event_type, body } = event.payload;

  await withTenant(event.aggregateId, async () => {
    const integration = await client.integration.findUnique({
      where: { slug: "recharge" },
    });
    if (!integration) {
      throw new Error(
        "recharge handler: integration row 'recharge' is missing (run npm run seed:recharge)",
      );
    }

    await client.integrationWebhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: recharge_event_type,
        payload: JSON.stringify(body),
      } as unknown as Prisma.IntegrationWebhookEventCreateInput,
    });
  });
}
