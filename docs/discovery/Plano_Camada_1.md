# Plano — Camada 1: Recharge Backend Integration

Histórico canônico de Camada 1. Cada sub-etapa abaixo foi executada via
chat-code-handoff protocol com discovery antecipada, worktree dedicado,
PR squash-merged em main, e archive tag em origin.

Documento criado retroativamente em paridade com `Plano_Camada_2.md`
durante Sub-etapa 17.0.8 (Camada 1 smoke-validated). Sumariza o trabalho
das Sub-etapas 5-12 (entrega original Recharge) + 17.0.1 + 17.0.3 +
17.0.8 (cravamentos preventivos pós-Camada 2).

**Janela original:** pré-pausa Camada 1 (`camada-1-pause-pre-recharge`)
+ retomada pós-Fase 3 (`camada-1-resume-post-fase-3`).

## Visão geral

Camada 1 integra Recharge como primeiro billing provider em ComeçaAI.
**Backend only.** UI checkout customer-facing fica para Fase 5
(Marketplace + Interface). Camada 1 é referência arquitetural canonical
da qual Camada 2 (Braintree) reaproveitou 100% de schema, outbox, worker,
mapper pattern, encryption pipeline.

**Cravamentos diferenciados Camada 1 (vs Camada 2):**

- Fetch direto (sem SDK) — escolha por simplicidade da API + pegadinha
  anti-HMAC no signing merecia controle direto.
- 1-key auth (`apiToken`) — vs 3-key Braintree.
- Signing canonical `sha256(secret + body)` literal (**NOT HMAC**) —
  pegadinha cravada com teste loud-fail dedicado.
- Webhook registration **via API** (Sub-etapa 10.0.2) — 3 scripts CLI
  (`recharge:register-webhooks` / `:list-webhooks` / `:delete-webhook`).
  Conta `bucked_up_herd_hl` é headless (UI não expõe webhook management).
- 9 webhook topics manifesto V1 (vs 12 Braintree).

## Sub-etapas

### ✅ Sub-etapa 5 — Webhook framework (verifier + tenant resolver)

Framework canonical em `src/lib/webhooks/`. `WebhookVerifier`
interface + `GorgiasWebhookVerifier` / `IntercomWebhookVerifier` /
`RechargeWebhookVerifier` / `RecallWebhookVerifier`. Recharge usa
literal `sha256(client_secret + raw_body)` hex — **NÃO HMAC**.
Teste loud-fail dedicado em `recharge.verifier.test.ts`.

### ✅ Sub-etapa 6 — Outbox dedup + handler registry

`webhook_dedup` platform-wide + `domain_events` outbox + handler
registry. Pattern single eventType per provider
(`webhook.recharge`) com dispatcher interno por `recharge_event_type`
em payload. Ingress < 500ms target + at-least-once delivery via
`SELECT FOR UPDATE SKIP LOCKED` no worker.

### ✅ Sub-etapa 7 — IntegrationAdapter horizontal/vertical

`PaymentProviderAdapter` vertical + `PaymentProviderManifest` schema.
Recharge é o primeiro `PaymentProviderAdapter` adopter (cravado
`category: BILLING` em Sub-etapa 10 quando service foi implementado).

### ✅ Sub-etapa 8 — Recall integration (Decision B — outbox skip)

Não estritamente Camada 1, mas cravou as conventions usadas pelos
demais providers: `summaryError` vs `errorMessage`, canonical pipeline
em `src/lib/meetings/process-recording.ts`, idempotency contract.

### ✅ Sub-etapa 9 — Billing schema (11 tabelas + RLS estrita)

Schema canonical billing tenant-scoped. `ChargeStatus` enum canonical
(8 estados). `ChargeLineItem` junction para Recharge composite
charges. `provider_data` JSONB preservando payload bruto.
`BillingEvent` audit row design.

### ✅ Sub-etapa 10 — Recharge API Key integration

Pivot OAuth → API Key direta. `RechargeService.fromIntegration()` +
encryption pipeline AES-256-GCM via `Integration.credentials`.
Webhook events registrados via API (`/webhooks` endpoint) — conta
headless precisa de programmatic registration.

Adapter manifest cravado: `category: BILLING`, `authType: "api_key"`,
9 webhook topics (order/created + charge/{created,paid,failed,refunded}
+ subscription/{created,updated,cancelled,activated}).

**Sub-etapa 10.0.2 — 3 CLI scripts:**
- `recharge:register-webhooks` — idempotent diff (manifest vs
  endpoint state) + `--delete-obsolete` + `--dry-run`.
- `recharge:list-webhooks` — list registered topics.
- `recharge:delete-webhook` — remove individual webhook by id.

`charge/paid` fallback automático para `charge/succeeded` em 422
(drift entre versões da Recharge API).

### ✅ Sub-etapa 11 — Mapper raw → canonical billing schema

8 arquivos em `src/lib/mappers/recharge/`. Pattern cravado
`(client, payload, ctx) => Promise<string | void>` com idempotência
via `(providerId, externalId)` unique upserts. Stub helpers
(`ensureSubscriptionStub`, `ensureCustomerByExternalId`) permitem
ordem de chegada não-determinística.

Mappers: Customer, Subscription, Charge, ChargeLineItem (junction
N:N para composite charges), PaymentProvider. Helpers: amount-cents,
charge-status mapping (provider vocabulary `success/paid/failed/...`
→ canonical `ChargeStatus`).

### ✅ Sub-etapa 12 — Cutover + observability

`/api/health` endpoint (db.connected + outbox.pending +
outbox.exhausted + outbox.lastProcessedAt). `/api/cron/domain-events-sync`
para Railway scheduled job. DLQ pattern: events em `attempts >= 5`
ficam non-pickable em `domain_events` permanentemente. Query SQL
canonical para listar exhausted + reprocess manual documentados em
AGENTS.md.

### 🚫 Sub-etapa 12.0.2 — OBSOLETA

Substituída por Sub-etapa 17.0.8 (Camada 1 smoke-validated).
Plano original previa "smoke real Recharge" como entrega separada
mas Sub-etapa 17.0.8 cravou smoke validation harness reutilizável
(`smoke:camada-1`), gap fix (MemberConnection seed enhancement), e
tag `camada-1-smoke-validated` num único pacote.

### ✅ Sub-etapa 17.0.1 — Tenant activation flow (cross-provider)

Discovery pós-Camada 2 revelou gap silencioso: `MemberConnection`
só era escrita em integration tests. Webhooks reais Recharge OR
Braintree falhariam 400 "tenant not found" no ingress sem seed.

Cravado `scripts/seed-member-connection.ts` cross-provider com
aliases `seed:recharge-connection` + `seed:braintree-connection`.
Idempotent via `@@unique([profileId, integrationId])`.

`FALLBACK_PROVIDERS = ["braintree", "recharge"]` cravado em
`tenant-resolver.ts` para 1-tenant fallback V1 sandbox.

### ✅ Sub-etapa 17.0.3 — Environment configuration conventions

Lição cravada: `ENCRYPTION_KEY` drift entre `.env` e `.env.local`
causou bug latente. Convenção cravada em AGENTS.md: `.env` é source
of truth; `.env.local` para overrides dev-only sem equivalente prod.

Validação rápida cravada (fingerprints sha256). Fix `prisma.ts` URL
precedence: throws explícito em empty-string env vars (prev silent
no-op via `??`). Smoke harness `validate-camada-2-smoke.ts` cravado
para uso em DEV + Railway.

### ✅ Sub-etapa 17.0.8 — Camada 1 smoke-validated (este)

Aplicação preventiva das lições Camada 2 a Camada 1 antes do primeiro
evento Recharge natural chegar.

Deliverables:

- **`RechargeService.getShopId()`** — public method para `/shop`
  query (auto-discovery de `externalUserId` no seed).
- **`scripts/seed-member-connection.ts` enhancement** — Recharge
  branch usa `RECHARGE_API_KEY` + `getShopId()` quando env var
  `RECHARGE_SHOP_ID`/`RECHARGE_MERCHANT_ID` ausente.
- **`scripts/test-recharge-webhook.ts`** — CLI helper com hardcoded
  `charge/created` fixture + canonical `sha256(secret + body)`
  signing (anti-HMAC literal). `npm run recharge:test-webhook -- --base-url=...`.
- **`scripts/validate-camada-1-smoke.ts`** — paridade
  `validate-camada-2-smoke.ts`. 6 checks: env vars + Integration
  decrypt + MemberConnection + RechargeService.testConnection +
  Webhook delivery + Outbox processing autônomo.
- **`Plano_Camada_1.md`** (este arquivo) — formalização retroativa.
- AGENTS.md seção "Camada 1 smoke-validated" + cross-provider
  learning crystalized.
- Anchor practice-housekeeping-git (próxima versão após v1.2.18).

Tag de marco: `camada-1-smoke-validated` (após DEV + Railway 6/6).

## Backup / archive tags em origin

| Tag | Posição | Sub-etapa |
|---|---|---|
| `camada-1-pause-pre-recharge` | pré-pausa Camada 1 | Marco |
| `camada-1-resume-post-fase-3` | retomada post-Fase 3 | Marco |
| `archive/sub-etapa-10-recharge-api-key-*` | pós-merge | Sub-etapa 10 |
| `archive/sub-etapa-11-recharge-mapper-*` | pós-merge | Sub-etapa 11 |
| `archive/sub-etapa-12-observability-*` | pós-merge | Sub-etapa 12 |
| `archive/sub-etapa-17-0-1-tenant-activation-*` | pós-merge | Sub-etapa 17.0.1 |
| `archive/sub-etapa-17-0-3-env-conventions-*` | pós-merge | Sub-etapa 17.0.3 |
| `archive/sub-etapa-17-0-8-camada-1-smoke-<hash>` | pós-merge | Sub-etapa 17.0.8 |
| `camada-1-smoke-validated` | pós-DEV+Railway 6/6 | Camada 1 closeout |

## Decisões arquiteturais cravadas

Ver AGENTS.md "Camada 1 — Retomada Sub-etapa 10" + "Tenant activation
flow" + "Environment configuration conventions" — source of truth
single. Sumário replicado:

- **Fetch direto, sem SDK** (per-provider decision)
- **1-key auth** (`apiToken`)
- **Signing canonical `sha256(secret + body)` literal** (NOT HMAC)
  — pegadinha cravada com teste loud-fail
- **Webhook registration via API** (3 CLI scripts)
- **Customer fallback 1-tenant** + synthetic customer stub
- **9 webhook topics manifesto V1**
- **JSON body parsing** via `request.arrayBuffer()` + raw bytes
  para verifier

## Lições cravadas

- **Pegadinha anti-HMAC Recharge** — sha256(secret+body) literal,
  NOT createHmac. Teste loud-fail em `recharge.verifier.test.ts`
  com nome explícito.
- **Per-provider decision SDK vs fetch** — Recharge ficou com fetch
  porque API é simples + signing pegadinha merecia controle direto.
  Camada 2 (Braintree) escolheu SDK pelo critério oposto. Convenção
  cravada: per-provider, não regra geral.
- **MemberConnection seed obrigatório** (descoberto Sub-etapa 17.0.1)
  — webhooks reais falhariam 400 sem essa row. Cross-provider gap.
- **ENCRYPTION_KEY drift** (descoberto Sub-etapa 17.0.3) — `.env` vs
  `.env.local` precedence em Next.js runtime causa decrypt 500
  silencioso. Cross-env (não Camada-1-specific).
- **Smoke harness reutilizável** — 1 file template
  (`validate-camada-2-smoke.ts`), 1 sed-style swap (Camada 1).
  Próximo provider terá `validate-camada-3-smoke.ts` análogo.

## Cross-provider learning (Camada 1 vs Camada 2)

| Aspecto | Camada 1 (Recharge) | Camada 2 (Braintree) |
|---|---|---|
| Hotfixes recebidos | 1 (MemberConnection seed) | 7 (env conventions + route withTenant + handler unwrap + dispatch refactor + tenant resolver fallback + headers() opt-out + smoke harness) |
| Razão | Cravado canonical desde Sub-etapa 10 | V1 raw-only design + Cache Components incompatibility descoberta |
| Pattern de chegada | Provider 1 (template) | Provider 2 (descobertas) |
| Signing convention | sha256(secret+body) literal | SDK helper (proprietary) |
| Auth model | 1-key apiToken | 3-key merchant+public+private |
| Webhook registration | API (3 CLI scripts) | Control Panel UI only |
| Body parsing | JSON (`arrayBuffer`) | Form-encoded (`formData`) |
| Topics V1 | 9 | 12 |

**Lição meta-arquitetural cravada:** primeiro provider sofre menos
hotfixes porque o pattern é estabelecido naquele momento (Recharge
shaped the canonical). Segundo provider exercita o pattern e revela
gaps que não apareciam com um único caso. **Aplicar Camada 2 lessons
preventivamente ao Camada 1** (Sub-etapa 17.0.8) fecha o gap antes do
primeiro evento natural Recharge chegar — mais barato que reagir
em produção.

## Tech debt rastreado pós-Camada 1

Ver AGENTS.md "Camada 1 — Retomada Sub-etapa 10" → "Tech debt
rastreado". Itens com triggers explícitos:

1. Multi-tenant Recharge connect (Sub-etapa 10 deferral)
2. OAuth callback hardening (Sub-etapa 10.5 deferral)
3. Multi-tenant webhook subscription via API
4. Backfill histórico Recharge (forward-flow only V1)
5. Storefront Token integration (browser-side checkout)
6. Production smoke real Recharge (manual Nick) — pré-tag
   `camada-1-smoke-validated`

## Estado final pós-Sub-etapa 17.0.8

- ✅ Pipeline end-to-end pronto em sandbox + production
- ✅ 9 webhook topics manifesto V1 + programmatic registration
- ✅ Mapper layer cobrindo Customer/Subscription/Charge/ChargeLineItem
- ✅ Smoke harness `smoke:camada-1` reutilizável DEV + Railway
- ✅ Seed Recharge MemberConnection com API auto-discovery
- ✅ Tag `camada-1-smoke-validated` em main (após Nick rodar DEV + Railway 6/6)

## Próximos passos pós-Camada 1

- **Smoke DEV + Railway** (manual Nick) — rodar
  `npm run smoke:camada-1` em ambos + aplicar tag.
- **Fase 4** — Organization (qualidade extrema).
- **Fase 5** — Marketplace + Fluxus + Listing + Interface.
- **Tech debt resolution** conforme triggers fire.

## Timeline

| Sub-etapa | Janela | Notas |
|---|---|---|
| 5-9 | pré-pausa Camada 1 | Webhook framework + outbox + adapter + billing schema |
| 10 | retomada post-Fase 3 | Recharge API Key + webhook registration scripts |
| 11 | retomada post-Fase 3 | Mapper layer |
| 12 | retomada post-Fase 3 | Observability + cutover |
| 12.0.2 | — | OBSOLETA (substituída por 17.0.8) |
| 17.0.1 | pós-Camada 2 | Tenant activation flow (cross-provider) |
| 17.0.3 | pós-Camada 2 | Env conventions (cross-provider) |
| 17.0.8 | 2026-05-22 | Camada 1 smoke-validated |
