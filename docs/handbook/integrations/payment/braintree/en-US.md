---
title: Braintree
description: Braintree (PayPal) payment provider. One-time charges + subscriptions with Apple Pay, Google Pay, PayPal, Venmo, Credit Card. Sandbox-first (Camada 2).
locale: en-US
uid: herd.integration.payment.braintree
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or add `.md` to the URL to avoid HTML rendering.

# Braintree

Braintree (PayPal subsidiary) payment provider. Second HERD billing provider, in parallel with Recharge. Opens **Camada 2** (backend-only for Fase 5; checkout UI ships with Marketplace).

## Business

Braintree handles one-time charges and subscriptions with multi-method wallet support (Apple Pay, Google Pay, PayPal, Venmo, Credit Card). Covers use cases Recharge does not — non-recurring checkout, multi-method wallets, international flows outside Shopify-native scope.

V1 (Camada 2): **sandbox only**. Production cutover is tracked tech debt in AGENTS.md — gated on sandbox smoke test validation + client go-live decision.

Natural pair with Recharge: both `category: BILLING`, both consume `Subscription` + `Charge` blocks, both follow the same adapter/service/mapper pattern. They coexist via feature flag and/or checkout routing in the product.

## Product

V1 is backend-only. No end-user UI surface. Internal endpoints:

- `npm run seed:braintree` — provisions the `Integration` row in DEV/prod with encrypted credentials.
- (Sub-etapa 16) `npm run braintree:register-webhooks` — registers the webhook destination at Braintree via SDK.

No orchestrator actions consumed today. Minimal stack to receive webhooks and map into the canonical schema (Sub-etapas 14-15).

## Architecture

**Service:** `src/lib/services/braintree.ts`. `BraintreeService.fromIntegration()` loads encrypted credentials from the Integration row and instantiates `braintree.BraintreeGateway` with a dynamic environment (sandbox/production). Primary methods: `testConnection()` (read-only ping), `listWebhooks/createWebhook/deleteWebhook` (Sub-etapa 16 stubs).

**Manifest:** `src/lib/integrations/integrations/braintree.integration.ts`. `PaymentProviderAdapter` with `category: BILLING`, `authType: "api_key"`, `chargeModel: "both"`, `supportsBillingPortal: false` (Braintree has no built-in Customer Portal).

**SDK vs fetch — decision recorded:** Camada 2 uses the `braintree` npm SDK (v3.37). Divergent from Recharge (raw fetch). Reasons: (1) proprietary signature verification with built-in SDK helpers; (2) larger API surface + GraphQL through the SDK; (3) Bucked Up client uses the SDK in other projects. Cost: ~5MB bundle, acceptable for backend.

**Auth:** 3-key triplet (merchantId + publicKey + privateKey) + environment flag. Encrypted as a single JSON blob in `Integration.credentials`. `authType: "api_key"` reuses the enum value Recharge cravou (Sub-etapa 10) — the 3 keys conceptually form one credential set.

**Webhook pipeline (Sub-etapa 14):** Braintree uses `application/x-www-form-urlencoded` body with fields `bt_signature` + `bt_payload`. SDK helper `gateway.webhookNotification.parse(signature, payload)` does verify-and-parse in one call. Pipeline reuses dedup + outbox from Sub-etapa 6 (same as Recharge/Gorgias/Intercom).

**Mapper (Sub-etapa 15):** pure functions in `src/lib/mappers/braintree/`. Same pattern as `src/lib/mappers/recharge/`. Custom ChargeStatus mapping (Braintree uses `settled`/`processor_declined`/`voided`/etc.).

## Operations

**First-time setup (Camada 2 V1, sandbox):**

1. Set 4 env vars in local `.env` + Railway:
   - `BRAINTREE_MERCHANT_ID`
   - `BRAINTREE_PUBLIC_KEY`
   - `BRAINTREE_PRIVATE_KEY`
   - `BRAINTREE_ENVIRONMENT=sandbox`
2. `npm run seed:braintree` creates/updates the Integration row.
3. (Sub-etapa 16) `npm run braintree:register-webhooks` registers the webhook destination pointing at `${DEPLOY_URL}/api/webhooks/braintree`.

**Smoke test (Sub-etapa 17):** synthetic event in Braintree sandbox → confirm `IntegrationWebhookEvent` row in DB + `BillingEvent` audit + canonical rows (Charge/Subscription) populated.

**Webhook events V1 (12 kinds):**

- Subscription: `subscription_charged_successfully`, `subscription_charged_unsuccessfully`, `subscription_canceled`, `subscription_trial_ended`, `subscription_went_past_due`, `subscription_expired`
- Transaction: `transaction_settled`, `transaction_settlement_declined`, `transaction_disbursed` (`transaction_settlement_pending` removed in Sub-etapa 14 — deprecated in current SDK)
- Dispute: `dispute_opened`, `dispute_lost`, `dispute_won`

**Tech debt tracked in AGENTS.md (Camada 2 section):**

- Braintree production cutover (sandbox → production). Trigger: sandbox smoke test validated + client requires go-live.
- Webhook scope expansion (13 → ~30 available). Trigger: product requires extra events (`partner_merchant_*`, `payment_method_*`, `disbursement_*`).
- Marketplace integration (Braintree sub-merchants). Trigger: Bucked Up business model expands to multi-vendor.

## Glossary

- **Merchant Account:** the Braintree entity representing the seller (Bucked Up).
- **Sub-merchant:** secondary seller in marketplaces (future).
- **Settlement:** transferring funds from the transaction to the merchant account.
- **Disbursement:** transferring funds from the merchant account to the bank.
- **Dispute:** chargeback initiated by the customer — contested in the processor flow.

## Changelog

- **2026-05-21 (Sub-etapa 13, Camada 2):** adapter foundation created. Service + manifest + seed script. Sub-etapas 14-17 ship handler, mappers, registration, smoke.
