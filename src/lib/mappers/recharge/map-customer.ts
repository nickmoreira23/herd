import type { Prisma, PrismaClient } from "@prisma/client";
import type { RechargeCustomerPayload } from "./types";

/**
 * Upserts a BillingCustomer from a Recharge customer payload.
 * Idempotent via `(providerId, externalId)` unique constraint.
 *
 * Schema note (Sub-etapa 9): `BillingCustomer` has only `email` + `name?`
 * (no `firstName`/`lastName`/`phone`). Recharge `first_name + last_name`
 * are joined into the single `name` field; full original payload (including
 * `phone`, `hash`, addresses, etc.) is preserved in `provider_data` JSONB
 * for downstream consumers that need the un-flattened data.
 */
interface MapCustomerContext {
  tenantId: string;
  providerId: string;
}

export async function mapRechargeCustomer(
  client: PrismaClient | Prisma.TransactionClient,
  payload: RechargeCustomerPayload,
  ctx: MapCustomerContext,
): Promise<string> {
  const combinedName =
    [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim() ||
    null;

  const customer = await client.billingCustomer.upsert({
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
      email: payload.email,
      name: combinedName,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      email: payload.email,
      name: combinedName,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return customer.id;
}
