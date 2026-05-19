import { IntegrationCategory } from "@prisma/client";
import type { PaymentProviderAdapter } from "../payment/payment-adapter.interface";
import type { PaymentProviderManifest } from "../payment/payment-manifest.schema";

/**
 * Recharge — subscription billing for Shopify-native commerce.
 *
 * Implemented as `PaymentProviderAdapter` (Decision #9). Category is
 * BILLING — finalized in Sub-etapa 9 alongside the canonical Payment
 * Provider Layer schema (`payment_providers`, `subscriptions`, `charges`,
 * etc). The Sub-etapa 7 manifest carried this value as a working choice;
 * Sub-etapa 9 promotes it to the final classification.
 *
 * Webhook signature is `sha256(client_secret + raw_body)` — literal
 * concatenation, NOT HMAC. See `RechargeWebhookVerifier` and its
 * load-bearing anti-HMAC test for the load-bearing safeguard.
 */
const rechargeManifest: PaymentProviderManifest = {
  slug: "recharge",
  name: "Recharge",
  category: IntegrationCategory.BILLING,
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
