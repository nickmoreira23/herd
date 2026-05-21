import type { DomainEvent } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";
import {
  upsertRechargePaymentProvider,
  mapRechargeCustomer,
  mapRechargeSubscription,
  mapRechargeCharge,
  mapRechargeOrder,
  mapRechargeRefund,
  type RechargeCustomerPayload,
  type RechargeSubscriptionPayload,
  type RechargeChargePayload,
  type RechargeOrderPayload,
  type RechargeRefundPayload,
} from "@/lib/mappers/recharge";

/**
 * Sub-etapa 11 — Recharge outbox handler with mapper dispatch.
 *
 * Refactored from the Sub-etapa 10 raw-IWE-only handler into a topic
 * dispatcher that drives canonical billing tables via mappers.
 *
 * Per-topic flow:
 *   1. Upsert PaymentProvider catalog row (idempotent).
 *   2. Resolve BillingCustomer (upsert from payload OR stub by external id).
 *   3. Map the entity (Subscription / Charge / Refund / Order).
 *   4. Persist raw IntegrationWebhookEvent for legacy parity (Sub-etapa 10).
 *   5. Persist BillingEvent audit row (one per processed payload).
 *
 * Errors propagate to the domain-events outbox worker, triggering its
 * retry-with-backoff contract. Loud-fail over silent-skip.
 *
 * Tenant context: handler runs under `withTenant(event.aggregateId, ...)`.
 * The Prisma Extension on the runtime client sets the `app.tenant_id` GUC
 * so RLS allows writes to the 11 tenant-scoped billing tables.
 *
 * Pattern reference: gorgias.handler.ts (Sub-etapa 6), with the added
 * mapper layer between dispatch and persistence.
 */

interface RechargeOutboxPayload {
  tenantId: string;
  recharge_event_type: string;
  recharge_event_id: string;
  body: Record<string, unknown>;
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

  const tenantId = event.aggregateId;
  const topic = event.payload.recharge_event_type;
  const rechargeEventId = event.payload.recharge_event_id;
  const body = event.payload.body;

  await withTenant(tenantId, async () => {
    // Step 1 — ensure PaymentProvider catalog row exists.
    const providerId = await upsertRechargePaymentProvider(client, tenantId);

    // Step 2 — dispatch by topic.
    let entityType = "unknown";
    let entityId: string | null = null;

    try {
      switch (topic) {
        case "subscription/created":
        case "subscription/updated":
        case "subscription/cancelled":
        case "subscription/activated": {
          const subPayload = body as unknown as RechargeSubscriptionPayload;
          const customerId = await ensureCustomerByExternalId(
            client,
            subPayload.customer_id,
            tenantId,
            providerId,
          );
          const subscriptionId = await mapRechargeSubscription(
            client,
            subPayload,
            { tenantId, providerId, customerId },
          );
          entityType = "Subscription";
          entityId = subscriptionId;
          break;
        }

        case "charge/created":
        case "charge/paid":
        case "charge/succeeded":
        case "charge/failed":
        case "charge/refunded": {
          const chargePayload = body as unknown as RechargeChargePayload;
          // Charge payloads carry a `customer` object — upsert full customer
          // row (not a stub) so downstream lookups have email/name.
          const customerId = await mapRechargeCustomer(
            client,
            chargePayload.customer as unknown as RechargeCustomerPayload,
            { tenantId, providerId },
          );
          const chargeId = await mapRechargeCharge(client, chargePayload, {
            tenantId,
            providerId,
            customerId,
          });
          entityType = "Charge";
          entityId = chargeId;
          break;
        }

        case "order/created": {
          const orderPayload = body as unknown as RechargeOrderPayload;
          const customerId = await ensureCustomerByExternalId(
            client,
            orderPayload.customer_id,
            tenantId,
            providerId,
          );
          await mapRechargeOrder(client, orderPayload, {
            tenantId,
            providerId,
            customerId,
          });
          // V1: no canonical Order row — BillingEvent below is the only audit.
          entityType = "Order";
          entityId = null;
          break;
        }

        default:
          console.warn(
            `[recharge.handler] Unknown topic "${topic}" (event=${rechargeEventId}). Persisting raw IWE only.`,
          );
          entityType = "Unknown";
      }

      // Step 3 — raw IWE audit (legacy parity with Sub-etapa 10 handler).
      const integration = await client.integration.findUnique({
        where: { slug: "recharge" },
        select: { id: true },
      });
      if (!integration) {
        throw new Error(
          "recharge handler: integration row 'recharge' is missing (run npm run seed:recharge)",
        );
      }
      await client.integrationWebhookEvent.create({
        data: {
          integrationId: integration.id,
          eventType: topic,
          payload: JSON.stringify(body),
        } as unknown as Prisma.IntegrationWebhookEventCreateInput,
      });

      // Step 4 — BillingEvent audit row (Sub-etapa 11).
      // `entityId` is `@db.Uuid` in the schema — only writable when we
      // landed a canonical row (Subscription/Charge). For Order V1 and
      // Unknown topics we skip the BillingEvent write to avoid invalid
      // UUID casts. Skipping is safe because the raw IWE write above
      // preserves the full payload for any future reprocessing path.
      if (entityId) {
        await client.billingEvent.create({
          data: {
            tenantId,
            providerId,
            eventType: topic,
            entityType,
            entityId,
            payload: body as unknown as Prisma.InputJsonValue,
          } as unknown as Prisma.BillingEventCreateInput,
        });
      }
    } catch (err) {
      console.error(
        `[recharge.handler] Failed to map topic="${topic}" event=${rechargeEventId}:`,
        err,
      );
      throw err;
    }
  });
}

/**
 * Resolves BillingCustomer by external Recharge `customer_id`. If none
 * exists yet, creates a minimal stub (placeholder email). The next event
 * that carries a full `customer` payload (e.g. any `charge/*`) will
 * enrich the row via `mapRechargeCustomer`'s upsert update path.
 */
async function ensureCustomerByExternalId(
  client: PrismaClient | Prisma.TransactionClient,
  externalCustomerId: number,
  tenantId: string,
  providerId: string,
): Promise<string> {
  const existing = await client.billingCustomer.findUnique({
    where: {
      providerId_externalId: {
        providerId,
        externalId: String(externalCustomerId),
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const stub = await client.billingCustomer.create({
    data: {
      tenantId,
      providerId,
      externalId: String(externalCustomerId),
      email: `pending-${externalCustomerId}@stub.recharge`,
      providerData: {},
    },
    select: { id: true },
  });
  return stub.id;
}
