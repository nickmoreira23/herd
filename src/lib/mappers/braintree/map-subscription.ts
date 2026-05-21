import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  BraintreeSubscriptionPayload,
  BraintreeMapperContext,
} from "./types";
import { mapBraintreeSubscriptionStatus } from "./map-subscription-status";

interface MapBraintreeSubscriptionContext extends BraintreeMapperContext {
  customerId: string; // resolved BillingCustomer.id
}

/**
 * Upserts a Subscription from a Braintree subscription payload.
 * Idempotent via `(providerId, externalId)` unique.
 *
 * `Subscription.status` is `String` no canonical schema (Sub-etapa 9, não
 * enum). Braintree statuses (Title Case + espaço em "Past Due") são
 * normalizados via `mapBraintreeSubscriptionStatus`. Sample notifications
 * omitem `status` → fallback `"pending"`.
 */
export async function mapBraintreeSubscription(
  client: PrismaClient | Prisma.TransactionClient,
  payload: BraintreeSubscriptionPayload,
  ctx: MapBraintreeSubscriptionContext,
): Promise<string> {
  const status = payload.status
    ? mapBraintreeSubscriptionStatus(payload.status)
    : "pending";

  const nextChargeAt = payload.nextBillingDate
    ? new Date(payload.nextBillingDate)
    : null;

  const sub = await client.subscription.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: payload.id,
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: payload.id,
      customerId: ctx.customerId,
      status,
      nextChargeAt,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      status,
      nextChargeAt,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return sub.id;
}

/**
 * Creates a minimal Subscription stub when a transaction arrives before its
 * `subscription_charged_*` event populates the full row. Future enrichment
 * via `mapBraintreeSubscription` upserts onto the same row (idempotent).
 *
 * Status `"unknown"` signals "waiting for first subscription event".
 * Paridade direta com `ensureSubscriptionStub` em Recharge mapper.
 */
export async function ensureBraintreeSubscriptionStub(
  client: PrismaClient | Prisma.TransactionClient,
  externalSubscriptionId: string,
  ctx: MapBraintreeSubscriptionContext,
): Promise<string> {
  const sub = await client.subscription.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: externalSubscriptionId,
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: externalSubscriptionId,
      customerId: ctx.customerId,
      status: "unknown",
      providerData: {},
    },
    update: {}, // no-op — never overwrite enriched data with stub
    select: { id: true },
  });
  return sub.id;
}
