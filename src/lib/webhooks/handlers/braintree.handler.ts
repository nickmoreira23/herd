import type { DomainEvent, Prisma, PrismaClient } from "@prisma/client";
import { withTenant } from "@/lib/tenancy/context";
import {
  upsertBraintreePaymentProvider,
  mapBraintreeCustomer,
  mapBraintreeSubscription,
  mapBraintreeCharge,
  mapBraintreePaymentMethod,
  type BraintreeTransactionPayload,
  type BraintreeSubscriptionPayload,
  type BraintreeCustomerPayload,
} from "@/lib/mappers/braintree";

/**
 * Sub-etapa 15 — Braintree outbox handler (dispatcher).
 *
 * Refactored from the Sub-etapa 14 V1 raw-only shim into a topic dispatcher
 * mirroring `recharge.handler.ts` (Sub-etapa 11). Per-kind flow:
 *
 *   1. Upsert `PaymentProvider` catalog row (idempotent).
 *   2. Resolve `BillingCustomer` from kind-specific payload + fallback stub
 *      (sample notifications lack customer.id; production payloads have it).
 *   3. Map the entity (Subscription / Charge / PaymentMethod).
 *
 * The raw `IntegrationWebhookEvent` already happened upstream in the route
 * handler (Sub-etapa 14). This handler only writes canonical billing rows.
 *
 * Skipped V1 (tech debt em AGENTS.md):
 *   - `BillingEvent` audit row (deferred; entityId @db.Uuid incompatível com
 *     dispute.id; Subscription/Charge têm UUIDs válidos mas BillingEvent
 *     adoption fica para Sub-etapa 17 smoke).
 *   - Refund mapping (no manifest topic V1).
 *   - DunningAttempt (no `subscription_charged_unsuccessfully` mapping V1).
 *   - ChargeLineItem (Braintree não tem split equivalente Recharge).
 *
 * Errors propagate to the outbox worker triggering retry-with-backoff.
 * Tenant context: handler runs under `withTenant(event.aggregateId, ...)`
 * so the Prisma Extension sets the `app.tenant_id` GUC for RLS.
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

type Client = PrismaClient | Prisma.TransactionClient;

interface DispatchCtx {
  tenantId: string;
  providerId: string;
}

export async function braintreeHandler(
  event: DomainEvent,
  client: Client,
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
  const body = event.payload.body;

  await withTenant(tenantId, async () => {
    const providerId = await upsertBraintreePaymentProvider(client, tenantId);
    const ctx: DispatchCtx = { tenantId, providerId };

    // Sub-etapa 17.0.5 fix — unwrap subject.
    //
    // Route handler emits `payload.body = notification.subject`, which is a
    // **wrapper** — `{transaction: {...}}` for transaction_* kinds,
    // `{subscription: {...}}` for subscription_*, `{dispute: {...}}` for
    // dispute_*. Previously the dispatcher cast `body` directly as the
    // entity type, so `body.status` was undefined and
    // `mapBraintreeChargeStatus` crashed with
    // `Cannot read properties of undefined (reading 'toLowerCase')`.
    //
    // The route's emit shape is correct (preserves the full SDK subject
    // for reprocessing / future fields); the handler must unwrap.
    const subject = body as Record<string, unknown> | null | undefined;

    if (kind.startsWith("subscription_")) {
      const subscription = subject?.subscription as
        | BraintreeSubscriptionPayload
        | undefined;
      if (!subscription) {
        throw new Error(
          `braintree handler: kind=${kind} missing subject.subscription`,
        );
      }
      await dispatchSubscriptionEvent(client, subscription, ctx);
    } else if (kind.startsWith("transaction_")) {
      const transaction = subject?.transaction as
        | BraintreeTransactionPayload
        | undefined;
      if (!transaction) {
        throw new Error(
          `braintree handler: kind=${kind} missing subject.transaction`,
        );
      }
      await dispatchTransactionEvent(client, transaction, ctx);
    } else if (kind.startsWith("dispute_")) {
      // V1: dispute canonical mapping deferred. IWE raw row já preserva o
      // payload completo upstream. Tech debt: canonical Dispute table.
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[braintree.handler] dispute kind=${kind} subject=${subjectId} — audit-only via IWE (V1)`,
        );
      }
    } else {
      console.warn(
        `[braintree.handler] Unknown kind "${kind}" (subject=${subjectId}). Raw IWE only.`,
      );
    }
  });
}

async function dispatchSubscriptionEvent(
  client: Client,
  subscription: BraintreeSubscriptionPayload,
  ctx: DispatchCtx,
): Promise<void> {
  const customerId = await ensureBraintreeCustomerByExternalId(
    client,
    subscription.customerId,
    ctx,
  );

  await mapBraintreeSubscription(client, subscription, { ...ctx, customerId });

  // `subscription_charged_successfully` includes embedded transactions[].
  if (subscription.transactions && subscription.transactions.length > 0) {
    for (const txn of subscription.transactions) {
      await mapBraintreeCharge(client, txn, { ...ctx, customerId });
      await mapBraintreePaymentMethod(client, txn, { ...ctx, customerId });
    }
  }
}

async function dispatchTransactionEvent(
  client: Client,
  transaction: BraintreeTransactionPayload,
  ctx: DispatchCtx,
): Promise<void> {
  const externalCustomerId =
    transaction.customer?.id ?? transaction.customerId;
  const customerId = await ensureBraintreeCustomerByExternalId(
    client,
    externalCustomerId,
    ctx,
  );

  await mapBraintreeCharge(client, transaction, { ...ctx, customerId });
  await mapBraintreePaymentMethod(client, transaction, { ...ctx, customerId });
}

/**
 * Resolves BillingCustomer.id from a Braintree external customer id.
 *
 * Production payloads include `customer.id` / `customerId`. Sample
 * notifications via WebhookTesting.sampleNotification omit it (Sub-etapa
 * 14 discovery). When missing, falls back to a synthetic stub per tenant
 * (`tenant_${tenantId}_fallback`) so the rest of the dispatch chain can
 * complete and canonical Subscription/Charge rows land with valid FKs.
 *
 * The fallback stub is idempotent — repeated sample replays converge on
 * the same row.
 */
async function ensureBraintreeCustomerByExternalId(
  client: Client,
  externalCustomerId: string | undefined,
  ctx: DispatchCtx,
): Promise<string> {
  if (externalCustomerId) {
    const stub: BraintreeCustomerPayload = { id: externalCustomerId };
    return mapBraintreeCustomer(client, stub, ctx);
  }

  const fallback = await client.billingCustomer.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: `tenant_${ctx.tenantId}_fallback`,
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: `tenant_${ctx.tenantId}_fallback`,
      email: null,
      name: "Unknown Customer (Braintree sample fallback)",
      providerData: {
        source: "braintree_sample_fallback",
      } as unknown as Prisma.InputJsonValue,
    },
    update: {},
    select: { id: true },
  });
  return fallback.id;
}
