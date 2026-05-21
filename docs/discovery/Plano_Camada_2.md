# Plano — Camada 2: Braintree Backend Integration

Histórico canônico de Camada 2. Cada sub-etapa abaixo foi executada via
chat-code-handoff protocol com discovery antecipada, worktree dedicado,
PR squash-merged em main, e archive tag em origin.

**Janela:** 2026-05-21 (sub-etapas em sequência rápida).
**PRs:** #48 a #51 (4 PRs — Sub-etapa 16 removida; ver abaixo).
**Backup pre-camada:** tag `camada-2-start` em origin (pré-Sub-etapa 13
state, idêntico a `archive/sub-etapa-13-braintree-adapter-6cb2f0b^`).

## Visão geral

Camada 2 integra Braintree como segundo billing provider em HERD,
paralelo a Recharge (Camada 1). **Backend only.** UI checkout fica
para Fase 5 (Marketplace + Interface).

**Reaproveitamento maciço da Camada 1:**

- Schema billing canonical (11 tabelas Sub-etapa 9) — 100%
- Webhook outbox + handler-registry (Sub-etapas 5-6) — 100%
- Worker + cron + observability (Sub-etapa 12) — 100%
- Mapper layer pattern (Sub-etapa 11 Recharge) — 100%
- Encryption pipeline AES-256-GCM — 100%
- AGENTS.md conventions + Handbook discipline — 100%

**Novo em Camada 2:**

- Braintree SDK install (`braintree` npm v3.37 + `@types/braintree`)
- Service com `BraintreeService.fromIntegration()` + `clientToken.generate({})`
  ping
- Webhook handler com form-encoded parsing (divergente JSON-only dos
  outros 3 providers)
- Mapper Braintree-specific (status mapping diferente, payload shape
  diferente, customer fallback synthetic stub)
- 12 webhook topics (vs 9 Recharge)
- 3-key auth (vs 1-key Recharge)
- Sandbox-first deployment, production cutover documentado

## Sub-etapas

### ✅ Sub-etapa 13 — Adapter manifest + Service + Auth + Seed (PR #48)

Adapter foundation. Criou `src/lib/services/braintree.ts`,
`src/lib/integrations/integrations/braintree.integration.ts`
(`PaymentProviderAdapter`, `category: BILLING`, `authType: "api_key"`,
12 webhook topics), e `scripts/seed-braintree-integration.ts`
(idempotent upsert). Decisão SDK vs fetch cravada como per-provider.

Tag: `archive/sub-etapa-13-braintree-adapter-6cb2f0b`.

### ✅ Sub-etapa 14 — Webhook handler + outbox + tenant extractor (PR #49)

Pipeline form-encoded + SDK verify + dedup composite + atomic IWE +
outbox emit. Tenant resolver com switch por kind + 1-tenant fallback.
Handler V1 raw-only (observability shim).

Manifest cravado em 12 topics (`transaction_settlement_pending`
removido — deprecated no SDK v3.37). 9 unit tests
(verifier + tenant extractor + e2e SDK contract).

Cravamentos SDK quirks:
- `gw.webhookTesting.sampleNotification` é instance method
- `notification.timestamp` é string ISO em runtime
- Sample notifications NÃO incluem `customerId`

Tag: `archive/sub-etapa-14-braintree-webhook-c3b20a2`.

### ✅ Sub-etapa 15 — Mapper raw → canonical billing schema (PR #50)

10 arquivos em `src/lib/mappers/braintree/`. Paridade arquitetural
com `src/lib/mappers/recharge/` (Sub-etapa 11). 5 mappers (Customer,
Subscription, Charge, PaymentMethod, PaymentProvider) + 3 helpers
(charge-status, subscription-status, amount-cents) + index + types.

Handler V1 raw-only → dispatcher por kind:
- `subscription_*` → ensureCustomer + mapSubscription + mapCharge
  per transactions[] + mapPaymentMethod
- `transaction_*` → ensureCustomer + mapCharge + mapPaymentMethod
- `dispute_*` → audit-only via IWE upstream

Customer resolution com synthetic stub fallback
(`tenant_${tenantId}_fallback`). 23 unit tests (status + amount helpers).

V1 skipped (tech debt): Refund mapping, canonical Dispute table,
DunningAttempt, ChargeLineItem, BillingEvent audit row.

Tag: `archive/sub-etapa-15-braintree-mapper-1648c5a`.

### 🚫 Sub-etapa 16 — REMOVIDA

**Programmatic webhook registration não é possível em Braintree.**
SDK npm v3.37 não expõe API de `webhookEndpoint` (apenas
`webhookNotification` para parse e `webhookTesting` para sample
generation). Control Panel UI é o único caminho de setup.

Diferente de Recharge (Sub-etapa 10.0.2, 3 scripts CLI:
register/list/delete), Camada 2 não tem paridade possível. Tech debt
cravado: revisitar quando Braintree publicar mutations GraphQL para
`webhookDestination`.

### ✅ Sub-etapa 17 — Camada 2 closeout (PR #51 — este)

Closeout deliverables:

- `scripts/test-braintree-webhook.ts` — CLI helper gera sample via
  `gw.webhookTesting.sampleNotification()` + POST form-encoded ao
  endpoint. `npm run braintree:test-webhook -- --base-url=... --kind=... --id=...`.
- `feature.yml` `source_paths` expandido (16+ paths cobrindo
  Sub-etapas 13-17).
- `pt-BR.md` + `en-US.md` atualizados com webhook pipeline + mapper
  layer + operações (Control Panel setup + smoke procedure +
  production cutover steps).
- AGENTS.md seção "Camada 2 closeout" cravada.
- Plano_Camada_2.md (este arquivo) formalizado.
- Anchor practice-housekeeping-git v1.2.11.

Tag de marco: `camada-2-complete`.

## Backup / archive tags em origin

| Tag | Posição | Sub-etapa |
|---|---|---|
| `camada-2-start` | pré-PR #48 | Sub-etapa 13 start |
| `pre-sub-13-braintree-adapter` | pré-PR #48 | Backup |
| `archive/sub-etapa-13-braintree-adapter-6cb2f0b` | pós-merge PR #48 | Sub-etapa 13 |
| `pre-sub-14-braintree-webhook` | pré-PR #49 | Backup |
| `archive/sub-etapa-14-braintree-webhook-c3b20a2` | pós-merge PR #49 | Sub-etapa 14 |
| `pre-sub-15-braintree-mapper` | pré-PR #50 | Backup |
| `archive/sub-etapa-15-braintree-mapper-1648c5a` | pós-merge PR #50 | Sub-etapa 15 |
| `pre-sub-17-braintree-closeout` | pré-PR #51 | Backup |
| `archive/sub-etapa-17-braintree-closeout-<hash>` | pós-merge PR #51 | Sub-etapa 17 |
| `camada-2-complete` | pós-merge PR #51 | Camada 2 closeout |

## Decisões arquiteturais cravadas

Ver AGENTS.md seção "Camada 2 closeout" — source of truth single.
Sumário replicado:

- **SDK vs fetch per-provider** (não regra geral)
- **3-key auth** + environment indicator
- **Webhook signing via SDK helper** (sem verifier file)
- **Form-encoded body** parsing
- **Dedup composite key** `${kind}:${subjectId}:${timestamp}`
- **1-tenant fallback** + synthetic customer stub
- **Webhook registration via Control Panel** (não API)
- **V1 skipped:** Refund, Dispute canonical, DunningAttempt,
  ChargeLineItem, BillingEvent audit

## Lições cravadas

- **SDK vs fetch decision é per-provider** — critério: complexidade
  de signing + maturidade SDK + bundle size.
- **Programmatic registration constraint Braintree** — UI-only setup.
  Documentar em integrações futuras com mesma constraint.
- **L7 cravado durante Camada 2** — `npm run build` local
  obrigatório para PRs tocando route handlers (Cache Components
  incompatible com `force-dynamic`).
- **practice-housekeeping-git v1.2.8 → v1.2.11** — 4 anchors em
  Camada 2 cobrindo Sub-etapas 13/14/15/17.

## Tech debt rastreado pós-Camada 2

Ver AGENTS.md "Camada 2 closeout" → "Tech debt rastreado pós-Camada 2".
11 itens com triggers explícitos:

1. Production cutover Braintree
2. Webhook scope expansion (12 → 30+)
3. Canonical Dispute table
4. Marketplace integration (sub-merchants)
5. Refund + DunningAttempt mappers
6. ChargeLineItem Braintree
7. BillingEvent audit row Braintree
8. Multi-tenant Braintree + remoção 1-tenant fallback
9. E2E integration test Braintree
10. `_shared/map-amount-cents` factor-out
11. Programmatic webhook registration

## Estado final pós-Sub-etapa 17

- ✅ Pipeline end-to-end pronto em sandbox
- ✅ 12 webhook topics manifesto V1
- ✅ 32 novos unit tests (9 webhook + 23 mapper)
- ✅ Seed Braintree ativo em DEV
- ✅ Production cutover steps documentados no handbook
- ✅ Sub-etapa 16 cravada como "não-aplicável Braintree"
- ✅ Tag `camada-2-complete` em main

## Próximos passos pós-Camada 2

- **Sandbox smoke real** (manual Nick) — configurar webhook destination
  no Control Panel sandbox + "Check URL" + validar
  `/api/health.outbox.lastProcessedAt` + IWE row.
- **Fase 4** — Organization (qualidade extrema).
- **Fase 5** — Marketplace + Fluxus + Listing + Interface (monetização
  crítica). UI checkout consume Braintree + Recharge.
- **Production cutover** Braintree (tech debt). Trigger: cliente
  requerer go-live + smoke sandbox validado.

## Timeline

| Sub-etapa | Data | PR | Notas |
|---|---|---|---|
| 13 | 2026-05-21 | #48 | Adapter foundation |
| 14 | 2026-05-21 | #49 | Webhook handler |
| 15 | 2026-05-21 | #50 | Mapper layer |
| 16 | — | — | REMOVIDA (SDK não suporta) |
| 17 | 2026-05-21 | #51 | Closeout |
