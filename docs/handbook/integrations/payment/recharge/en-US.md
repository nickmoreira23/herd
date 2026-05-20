---
title: Recharge
description: Subscription billing provider for Shopify-native storefronts. Single-tenant V1 (Bucked Up), API key + dashboard-managed webhooks.
locale: en-US
uid: herd.integration.payment.recharge
---

# Recharge

Subscription billing provider used by the Bucked Up storefront (Shopify-native). Adopted in Sub-etapa 9 (canonical schema) and Sub-etapa 10 revised (API key path, webhook outbox).

## Business

Recharge processes recurring billing for subscriptions sold on the storefront. All Bucked Up revenue reconciled in HERD originates there. The integration lets finance/ops answer, in a canonical place, questions like "how many charges failed this month", "which subscription drives the most MRR", etc., without logging into the Recharge dashboard.

## Product

Current setup (V1):

- **Auth:** admin API key (`RECHARGE_API_KEY`), encrypted in `Integration.credentials`.
- **Webhook registration:** manual via Recharge dashboard. URL: `${DEPLOY_URL}/api/webhooks/recharge`. 9 events registered: `order/created`, `charge/{created,paid,failed,refunded}`, `subscription/{created,updated,cancelled,activated}`.
- **Admin views:** `/api/integrations/recharge/{charges,customers,plans,subscriptions}` for read-only inspection.

Storefront Token (browser-side, customer-facing portal) is tech debt — comes when HERD's customer-facing UI is born.

## Architecture

**Service:** `src/lib/services/recharge.ts`. `RechargeService.fromIntegration()` loads encrypted credentials from the Integration row and instantiates the service. 10 methods: `testConnection`, `listPlans`, `getPlan`, `listCharges`, `getCharge`, `listCustomers`, `listSubscriptions`, `listWebhooks`, `createWebhook`, `deleteWebhook` (last 3 with `@todo` — dashboard-managed for now).

**Manifest:** `src/lib/integrations/integrations/recharge.integration.ts`. `PaymentProviderAdapter` with `category: BILLING`, `authType: "api_key"`, `supportsOAuth: false`. 9 webhook events declared.

**Webhook pipeline (Sub-etapa 10 revised):**
1. POST arrives at `src/app/api/webhooks/recharge/route.ts`.
2. `RechargeWebhookVerifier` (`sha256(secret + body)` literal, NOT HMAC).
3. Parse + `payload.id` as dedup event_id.
4. `resolveTenantFromPayload` via `MemberConnection`.
5. Fast-path dedup + atomic transaction `webhook_dedup.create + emitDomainEvent`.
6. Ack 200.
7. Async worker invokes `rechargeHandler` (`src/lib/webhooks/handlers/recharge.handler.ts`), which writes `IntegrationWebhookEvent` in tenant scope.

Sub-etapa 11 will introduce the raw → canonical mapper (Charge/Subscription/BillingCustomer normalization).

## Operations

**First-time setup:**

1. Set `RECHARGE_API_KEY` in `.env` locally + Railway.
2. `npm run seed:recharge` creates/updates the Integration row.
3. In the Recharge dashboard: register webhook URL `${DEPLOY_URL}/api/webhooks/recharge` with the 9 events listed above.
4. Smoke test: dashboard has a "Send test webhook" button — confirm 200 + entry in `IntegrationWebhookEvent`.

**Tech debt tracked in AGENTS.md:**

- Multi-tenant webhook subscription via API (dashboard-managed now).
- Historical backfill (forward-flow only V1).
- Storefront Token (browser-side customer portal).

## Glossary

- **Charge:** Recharge billing event (one attempt, status `success`/`failed`/etc.).
- **Order:** storefront checkout transaction that generated one or more charges.
- **Subscription:** recurring link between a Recharge customer and a Recharge plan.
- **Topic (X-Recharge-Topic header):** Recharge event type (e.g. `charge/paid`, `subscription/cancelled`).
- **payload.id:** stable event identifier, used as `eventId` for dedup.

## Changelog

- **2026-05-20 (Sub-etapa 10 revised):** API key path crystallized. `fromIntegration()` factory created, 4 admin routes refactored, webhook pipeline upgraded to outbox (parity with Gorgias/Intercom). Manifest `authType` corrected to `api_key`. Handbook entry created.
- **Pivot from OAuth:** original spec (pre-Fase 3) assumed OAuth Partner App. Bucked Up Recharge engineer confirmed: "none of the other client id client secret stuff made any sense for recharge. it's all based on the api key." API key is the path.
