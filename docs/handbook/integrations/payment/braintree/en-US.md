---
title: Braintree
description: Braintree (PayPal) payment provider. One-time charges + subscriptions with Apple Pay, Google Pay, PayPal, Venmo, Credit Card. Backend complete in sandbox (Camada 2).
locale: en-US
uid: herd.integration.payment.braintree
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or add `.md` to the URL to avoid HTML rendering.

# Braintree

Braintree (PayPal subsidiary) payment provider. Second ComeçaAI billing provider, in parallel with Recharge. Opens **Camada 2** (backend-only for Phase 5; checkout UI ships with Marketplace).

Camada 2 delivered across sub-etapas 13 → 17 (2026-05-21). End-to-end pipeline ready in sandbox: adapter + service + webhook handler + mapper layer + dispatcher + dedup + outbox + worker.

## Business

Braintree handles one-time charges and subscriptions with multi-method wallet support (Apple Pay, Google Pay, PayPal, Venmo, Credit Card). Covers use cases Recharge does not — non-recurring checkout, multi-method wallets, international flows outside Shopify-native scope.

V1 (Camada 2): **sandbox only**. Production cutover is tracked tech debt in AGENTS.md — gated on sandbox smoke test validation + client go-live decision.

Natural pair with Recharge: both `category: BILLING`, both consume `Subscription` + `Charge` blocks, both follow the same adapter/service/mapper pattern. They coexist via feature flag and/or checkout routing in the product.

## Product

V1 is backend-only. No end-user UI surface. Internal endpoints:

- `npm run seed:braintree` — provisions the `Integration` row in DEV/prod with encrypted credentials.
- `npm run braintree:test-webhook -- --base-url=... --kind=... --id=...` — generates a sample notification via SDK and POSTs to the local/deploy endpoint. Useful for dev iteration without round-tripping the Control Panel.

No orchestrator actions consumed today. Minimal stack to receive webhooks and map them to the canonical schema.

## Architecture

**Service:** `src/lib/services/braintree.ts`. `BraintreeService.fromIntegration()` loads encrypted credentials from the Integration row and instantiates `braintree.BraintreeGateway` with a dynamic environment (sandbox/production). Method: `testConnection()` (via `clientToken.generate({})` — a read-only ping with no PII fetched).

**Manifest:** `src/lib/integrations/integrations/braintree.integration.ts`. `PaymentProviderAdapter` with `category: BILLING`, `authType: "api_key"`, `chargeModel: "both"`, `supportsBillingPortal: false`. 12 webhook topics V1.

**SDK vs fetch — decision recorded:** Camada 2 uses the `braintree` npm SDK (v3.37). Divergent from Recharge (raw fetch). Reasons: (1) proprietary signature verification with built-in SDK helpers; (2) larger API surface + GraphQL through the SDK; (3) the Bucked Up client uses the SDK in other projects. Cost: ~5MB bundle.

**Auth:** 3-key triplet (merchantId + publicKey + privateKey) + environment flag. Encrypted as a single JSON blob in `Integration.credentials` via AES-256-GCM. `authType: "api_key"` reuses the enum value Recharge cravou.

### Webhook pipeline (Sub-etapa 14)

**Format:** `application/x-www-form-urlencoded` body with fields `bt_signature` + `bt_payload`. Route handler `src/app/api/webhooks/braintree/route.ts` uses `await request.formData()` (divergent from Recharge/Gorgias/Intercom which parse JSON).

**Verification:** SDK helper `gateway.webhookNotification.parse(bt_signature, bt_payload)` does verify + parse in one call. **No dedicated verifier file** — Braintree is the first provider without a class in `src/lib/webhooks/verifiers/`.

**Dedup composite:** `${kind}:${subjectId}:${timestamp.toISOString()}`. Braintree does not emit a stable event_id; the composite resists provider-side retries (24h prod, 3h sandbox).

**Tenant resolution:** `extractExternalId("braintree", notification)` switches by kind (subscription/transaction/dispute) plus a **1-tenant fallback** when customerId is missing (sample fixtures or edge cases).

**Outbox emit:** `emitDomainEvent("webhook.braintree", { tenantId, kind, subjectId, body })` atomic with `webhook_dedup.create` + raw `IntegrationWebhookEvent.create`.

### Mapper layer (Sub-etapa 15)

10 files in `src/lib/mappers/braintree/`. Architectural parity with `src/lib/mappers/recharge/`. Pure functions `(client, payload, ctx) => Promise<string | null>` with idempotence via `(providerId, externalId)` unique upserts.

**V1 scope (5 canonical entities):**

- `mapBraintreeCustomer` — BillingCustomer (firstName + lastName → name)
- `mapBraintreeSubscription` + `ensureBraintreeSubscriptionStub`
- `mapBraintreeCharge` — Subscription stub when transaction has subscriptionId
- `mapBraintreePaymentMethod` — silent skip when `paymentMethodToken` missing
- `upsertBraintreePaymentProvider` — catalog row helper

**Status helpers (loud-fail on unknown):**

- `mapBraintreeChargeStatus`: 13 Transaction.Status → 8 canonical ChargeStatus (settled/settlement_confirmed → SUCCESS; settlement_declined/processor_declined/gateway_rejected/failed → FAILED; voided/authorization_expired → CANCELLED; submitted_for_settlement/settling/settlement_pending/authorizing/authorized → PENDING).
- `mapBraintreeSubscriptionStatus`: Title Case + space → lowercase + underscore (`"Past Due"` → `"past_due"`).

**Handler dispatcher:**
- `subscription_*` → ensureCustomer → mapSubscription + mapCharge per `transactions[]` + mapPaymentMethod
- `transaction_*` → ensureCustomer → mapCharge + mapPaymentMethod
- `dispute_*` → audit-only via IWE upstream (V1 — no canonical Dispute table)

**Synthetic customer stub fallback** (`tenant_${tenantId}_fallback`) for sample fixtures missing customer.id. Idempotent.

**Skipped V1 (tracked tech debt):** Refund mapping, canonical Dispute table, DunningAttempt, ChargeLineItem (Braintree has no Recharge-equivalent split), BillingEvent audit row.

## Operations

**First-time setup (Camada 2 V1, sandbox):**

1. Set 4 env vars in local `.env` + Railway:
   - `BRAINTREE_MERCHANT_ID`
   - `BRAINTREE_PUBLIC_KEY`
   - `BRAINTREE_PRIVATE_KEY`
   - `BRAINTREE_ENVIRONMENT=sandbox`
2. `npm run seed:braintree` — creates/updates the encrypted Integration row.
3. **Configure webhook destination in sandbox Control Panel** (manual step — see below).

### Webhook destination setup (sandbox Control Panel)

Braintree **does not expose any API for webhook destination management** — the npm v3.37 SDK has no `gateway.webhookEndpoint` or equivalent. Setup is manual via Control Panel UI:

1. Log into `sandbox.braintreegateway.com`.
2. Settings → API → Webhooks.
3. Click "Generate New Webhook".
4. **Destination URL:** `https://<deploy-url>/api/webhooks/braintree` (HTTPS required in prod; sandbox accepts HTTP tunnels for dev).
5. Select the **12 V1 topics**:
   - **Subscription** (6): `subscription_charged_successfully`, `subscription_charged_unsuccessfully`, `subscription_canceled`, `subscription_trial_ended`, `subscription_went_past_due`, `subscription_expired`
   - **Transaction** (3): `transaction_settled`, `transaction_settlement_declined`, `transaction_disbursed`
   - **Dispute** (3): `dispute_opened`, `dispute_lost`, `dispute_won`
6. Save.

### Smoke procedure

**Path A — Control Panel "Check URL" (canonical):**

1. In the sandbox webhooks list, click "Check URL" on the destination you created.
2. Braintree sends a real `Check` notification (signed) to the endpoint.
3. Wait 1–2 minutes for the worker to process.
4. Validate:
   ```bash
   curl https://<deploy-url>/api/health | jq .
   # outbox.lastProcessedAt should be updated
   ```
5. Inspect:
   ```sql
   SELECT id, "eventType", "tenantId", "createdAt"
   FROM "IntegrationWebhookEvent"
   ORDER BY "createdAt" DESC LIMIT 5;
   -- A row with eventType="check" or real kind should appear
   ```

**Path B — Local script (dev convenience):**

```bash
npm run braintree:test-webhook -- \
  --base-url=http://localhost:3000 \
  --kind=transaction_settled \
  --id=test_txn_smoke
```

Generates `{bt_signature, bt_payload}` via `gw.webhookTesting.sampleNotification()` and POSTs form-encoded directly to the endpoint. **Bypasses Braintree** — does not validate the network path; useful for iterating handler+mapper logic locally.

**To validate canonical writes (mapper):** trigger a real event in sandbox (create a transaction via Control Panel or SDK call) → confirm rows in `payment_providers`, `billing_customers`, `subscriptions`, `charges`.

### Production cutover (tech debt — recorded steps)

1. Set `BRAINTREE_ENVIRONMENT=production` in Railway.
2. Set the 3 production keys: `BRAINTREE_MERCHANT_ID`, `BRAINTREE_PUBLIC_KEY`, `BRAINTREE_PRIVATE_KEY` (different values from sandbox).
3. Run `npm run seed:braintree` in the Railway production environment (idempotent upsert).
4. Configure the webhook destination in the **production Control Panel** (`braintreegateway.com`, not sandbox), pointing at the deploy URL.
5. Re-run the smoke procedure against production.

Trigger: sandbox smoke validated + client requests go-live.

## Glossary

- **Merchant Account:** the Braintree entity representing the seller (Bucked Up).
- **Sub-merchant:** secondary seller in marketplaces (future).
- **Settlement:** transferring funds from the transaction to the merchant account.
- **Disbursement:** transferring funds from the merchant account to the bank.
- **Dispute:** chargeback initiated by the customer — contested in the processor flow.
- **Webhook destination:** URL configured in the Control Panel where Braintree sends notifications. There is no API to create/list/delete destinations — UI only.
- **Control Panel:** Braintree admin panel (`braintreegateway.com` / `sandbox.braintreegateway.com`).

## Changelog

- **2026-05-21 (Sub-etapa 17, Camada 2 closeout):** test webhook CLI helper + handbook updates + AGENTS.md closeout + Plano_Camada_2.md. Tag `camada-2-complete` applied.
- **2026-05-21 (Sub-etapa 15):** mapper layer raw → canonical (10 files, handler dispatcher refactor).
- **2026-05-21 (Sub-etapa 14):** webhook handler + outbox + tenant extractor + dedup composite.
- **2026-05-21 (Sub-etapa 13, Camada 2 start):** adapter foundation. Service + manifest + seed.
