---
title: Braintree
description: Provider de pagamentos Braintree (PayPal). One-time charges + subscriptions com suporte a Apple Pay, Google Pay, PayPal, Venmo, Credit Card. Backend completo em sandbox (Camada 2).
locale: pt-BR
uid: herd.integration.payment.braintree
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Braintree

Provider de pagamentos Braintree (subsidiária PayPal). Segundo billing provider de HERD, paralelo a Recharge. Inaugura **Camada 2** (backend-only para Fase 5; UI checkout vem com Marketplace).

Camada 2 entregue em sub-etapas 13 → 17 (2026-05-21). Pipeline end-to-end pronto em sandbox: adapter + service + webhook handler + mapper layer + dispatcher + dedup + outbox + worker.

## Business

Braintree processa charges one-time e subscriptions com suporte a múltiplos payment methods (Apple Pay, Google Pay, PayPal, Venmo, Credit Card). Cobre casos que Recharge não atende — checkout não-recorrente, multi-method wallets, internacional fora do escopo Shopify-native.

V1 (Camada 2): **sandbox only**. Production cutover é tech debt rastreado em AGENTS.md — depende de smoke test sandbox validado + go-live decisão do cliente.

Par natural de Recharge: ambos `category: BILLING`, ambos consomem `Subscription` + `Charge` blocks, ambos seguem mesmo pattern de adapter/service/mapper. Coexistem por feature flag e/ou roteamento de checkout no produto.

## Product

V1 backend-only. Não há UI exposta a usuário final. Endpoints internos:

- `npm run seed:braintree` — provisiona `Integration` row em DEV/prod com credentials encryptadas.
- `npm run braintree:test-webhook -- --base-url=... --kind=... --id=...` — gera sample notification via SDK e dispara ao endpoint local/deploy. Útil para iteração de dev sem ir ao Control Panel.

Não consume actions do orchestrator hoje. Stack mínima para receber webhooks e mapear para schema canonical.

## Architecture

**Service:** `src/lib/services/braintree.ts`. `BraintreeService.fromIntegration()` carrega credentials encryptadas do Integration row, instancia `braintree.BraintreeGateway` com environment dinâmico (sandbox/production). Métodos: `testConnection()` (via `clientToken.generate({})` — ping read-only sem PII).

**Manifest:** `src/lib/integrations/integrations/braintree.integration.ts`. `PaymentProviderAdapter` com `category: BILLING`, `authType: "api_key"`, `chargeModel: "both"`, `supportsBillingPortal: false`. 12 webhook topics V1.

**SDK vs fetch — decisão cravada:** Camada 2 usa `braintree` npm SDK (v3.37). Divergente de Recharge (fetch direto). Razões: (1) signature verification proprietária com helpers built-in; (2) API surface maior + GraphQL via SDK; (3) cliente Bucked Up usa SDK em outros projetos. Custo: ~5MB bundle.

**Auth:** 3-key triplet (merchantId + publicKey + privateKey) + environment flag. Encryptado como JSON blob em `Integration.credentials` via AES-256-GCM. `authType: "api_key"` reaproveita o enum value Recharge cravou.

### Webhook pipeline (Sub-etapa 14)

**Format:** `application/x-www-form-urlencoded` com fields `bt_signature` + `bt_payload`. Route handler `src/app/api/webhooks/braintree/route.ts` usa `await request.formData()` (divergente de Recharge/Gorgias/Intercom que parseiam JSON).

**Verification:** SDK `gateway.webhookNotification.parse(bt_signature, bt_payload)` faz verify + parse numa única chamada. **Sem verifier file dedicado** — Braintree é o primeiro provider sem class em `src/lib/webhooks/verifiers/`.

**Dedup composite:** `${kind}:${subjectId}:${timestamp.toISOString()}`. Braintree não emite event_id estável; composite resiste a retries provider-side (24h prod, 3h sandbox).

**Tenant resolution:** `extractExternalId("braintree", notification)` switch por kind (subscription/transaction/dispute) + **1-tenant fallback** quando customerId ausente (sample fixtures ou edge cases).

**Outbox emit:** `emitDomainEvent("webhook.braintree", { tenantId, kind, subjectId, body })` atomicamente com `webhook_dedup.create` + `IntegrationWebhookEvent.create` raw.

### Mapper layer (Sub-etapa 15)

10 arquivos em `src/lib/mappers/braintree/`. Paridade arquitetural com `src/lib/mappers/recharge/`. Funções puras `(client, payload, ctx) => Promise<string | null>` com idempotência via `(providerId, externalId)` unique upserts.

**Escopo V1 (5 entidades canonical):**

- `mapBraintreeCustomer` — BillingCustomer (firstName + lastName → name)
- `mapBraintreeSubscription` + `ensureBraintreeSubscriptionStub`
- `mapBraintreeCharge` — Subscription stub se transaction tem subscriptionId
- `mapBraintreePaymentMethod` — silent skip se sem `paymentMethodToken`
- `upsertBraintreePaymentProvider` — catalog row helper

**Status helpers (loud-fail em unknown):**

- `mapBraintreeChargeStatus`: 13 Transaction.Status → 8 canonical ChargeStatus (settled/settlement_confirmed → SUCCESS; settlement_declined/processor_declined/gateway_rejected/failed → FAILED; voided/authorization_expired → CANCELLED; submitted_for_settlement/settling/settlement_pending/authorizing/authorized → PENDING).
- `mapBraintreeSubscriptionStatus`: Title Case + espaço → lowercase + underscore (`"Past Due"` → `"past_due"`).

**Handler dispatcher:**
- `subscription_*` → ensureCustomer → mapSubscription + mapCharge per `transactions[]` + mapPaymentMethod
- `transaction_*` → ensureCustomer → mapCharge + mapPaymentMethod
- `dispute_*` → audit-only via IWE upstream (V1 — sem canonical Dispute table)

**Customer fallback synthetic stub** (`tenant_${tenantId}_fallback`) para sample fixtures sem customer.id. Idempotente.

**Skipped V1 (tech debt rastreado):** Refund mapping, canonical Dispute table, DunningAttempt, ChargeLineItem (Braintree não tem split equivalente Recharge), BillingEvent audit row.

## Operations

**First-time setup (Camada 2 V1, sandbox):**

1. Setar 4 env vars em `.env` local + Railway:
   - `BRAINTREE_MERCHANT_ID`
   - `BRAINTREE_PUBLIC_KEY`
   - `BRAINTREE_PRIVATE_KEY`
   - `BRAINTREE_ENVIRONMENT=sandbox`
2. `npm run seed:braintree` — cria/atualiza Integration row encryptada.
3. **Configurar webhook destination no Control Panel sandbox** (passo manual — ver abaixo).

### Configuração webhook destination (Control Panel sandbox)

Braintree **não expõe API para gerenciamento de webhook destinations** — o SDK npm v3.37 não tem `gateway.webhookEndpoint` ou equivalente. Setup é manual via Control Panel UI:

1. Login em `sandbox.braintreegateway.com`.
2. Settings → API → Webhooks.
3. Clicar "Generate New Webhook".
4. **Destination URL:** `https://<deploy-url>/api/webhooks/braintree` (HTTPS obrigatório em prod; sandbox aceita HTTP-tunnels para dev).
5. Selecionar os **12 topics V1**:
   - **Subscription** (6): `subscription_charged_successfully`, `subscription_charged_unsuccessfully`, `subscription_canceled`, `subscription_trial_ended`, `subscription_went_past_due`, `subscription_expired`
   - **Transaction** (3): `transaction_settled`, `transaction_settlement_declined`, `transaction_disbursed`
   - **Dispute** (3): `dispute_opened`, `dispute_lost`, `dispute_won`
6. Save.

### Smoke procedure

**Path A — Control Panel "Check URL" (canonical):**

1. Na lista de webhooks sandbox, clicar "Check URL" no destination criado.
2. Braintree envia `Check` notification real (signed) ao endpoint.
3. Aguardar 1–2 minutos para worker processar.
4. Validar:
   ```bash
   curl https://<deploy-url>/api/health | jq .
   # outbox.lastProcessedAt deve estar atualizado
   ```
5. Inspecionar:
   ```sql
   SELECT id, "eventType", "tenantId", "createdAt"
   FROM "IntegrationWebhookEvent"
   ORDER BY "createdAt" DESC LIMIT 5;
   -- Deve aparecer row com eventType="check" ou kind real
   ```

**Path B — Script local (dev convenience):**

```bash
npm run braintree:test-webhook -- \
  --base-url=http://localhost:3000 \
  --kind=transaction_settled \
  --id=test_txn_smoke
```

Gera `{bt_signature, bt_payload}` via `gw.webhookTesting.sampleNotification()` e dispara POST form-encoded direto ao endpoint. **Bypassing Braintree** — não valida o caminho de rede; útil para iterar lógica de handler+mapper localmente.

**Para validar canonical writes (mapper):** triggar evento real no sandbox (criar transaction via Control Panel ou SDK call) → confirmar rows em `payment_providers`, `billing_customers`, `subscriptions`, `charges`.

### Production cutover (tech debt — passos cravados)

1. Setar `BRAINTREE_ENVIRONMENT=production` em Railway.
2. Setar 3 chaves de produção: `BRAINTREE_MERCHANT_ID`, `BRAINTREE_PUBLIC_KEY`, `BRAINTREE_PRIVATE_KEY` (valores diferentes dos sandbox).
3. Rodar `npm run seed:braintree` em ambiente Railway production (idempotente upsert).
4. Configurar webhook destination no **Control Panel production** Braintree (`braintreegateway.com`, não sandbox), apontando para deploy URL.
5. Repetir smoke procedure no production.

Trigger: smoke sandbox validado + cliente requerer go-live.

## Glossary

- **Merchant Account:** entidade no Braintree representando o vendedor (Bucked Up).
- **Sub-merchant:** vendedor secundário em marketplaces (futuro).
- **Settlement:** processo de transferir fundos da transaction para o merchant account.
- **Disbursement:** transferência de fundos do merchant account para o banco.
- **Dispute:** chargeback iniciado pelo cliente — disputado no fluxo de processor.
- **Webhook destination:** URL configurada no Control Panel onde Braintree envia notifications. Não há API para criar/listar/deletar destinations — UI only.
- **Control Panel:** painel admin Braintree (`braintreegateway.com` / `sandbox.braintreegateway.com`).

## Changelog

- **2026-05-21 (Sub-etapa 17, Camada 2 closeout):** test webhook CLI helper + handbook updates + AGENTS.md closeout + Plano_Camada_2.md. Tag `camada-2-complete` aplicada.
- **2026-05-21 (Sub-etapa 15):** mapper layer raw → canonical (10 arquivos, handler dispatcher refator).
- **2026-05-21 (Sub-etapa 14):** webhook handler + outbox + tenant extractor + dedup composite.
- **2026-05-21 (Sub-etapa 13, Camada 2 start):** adapter foundation. Service + manifest + seed.
