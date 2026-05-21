---
title: Braintree
description: Provider de pagamentos Braintree (PayPal). One-time charges + subscriptions com suporte a Apple Pay, Google Pay, PayPal, Venmo, Credit Card. Sandbox-first (Camada 2).
locale: pt-BR
uid: herd.integration.payment.braintree
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Braintree

Provider de pagamentos Braintree (subsidiária PayPal). Segundo billing provider de HERD, paralelo a Recharge. Inaugura **Camada 2** (backend-only para Fase 5; UI checkout vem com Marketplace).

## Business

Braintree processa charges one-time e subscriptions com suporte a múltiplos payment methods (Apple Pay, Google Pay, PayPal, Venmo, Credit Card). Cobre casos que Recharge não atende — checkout não-recorrente, multi-method wallets, internacional fora do escopo Shopify-native.

V1 (Camada 2): **sandbox only**. Production cutover é tech debt rastreado em AGENTS.md — depende de smoke test sandbox validado + go-live decisão do cliente.

Par natural de Recharge: ambos `category: BILLING`, ambos consomem `Subscription` + `Charge` blocks, ambos seguem mesmo pattern de adapter/service/mapper. Coexistem por feature flag e/ou roteamento de checkout no produto.

## Product

V1 backend-only. Não há UI exposta a usuário final. Endpoints internos:

- `npm run seed:braintree` — provisiona `Integration` row em DEV/prod com credentials encripted.
- (Sub-etapa 16) `npm run braintree:register-webhooks` — registra webhook destination via SDK no Braintree.

Não consume actions do orchestrator hoje. Stack mínima para receber webhooks e mapear para schema canonical (Sub-etapas 14-15).

## Architecture

**Service:** `src/lib/services/braintree.ts`. `BraintreeService.fromIntegration()` carrega credentials encrypted do Integration row, instancia `braintree.BraintreeGateway` com environment dinâmico (sandbox/production). Métodos primários: `testConnection()` (read-only ping), `listWebhooks/createWebhook/deleteWebhook` (Sub-etapa 16 stubs).

**Manifest:** `src/lib/integrations/integrations/braintree.integration.ts`. `PaymentProviderAdapter` com `category: BILLING`, `authType: "api_key"`, `chargeModel: "both"`, `supportsBillingPortal: false` (Braintree não tem Customer Portal builtin).

**SDK vs fetch — decisão cravada:** Camada 2 usa `braintree` npm SDK (v3.37). Decisão divergente de Recharge (fetch direto). Razões: (1) signature verification proprietária com helpers built-in no SDK; (2) API surface maior + GraphQL via SDK; (3) cliente Bucked Up usa SDK em outros projetos. Custo: ~5MB bundle, OK para backend.

**Auth:** 3-key triplet (merchantId + publicKey + privateKey) + environment flag. Encrypted como JSON blob em `Integration.credentials`. `authType: "api_key"` reaproveita o enum value Recharge cravou (Sub-etapa 10) — conceitualmente as 3 keys formam um único set.

**Webhook pipeline (Sub-etapa 14):** Braintree usa `application/x-www-form-urlencoded` body com fields `bt_signature` + `bt_payload`. SDK helper `gateway.webhookNotification.parse(signature, payload)` faz verify-and-parse em uma chamada. Pipeline reaproveita dedup + outbox da Sub-etapa 6 (igual Recharge/Gorgias/Intercom).

**Mapper (Sub-etapa 15):** funções puras em `src/lib/mappers/braintree/`. Mesmo pattern de `src/lib/mappers/recharge/`. ChargeStatus mapping próprio (Braintree usa `settled`/`processor_declined`/`voided`/etc.).

## Operations

**First-time setup (Camada 2 V1, sandbox):**

1. Setar 4 env vars em `.env` local + Railway:
   - `BRAINTREE_MERCHANT_ID`
   - `BRAINTREE_PUBLIC_KEY`
   - `BRAINTREE_PRIVATE_KEY`
   - `BRAINTREE_ENVIRONMENT=sandbox`
2. `npm run seed:braintree` cria/atualiza Integration row.
3. (Sub-etapa 16) `npm run braintree:register-webhooks` registra webhook destination apontando para `${DEPLOY_URL}/api/webhooks/braintree`.

**Smoke test (Sub-etapa 17):** evento sintético no Braintree sandbox → confirmar `IntegrationWebhookEvent` row no DB + `BillingEvent` audit + canonical rows (Charge/Subscription) populadas.

**Webhook events V1 (13 kinds):**

- Subscription: `subscription_charged_successfully`, `subscription_charged_unsuccessfully`, `subscription_canceled`, `subscription_trial_ended`, `subscription_went_past_due`, `subscription_expired`
- Transaction: `transaction_settled`, `transaction_settlement_declined`, `transaction_settlement_pending`, `transaction_disbursed`
- Dispute: `dispute_opened`, `dispute_lost`, `dispute_won`

**Tech debt rastreado em AGENTS.md (seção Camada 2):**

- Production cutover Braintree (sandbox → production). Trigger: smoke test sandbox validado + cliente requerer go-live.
- Webhook scope expansion (13 → ~30 disponíveis). Trigger: produto requerer events extras (`partner_merchant_*`, `payment_method_*`, `disbursement_*`).
- Marketplace integration (sub-merchants Braintree). Trigger: Bucked Up modelo de negócio expandir para multi-vendor.

## Glossary

- **Merchant Account:** entidade no Braintree representando o vendedor (Bucked Up).
- **Sub-merchant:** vendedor secundário em marketplaces (futuro).
- **Settlement:** processo de transferir fundos da transaction para o merchant account.
- **Disbursement:** transferência de fundos do merchant account para o banco.
- **Dispute:** chargeback iniciado pelo cliente — disputado no fluxo de processor.

## Changelog

- **2026-05-21 (Sub-etapa 13, Camada 2):** adapter foundation criado. Service + manifest + seed script. Sub-etapas 14-17 entregam handler, mappers, registration, smoke.
