import { IntegrationCategory } from "@prisma/client";
import type { PaymentProviderAdapter } from "../payment/payment-adapter.interface";
import type { PaymentProviderManifest } from "../payment/payment-manifest.schema";

/**
 * Braintree — payment provider (PayPal). One-time charges + subscriptions.
 *
 * Sub-etapa 13, Camada 2 — first sub-etapa. Adapter foundation only:
 * manifest + service + seed. Webhook handler (14), mappers (15),
 * programmatic registration (16), and smoke (17) follow.
 *
 * Auth model: 3-key API credentials (merchantId + publicKey + privateKey)
 * plus an `environment` flag — encrypted as a single JSON blob in
 * `Integration.credentials`. `authType: "api_key"` reuses the enum value
 * Recharge cravou em Sub-etapa 10 (the 3 keys conceitualmente formam um
 * único credential set).
 *
 * Webhook signing: SDK-handled. Braintree's wire format is proprietary
 * (signature + payload form-encoded with internal sha1_hmac), but the
 * SDK exposes `gateway.webhookNotification.parse(signature, payload)` as
 * a one-call verify-and-parse helper. No anti-HMAC guard needed (unlike
 * Recharge).
 *
 * Webhook events V1 (12 kinds): see `webhookEvents` below. Other ~17
 * available kinds (`partner_merchant_*`, `payment_method_*`, etc.) are
 * tech debt rastreado em AGENTS.md — expand when product needs them.
 *
 * Note (Sub-etapa 14): `transaction_settlement_pending` was removed from
 * the list — it is not in Braintree's current SDK enum
 * (`braintree.WebhookNotification.Kind`), indicating the kind is
 * deprecated. If the kind reappears in future SDK versions, re-add.
 */
const braintreeManifest: PaymentProviderManifest = {
  slug: "braintree",
  name: "Braintree",
  category: IntegrationCategory.BILLING,
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: false,
    supportsHmacSignature: true, // SDK handles signature internally
    supportsBillingPortal: false, // Braintree has no built-in portal V1
    supportsTierSync: true,
    webhookEventsHaveStableId: true,
  },
  webhookEvents: [
    // Subscription lifecycle
    "subscription_charged_successfully",
    "subscription_charged_unsuccessfully",
    "subscription_canceled",
    "subscription_trial_ended",
    "subscription_went_past_due",
    "subscription_expired",
    // Transaction lifecycle
    "transaction_settled",
    "transaction_settlement_declined",
    // Note: transaction_settlement_pending removed in Sub-etapa 14
    // (not in current Braintree SDK enum — deprecated).
    "transaction_disbursed",
    // Disputes (audit-only via BillingEvent V1)
    "dispute_opened",
    "dispute_lost",
    "dispute_won",
  ],
  authType: "api_key",
  version: "1.0.0",
  chargeModel: "both",
  supportedCurrencies: ["USD", "CAD", "GBP", "EUR", "AUD"],
  supportsBillingPortal: false,
};

export const braintreeAdapter: PaymentProviderAdapter = {
  slug: braintreeManifest.slug,
  manifest: braintreeManifest,
};
