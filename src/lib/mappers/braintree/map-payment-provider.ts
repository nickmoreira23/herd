import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Upserts the PaymentProvider catalog row for Braintree.
 *
 * Idempotent — called at the start of every braintree.* handler invocation.
 * Returns the providerId for downstream FK references.
 *
 * Schema note (Sub-etapa 9): `PaymentProvider.category` is `String` (not the
 * `IntegrationCategory` enum used by `Integration.category`). Pass `"BILLING"`
 * literal. PaymentProvider is tenant-scoped — `@@unique([tenantId, slug])`.
 */
export async function upsertBraintreePaymentProvider(
  client: PrismaClient | Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const provider = await client.paymentProvider.upsert({
    where: {
      tenantId_slug: { tenantId, slug: "braintree" },
    },
    create: {
      tenantId,
      slug: "braintree",
      name: "Braintree",
      category: "BILLING",
      providerData: {},
    },
    update: {},
    select: { id: true },
  });
  return provider.id;
}
