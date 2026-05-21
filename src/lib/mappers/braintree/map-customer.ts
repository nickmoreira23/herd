import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  BraintreeCustomerPayload,
  BraintreeMapperContext,
} from "./types";

/**
 * Upserts a BillingCustomer from a Braintree customer payload.
 * Idempotent via `(providerId, externalId)` unique constraint.
 *
 * Schema note (Sub-etapa 9): `BillingCustomer` exposes only `email?` + `name?`
 * canonically. Braintree's `firstName + lastName` are joined into the single
 * `name` field; full original payload (phone, company, addresses, custom
 * fields, etc.) is preserved in `providerData` JSONB.
 */
export async function mapBraintreeCustomer(
  client: PrismaClient | Prisma.TransactionClient,
  payload: BraintreeCustomerPayload,
  ctx: BraintreeMapperContext,
): Promise<string> {
  const combinedName =
    [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const customer = await client.billingCustomer.upsert({
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
      email: payload.email ?? null,
      name: combinedName,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    update: {
      email: payload.email ?? null,
      name: combinedName,
      providerData: payload as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return customer.id;
}
