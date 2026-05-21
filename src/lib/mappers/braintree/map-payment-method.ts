import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  BraintreeTransactionPayload,
  BraintreeMapperContext,
} from "./types";

interface MapBraintreePaymentMethodContext extends BraintreeMapperContext {
  customerId: string;
}

/**
 * Conditionally upserts PaymentMethod from a Braintree transaction payload.
 *
 * V1 behavior: only creates if `paymentMethodToken` is present. Silent skip
 * when missing (sample notifications lack it — see Sub-etapa 14 discovery).
 * Idempotent via `(providerId, externalId)` unique on `externalId = token`.
 *
 * Schema (Sub-etapa 9): `type: String` stores `paymentInstrumentType`
 * (credit_card, paypal_account, apple_pay_card, google_pay_card,
 * venmo_account, us_bank_account); `last4` + `brand` populated from
 * `creditCard.last4` + `creditCard.cardType` when present.
 *
 * Returns the PaymentMethod id (or `null` if skipped). Caller may attach
 * to Charge later if `paymentMethodId` column becomes useful.
 */
export async function mapBraintreePaymentMethod(
  client: PrismaClient | Prisma.TransactionClient,
  payload: BraintreeTransactionPayload,
  ctx: MapBraintreePaymentMethodContext,
): Promise<string | null> {
  const token = payload.paymentMethodToken;
  if (!token) {
    return null;
  }

  const type = payload.paymentInstrumentType ?? "unknown";
  const last4 = payload.creditCard?.last4 ?? null;
  const brand = payload.creditCard?.cardType ?? null;

  const subset = {
    paymentInstrumentType: payload.paymentInstrumentType,
    creditCard: payload.creditCard,
  };

  const method = await client.paymentMethod.upsert({
    where: {
      providerId_externalId: {
        providerId: ctx.providerId,
        externalId: token,
      },
    },
    create: {
      tenantId: ctx.tenantId,
      providerId: ctx.providerId,
      externalId: token,
      customerId: ctx.customerId,
      type,
      last4,
      brand,
      providerData: subset as unknown as Prisma.InputJsonValue,
    },
    update: {
      type,
      last4,
      brand,
      providerData: subset as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return method.id;
}
