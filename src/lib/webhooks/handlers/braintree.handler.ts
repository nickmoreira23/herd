import type { DomainEvent, Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 14 — Braintree outbox handler (V1 raw-only).
 *
 * The route handler already wrote the raw `IntegrationWebhookEvent`
 * (atomic with `webhook_dedup` + outbox emit). This handler is intentionally
 * a no-op observability shim — it confirms the outbox round-trip works and
 * runs withTenant for future side effects.
 *
 * Sub-etapa 15 will refactor this into a dispatcher (mirroring
 * `recharge.handler.ts` Sub-etapa 11 shape):
 *   - Upsert `PaymentProvider` catalog row.
 *   - Resolve `BillingCustomer` from `subject.transaction.customer` /
 *     `subject.subscription.customerId` / etc.
 *   - Invoke mapper per kind (`mapBraintreeTransaction`,
 *     `mapBraintreeSubscription`, `mapBraintreeDispute`).
 *   - Write `BillingEvent` audit row.
 *
 * Idempotency contract: same as recharge.handler — same event may run
 * multiple times across the system's lifetime. Today the handler does
 * nothing observable, so it's trivially idempotent.
 */

interface BraintreeOutboxPayload {
  tenantId: string;
  braintree_kind: string;
  braintree_subject_id: string;
  braintree_timestamp: string;
  body: unknown;
}

function isBraintreePayload(value: unknown): value is BraintreeOutboxPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tenantId === "string" &&
    typeof v.braintree_kind === "string" &&
    typeof v.braintree_subject_id === "string" &&
    typeof v.braintree_timestamp === "string"
  );
}

export async function braintreeHandler(
  event: DomainEvent,
  _client: PrismaClient | Prisma.TransactionClient,
): Promise<void> {
  if (!isBraintreePayload(event.payload)) {
    throw new Error(
      `braintree handler: invalid payload shape for event ${event.id}`,
    );
  }
  if (event.aggregateId !== event.payload.tenantId) {
    throw new Error(
      `braintree handler: aggregateId/payload.tenantId mismatch for event ${event.id}`,
    );
  }

  const tenantId = event.aggregateId;
  const kind = event.payload.braintree_kind;
  const subjectId = event.payload.braintree_subject_id;

  await withTenant(tenantId, async () => {
    // V1 raw-only — IWE already written upstream in the route handler.
    // Sub-etapa 15 will add mapper dispatch + BillingEvent audit here.
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[braintree.handler] V1 raw-only — kind=${kind} subject=${subjectId}`,
      );
    }
  });
}
