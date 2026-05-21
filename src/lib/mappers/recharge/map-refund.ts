import type { Prisma, PrismaClient } from "@prisma/client";
import type { RechargeRefundPayload } from "./types";
import { mapAmountCents } from "./map-amount-cents";

interface MapRefundContext {
  tenantId: string;
  providerId: string;
}

/**
 * Upserts a Refund. Parent Charge must already exist — Recharge fires
 * `charge/refunded` AFTER `charge/created` for the same charge, so the
 * order-of-arrival contract is provider-guaranteed. If the parent is
 * missing, throw (likely indicates a dropped/missed `charge/created`).
 */
export async function mapRechargeRefund(
  client: PrismaClient | Prisma.TransactionClient,
  payload: RechargeRefundPayload,
  ctx: MapRefundContext,
): Promise<string> {
  const charge = await client.charge.findUnique({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: String(payload.charge_id),
      },
    },
    select: { id: true },
  });

  if (!charge) {
    throw new Error(
      `Refund payload references unknown charge id=${payload.charge_id}. ` +
        `charge/created event may have been missed or dropped.`,
    );
  }

  const refund = await client.refund.upsert({
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
      chargeId: charge.id,
      amountCents: mapAmountCents(payload.amount),
      reason: payload.reason ?? null,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      amountCents: mapAmountCents(payload.amount),
      reason: payload.reason ?? null,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return refund.id;
}
