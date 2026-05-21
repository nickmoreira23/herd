import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  RechargeChargePayload,
  RechargeChargeLineItemPayload,
} from "./types";
import { mapChargeStatus } from "./map-charge-status";
import { mapAmountCents } from "./map-amount-cents";
import { ensureSubscriptionStub } from "./map-subscription";

/**
 * Schema note (Sub-etapa 9): `Charge.customerId` (not `billingCustomerId`)
 * and `ChargeLineItem` has only `amountCents` (no `quantity` column). The
 * Recharge per-line `quantity` is preserved inside `ChargeLineItem.providerData`
 * for downstream consumers that need it.
 */
interface MapChargeContext {
  tenantId: string;
  providerId: string;
  customerId: string;
}

export async function mapRechargeCharge(
  client: PrismaClient | Prisma.TransactionClient,
  payload: RechargeChargePayload,
  ctx: MapChargeContext,
): Promise<string> {
  const status = mapChargeStatus(payload.status);
  const amountCents = mapAmountCents(payload.total_price);

  const charge = await client.charge.upsert({
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
      status,
      amountCents,
      currency: payload.currency,
      processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
      failureReason: payload.error_message ?? null,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      status,
      amountCents,
      currency: payload.currency,
      processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
      failureReason: payload.error_message ?? null,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  await mapChargeLineItems(client, charge.id, payload.line_items, ctx);

  return charge.id;
}

async function mapChargeLineItems(
  client: PrismaClient | Prisma.TransactionClient,
  chargeId: string,
  lineItems: RechargeChargeLineItemPayload[],
  ctx: MapChargeContext,
): Promise<void> {
  for (const item of lineItems) {
    if (!item.subscription_id) {
      // Standalone line item (one-time purchase) — V1 skip.
      // Canonical ChargeLineItem requires `subscriptionId` FK (Sub-etapa 9
      // schema), so non-subscription line items have nowhere to land yet.
      // TODO when product needs standalone item analytics.
      continue;
    }

    const subscriptionId = await ensureSubscriptionStub(
      client,
      item.subscription_id,
      ctx,
    );

    const amountCents = mapAmountCents(item.total_price ?? item.price);

    // `quantity` from Recharge is preserved in providerData (no canonical
    // column). Pull from the original `item` object — mapper does not
    // transform it.
    await client.chargeLineItem.upsert({
      where: {
        chargeId_subscriptionId: { chargeId, subscriptionId },
      },
      create: {
        tenantId: ctx.tenantId,
        chargeId,
        subscriptionId,
        amountCents,
        providerData: item as unknown as Prisma.InputJsonValue,
      },
      update: {
        amountCents,
        providerData: item as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
