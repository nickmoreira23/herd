import { IntegrationCategory } from "@prisma/client";
import type { PaymentProviderAdapter } from "../payment/payment-adapter.interface";
import type { PaymentProviderManifest } from "../payment/payment-manifest.schema";

/**
 * Recharge — subscription billing for Shopify-native commerce.
 *
 * Implemented as `PaymentProviderAdapter` (Decision #9). Category is set
 * to BILLING here as a working choice for Sub-etapa 7 manifest validation;
 * the final BILLING-vs-PAYMENT call is cravado in Sub-etapa 10 when the
 * adapter ships with real OAuth + HTTP wiring and the orchestrator starts
 * consuming the category-derived UI surface. Switching the literal at
 * that point is a one-line change validated by the same Zod schema.
 *
 * Webhook signature is `sha256(client_secret + raw_body)` — literal
 * concatenation, NOT HMAC. See `RechargeWebhookVerifier` and its
 * load-bearing anti-HMAC test for the load-bearing safeguard.
 */
const rechargeManifest: PaymentProviderManifest = {
  slug: "recharge",
  name: "Recharge",
  category: IntegrationCategory.BILLING, // confirmed in Sub-etapa 10
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: true,
    supportsHmacSignature: true, // wire format is sha256(secret+body), conceptually HMAC-like
    supportsBillingPortal: true,
    supportsTierSync: true,
    webhookEventsHaveStableId: true, // payload.id is the dedup key
  },
  webhookEvents: [
    "subscription/created",
    "subscription/updated",
    "subscription/cancelled",
    "subscription/activated",
    "order/created",
    "charge/created",
    "charge/paid",
    "charge/failed",
    "customer/created",
    "customer/updated",
  ],
  authType: "oauth2",
  version: "1.0.0",
  chargeModel: "subscription",
  supportedCurrencies: ["USD", "CAD", "GBP", "EUR", "AUD"],
  supportsBillingPortal: true,
};

export const rechargeAdapter: PaymentProviderAdapter = {
  slug: rechargeManifest.slug,
  manifest: rechargeManifest,
};
