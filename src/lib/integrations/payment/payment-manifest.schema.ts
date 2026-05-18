import { z } from "zod";
import { IntegrationCategory } from "@prisma/client";
import { IntegrationManifestSchema } from "../manifest.schema";

/**
 * Sub-etapa 7 — Payment vertical manifest.
 *
 * Extends the base `IntegrationManifestSchema` with fields meaningful only
 * to billing/payment providers. Decision #9: BILLING vs PAYMENT classification
 * for Recharge is deferred to Sub-etapa 10 when the adapter is implemented
 * against the real OAuth/HTTP surface — the schema accepts both literal
 * values here so neither branch is foreclosed by the type system today.
 *
 * Other verticals (e.g. SUPPORT, MESSAGING) are not introduced speculatively
 * — they appear when a real need shows up (per Decision #2).
 */

const ChargeModelSchema = z.enum(["subscription", "one-time", "both"]);
export type ChargeModel = z.infer<typeof ChargeModelSchema>;

export const PaymentProviderManifestSchema = IntegrationManifestSchema.extend({
  /** Must be BILLING or PAYMENT — the rest of the catalog is filtered out. */
  category: z.union([
    z.literal(IntegrationCategory.BILLING),
    z.literal(IntegrationCategory.PAYMENT),
  ]),
  /** Whether the provider supports subscriptions, one-time charges, or both. */
  chargeModel: ChargeModelSchema,
  /**
   * ISO-4217 currency codes the provider can charge in for this integration.
   * Empty array is not allowed — every payment adapter must declare at least
   * one currency, even if it's just `["USD"]`.
   */
  supportedCurrencies: z
    .array(z.string().regex(/^[A-Z]{3}$/, "ISO-4217 currency codes only"))
    .nonempty("supportedCurrencies must list at least one currency"),
  /** Whether the provider hosts a self-serve billing portal for end customers. */
  supportsBillingPortal: z.boolean(),
});

export type PaymentProviderManifest = z.infer<
  typeof PaymentProviderManifestSchema
>;
