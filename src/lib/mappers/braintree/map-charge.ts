import { ChargeStatus, type Prisma, type PrismaClient } from "@prisma/client";
import type {
  BraintreeTransactionPayload,
  BraintreeMapperContext,
} from "./types";
import { mapBraintreeChargeStatus } from "./map-charge-status";
import { mapBraintreeAmountCents } from "./map-amount-cents";
import { ensureBraintreeSubscriptionStub } from "./map-subscription";

interface MapBraintreeChargeContext extends BraintreeMapperContext {
  customerId: string;
}

/**
 * Upserts a Charge from a Braintree transaction payload.
 * Idempotent via `(providerId, externalId)` unique.
 *
 * If the transaction is part of a subscription, ensures a Subscription stub
 * exists first so the optional `Charge.subscriptionId` analytic could be
 * recovered (V1 schema does not have that column — subscription→charge link
 * is via `ChargeLineItem` in Recharge; Braintree V1 skips line items).
 *
 * `processedAt` / `failedAt` derive from `payload.updatedAt` based on the
 * canonical mapped status. `providerData` JSONB preserves the full SDK
 * payload for reprocessing / future fields.
 */
export async function mapBraintreeCharge(
  client: PrismaClient | Prisma.TransactionClient,
  payload: BraintreeTransactionPayload,
  ctx: MapBraintreeChargeContext,
): Promise<string> {
  const status = mapBraintreeChargeStatus(payload.status);
  const amountCents = mapBraintreeAmountCents(payload.amount);
  const currency = payload.currencyIsoCode || "USD";

  // Pre-resolve subscription stub if transaction is part of one. Braintree V1
  // schema does not link Charge→Subscription directly (no FK column), but the
  // stub upsert ensures the Subscription row exists so a later
  // `subscription_*` event can enrich it.
  if (payload.subscriptionId) {
    await ensureBraintreeSubscriptionStub(client, payload.subscriptionId, {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      customerId: ctx.customerId,
    });
  }

  const updatedAt = payload.updatedAt ? new Date(payload.updatedAt) : null;
  const processedAt = status === ChargeStatus.SUCCESS ? updatedAt : null;
  const failedAt = status === ChargeStatus.FAILED ? updatedAt : null;
  const failureReason =
    status === ChargeStatus.FAILED
      ? (payload.processorResponseText ??
          payload.processorResponseCode ??
          null)
      : null;

  const charge = await client.charge.upsert({
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
      amountCents,
      currency,
      processedAt,
      failedAt,
      failureReason,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      status,
      amountCents,
      currency,
      processedAt,
      failedAt,
      failureReason,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  // Note: ChargeLineItem skipped V1. Braintree não tem split equivalente a
  // Recharge subscriptions/line_items. Extend later if product needs line
  // items per charge (e.g., multi-product cart from Marketplace Fase 5).

  return charge.id;
}
