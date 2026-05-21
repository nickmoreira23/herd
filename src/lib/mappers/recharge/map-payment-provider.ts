import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Upserts the PaymentProvider catalog row for Recharge.
 *
 * Idempotent — called at the start of every recharge.* handler invocation.
 * Returns the providerId for downstream FK references.
 *
 * Schema note (Sub-etapa 9): `PaymentProvider.category` is `String` (not the
 * `IntegrationCategory` enum used by `Integration.category`). Intentional
 * cravamento — billing schema uses string literals while the integration
 * catalog uses the enum. Pass `"BILLING"` literal here.
 */
export async function upsertRechargePaymentProvider(
  client: PrismaClient | Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const provider = await client.paymentProvider.upsert({
    where: {
      tenantId_slug: { tenantId, slug: "recharge" },
    },
    create: {
      tenantId,
      slug: "recharge",
      name: "Recharge",
      category: "BILLING",
      providerData: {},
    },
    update: {}, // no-op — just ensure row exists
    select: { id: true },
  });
  return provider.id;
}
