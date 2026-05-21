import type { Prisma, PrismaClient } from "@prisma/client";
import type { RechargeSubscriptionPayload } from "./types";

/**
 * Schema note (Sub-etapa 9): `Subscription.customerId` is the FK to
 * BillingCustomer (NOT `billingCustomerId`). The mapper context field
 * is named `customerId` to match the canonical schema field exactly.
 */
interface MapSubscriptionContext {
  tenantId: string;
  providerId: string;
  customerId: string; // resolved BillingCustomer.id
}

/**
 * Upserts a Subscription from a Recharge subscription payload.
 * Idempotent via `(providerId, externalId)` unique.
 *
 * `Subscription.status` is `String` in the canonical schema (not enum) —
 * Recharge values ("active"/"cancelled"/"expired") are persisted verbatim.
 */
export async function mapRechargeSubscription(
  client: PrismaClient | Prisma.TransactionClient,
  payload: RechargeSubscriptionPayload,
  ctx: MapSubscriptionContext,
): Promise<string> {
  const nextChargeAt = payload.next_charge_scheduled_at
    ? new Date(payload.next_charge_scheduled_at)
    : null;
  const cancelledAt = payload.cancelled_at
    ? new Date(payload.cancelled_at)
    : null;

  const subscription = await client.subscription.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: String(payload.id),
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: String(payload.id),
      customerId: ctx.customerId,
      status: payload.status,
      nextChargeAt,
      cancelledAt,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      status: payload.status,
      nextChargeAt,
      cancelledAt,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return subscription.id;
}

/**
 * Creates a minimal Subscription stub when a charge arrives before any
 * `subscription/*` event has populated it. Future enrichment via
 * `mapRechargeSubscription` upserts onto the same row (idempotent).
 *
 * Status `"unknown"` signals "waiting for first subscription event".
 */
export async function ensureSubscriptionStub(
  client: PrismaClient | Prisma.TransactionClient,
  externalSubscriptionId: number,
  ctx: MapSubscriptionContext,
): Promise<string> {
  const subscription = await client.subscription.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: String(externalSubscriptionId),
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: String(externalSubscriptionId),
      customerId: ctx.customerId,
      status: "unknown",
      providerData: {},
    },
    update: {}, // no-op — never overwrite enriched data with stub
    select: { id: true },
  });
  return subscription.id;
}
