# Changelog — practice-housekeeping-git

Documentação histórica das mudanças desta skill. Detalhes técnicos vivem em `SKILL.md`; este changelog é narrativa.

## 1.2.16 — 2026-05-22

Anchor entry. PR (Sub-etapa 17.0.5 — Braintree handler unwrap +
smoke autonomous). Smoke real pós Sub-etapa 17.0.4 revelou que o
braintreeHandler crashava com
`Cannot read properties of undefined (reading 'toLowerCase')` no
`mapBraintreeChargeStatus`. Root cause:

- Route emit shape: `payload.body = notification.subject` =
  `{transaction: {...}}` (wrapper)
- Handler dispatch cast `body` direto como `BraintreeTransactionPayload`
  → `body.status` undefined → mapper crash

Fix: handler unwrap explicit. Extract `subject.transaction`,
`subject.subscription`, `subject.dispute` antes do dispatch. Loud-fail
se a key esperada faltar.

Smoke autonomous: Check 6 deixou de depender de cron externo. Agora
POSTs `/api/cron/domain-events-sync` com `Bearer ${CRON_SECRET}`,
parsea o response shape `{picked, succeeded, failed, noHandler,
exhausted}`, e exige `succeeded > 0 && failed === 0`. Funciona idem
em DEV (sem scheduled cron) e prod (segundo trigger não atrapalha).
CRON_SECRET adicionado em Check 1 required vars.

Refs: Sub-etapa 17.0.5.

## 1.2.15 — 2026-05-22

Anchor entry. PR (Sub-etapa 17.0.4 — Braintree route `withTenant` wrap).
Smoke real em DEV (pós Sub-etapa 17.0.3 + `.env.local` cleanup) parou
em Check 5 com 500: `new row violates row-level security policy for
table "IntegrationWebhookEvent"` (code 42501). Route handler escrevia
IWE direto na transaction sem `withTenant(tenant.tenantId, ...)`, então
`app.tenant_id` GUC não estava setado e a policy strict rejeitava o
INSERT (a policy tightened de permissive `USING true` para strict em
sub-etapa subsequente sem que o Braintree route fosse atualizado).

Discovery confirmou cross-handler sweep: bug isolado a Braintree
(V1 raw-only design da Sub-etapa 14 — Gorgias/Intercom/Recharge
escrevem IWE só no outbox handler que JÁ usa `withTenant`).

Fix: wrap `prisma.$transaction(...)` com `withTenant(tenant.tenantId,
...)` no route handler Braintree. Padrão idêntico aos outbox handlers.

Refs: Sub-etapa 17.0.4.

## 1.2.14 — 2026-05-22

Anchor entry. PR (Sub-etapa 17.0.3 — encryption key alignment + smoke
validation cravado). Discovery cirúrgica pós Sub-etapa 17.0.2 revelou
2 bugs latentes:

1. ENCRYPTION_KEY drift entre `.env` e `.env.local` — Next.js runtime
   carrega `.env.local` primeiro (spurious key), scripts via tsx +
   dotenv/config carregam `.env` (canonical). Handler decrypt fail 500
   silent em runtime.
2. `src/lib/prisma.ts` URL precedence via `??` — empty string passava
   pelo nullish coalescing → crash opaco em `new PrismaPg("")`.

Entregas:
- `src/lib/prisma.ts`: `resolveConnectionString()` helper com explicit
  empty-string throw.
- `scripts/validate-camada-2-smoke.ts`: 6 checks end-to-end (env,
  decrypt, member connection, service, webhook, outbox).
- `npm run smoke:camada-2 [-- --base-url=<url>]`.
- AGENTS.md: seção "Environment configuration conventions" cravada
  (.env vs .env.local rules + validation snippet + prisma.ts fix +
  smoke runner doc).

Manual action por Nick antes do smoke phase (não é parte do PR):
- Remover `ENCRYPTION_KEY` de `.env.local` (spurious — sha256 8851d4ac).
  `.env` ENCRYPTION_KEY (sha256 bc9fb7da) é canonical e bate com prod.

Versão pulou v1.2.13 (já usada em Sub-etapa 17.0.2).

Refs: Sub-etapa 17.0.3.

## 1.2.13 — 2026-05-21

Anchor entry. PR (Sub-etapa 17.0.2 — fix seed RLS bypass). Smoke real
em DEV pegou: `seed-member-connection.ts` usava o singleton runtime
(`@/lib/prisma`, role `herd_app` NOBYPASSRLS) e o INSERT em
`member_connections` falhou no policy `mc_tenant_isolation` (código
42501). Fix: script agora instancia `PrismaClient` próprio com
`PrismaPg(DATABASE_URL)` (role `postgres`, bypass). Mesmo pattern já
usado em `tenant-resolver.ts` e nos integration tests. Docblock cravado
no script explicando por que NÃO migrar de volta para o singleton.

Refs: Sub-etapa 17.0.2 (fix-on-hotfix).

## 1.2.12 — 2026-05-21

Anchor entry. PR (Sub-etapa 17.0.1 — hotfix post-Camada 2). Gap
arquitetural revelado pelo smoke da Sub-etapa 17: `MemberConnection`
table vazia em DEV, zero caminho de produção (UI ou seed) criava rows.
Webhooks reais Recharge/Braintree falhariam 400.

Entregas:
- `scripts/seed-member-connection.ts` parametrizado por `--slug`
- 3 npm aliases: `seed:connection`, `seed:braintree-connection`,
  `seed:recharge-connection`
- Resolver `tenant-resolver.ts` generalizado: fallback 1-tenant aplica
  para braintree + recharge em 2 cenários (no externalId + externalId
  no match)
- AGENTS.md: seção "Tenant activation flow" cravada

Refs: Sub-etapa 17.0.1, hotfix post-Camada 2.

## 1.2.11 — 2026-05-21

Anchor entry. PR (Sub-etapa 17 — Camada 2 closeout). Test webhook CLI
helper (`scripts/test-braintree-webhook.ts` + `npm run braintree:test-webhook`),
handbook update bilingual (feature.yml source_paths expandido para 16
paths; pt-BR.md + en-US.md com webhook pipeline + mapper layer +
Control Panel setup + smoke procedure + production cutover steps),
AGENTS.md seção "Camada 2 closeout", `docs/discovery/Plano_Camada_2.md`
formalizado (paridade Plano_Fase_3.md shape).

Sub-etapa 16 removida — programmatic webhook registration não é
possível em Braintree (SDK não expõe API). Tech debt conditional na
Braintree publicar mutations GraphQL.

Tag `camada-2-complete` aplicada pós-merge em main.

Refs: Sub-etapa 17, Camada 2 closeout.

## 1.2.10 — 2026-05-21

Anchor entry. PR (Sub-etapa 15 — Braintree mapper raw → canonical billing
schema, Camada 2). 10 arquivos em `src/lib/mappers/braintree/` (paridade
Sub-etapa 11 Recharge). Handler V1 raw-only → dispatcher por kind
(subscription_/transaction_/dispute_). Synthetic customer stub fallback
para sample fixtures sem customer.id. 23 unit tests (status mapping +
amount cents helpers). Tech debt cravado: BillingEvent audit, canonical
Dispute table, Refund/DunningAttempt mappers — todos com trigger
explícito em AGENTS.md.

Refs: Sub-etapa 15, Camada 2.

## 1.2.9 — 2026-05-21

Anchor entry. PR (Sub-etapa 14 — Braintree webhook handler + outbox +
tenant extractor, Camada 2). Pipeline form-encoded + SDK verify + dedup
composite + atomic IWE + outbox emit. 9 unit tests (3 verifier roundtrip
+ 6 tenant extractor). Manifest cravado em 12 topics (removido
`transaction_settlement_pending` deprecated). `testConnection()` bug
cosmético da Sub-etapa 13 corrigido via `clientToken.generate({})`.

E2E integration test (análogo a `gorgias-e2e.integration.test.ts`)
deferido como tech debt em AGENTS.md — unit tests cobrem o contrato
SDK; e2e fica para Sub-etapa 17 smoke real ou follow-up se regressão
silenciosa detectada.

Refs: Sub-etapa 14, Camada 2.

## 1.2.8 — 2026-05-21

Anchor entry. PR (Sub-etapa 13 — Braintree adapter + service + seed,
Camada 2 start). Primeiro provider a usar SDK npm (`braintree` v3.37)
em vez de fetch direto. Decisão SDK vs fetch cravada como per-provider
em AGENTS.md.

Refs: Sub-etapa 13, Camada 2 start.

## 1.2.7 — 2026-05-21

Anchor entry. PR (Sub-etapa 12.0.1 — hotfix Next 16 Cache Components
incompatibility). Removidas 2 linhas `export const dynamic = "force-dynamic"`
das routes introduzidas em Sub-etapa 12. Build local validado em main repo.

Refs: Sub-etapa 12.0.1.

## 1.2.6 — 2026-05-21

Anchor entry. PR (Sub-etapa 12 — cutover minimal: cron worker + health
endpoint + DLQ doc). Operationaliza Camada 1: worker domain-events existia
como CLI mas Railway não disparava. Sub-etapa cria a cron route + health
endpoint + AGENTS.md section "Observability — Camada 1 minimal".

Spec previa refactor de `process-pending-batch.ts` mas função
equivalente (`processPendingEvents`) já existia em `process-pending-events.ts`.
Refactor descartado; cron route reutiliza a função existente direto.

Refs: Sub-etapa 12.

## 1.2.5 — 2026-05-21

Anchor entry. PR (Sub-etapa 11 — mapper Recharge raw → canonical billing
schema). Cria `src/lib/mappers/recharge/` (8 files), refator
`recharge.handler.ts` para dispatcher por topic, 2 test files com 18
testes para helpers puros (`mapChargeStatus` + `mapAmountCents`).

Integration tests com fixtures Recharge sintéticos diferidos como
follow-up (Sub-etapa 11.0.1 ou ad-hoc após primeiro payload real em
produção fornecer fixture canonical). Mappers são funções puras com
upserts via constraints — risco baixo de regressão silenciosa.

Refs: Sub-etapa 11.

## 1.2.4 — 2026-05-20

Anchor entry. PR (Sub-etapa 10.0.2 — programmatic Recharge webhook
registration scripts). 3 scripts CLI novos + atualiza handbook + AGENTS.md.

Refs: Sub-etapa 10.0.2.

## 1.2.3 — 2026-05-20

Anchor entry. PR (Sub-etapa 10.0.1 — dotenv hotfix em seed script).
Adicionada nota "Scripts standalone precisam dotenv" no SKILL.md,
documentando o padrão `import "dotenv/config"` como primeira linha
de scripts standalone. Refs: Sub-etapa 10.0.1.

## 1.2.2 — 2026-05-20

Anchor entry. PR (Sub-etapa 10 revised — Recharge API key integration +
webhook outbox) toca `src/lib/services/`, `src/lib/webhooks/handlers/`,
`src/lib/integrations/`, `src/app/api/{integrations,webhooks}/recharge/**`,
`docs/handbook/integrations/payment/**`, `AGENTS.md`, `scripts/`. Inclui
toques em `docs/handbook/**` (freshness/validate disparam) + `.agents/skills/**`
(este próprio anchor) — path-filter trigger garantido via dois caminhos.
Anchor proativo nas fases pós-Fase 3 (lição cravada na v1.2.1).

## 1.2.1 — 2026-05-20

Anchor entry. PR #41 (Sub-etapa 3.10 — final pass + close-out) tocou
apenas `src/**` (1 delete) + `docs/discovery/**` (Plano update). Sem
mudança em `.agents/skills/**`, `docs/handbook/**`, ou `schemas/**` —
path-filter NÃO disparou `freshness` + `validate` workflows, e ambos
são Required gates. Bloqueio descoberto pós-push.

Anchor v1.2.1 adicionado num segundo push para tripar o path-filter
e liberar o merge. Lição cravada: **toda sub-etapa de Fase 3+ que NÃO
toca paths handbook/skills/schemas precisa de anchor proativo no
push inicial**, não como recurso de recovery. Atualizar "How to update"
em SKILL.md no próximo bump para refletir.

## 1.2.0 — 2026-05-20

Adições pós-Fase 3 (Sub-etapas 3.5 → 3.8). Nova seção "Worktree operations"
em SKILL.md, codificando o padrão usado nas 7 sub-etapas da Fase 3:

- Setup com symlink temporário de `node_modules` e cópia de `.env`.
- Cleanup pré-push (remover symlink + .env).
- Cleanup pós-squash-merge — branch orfanada exige `git branch -D`.
- Build local em worktree é expected failure (Turbopack cross-worktree symlink).
- `gen:all` no-diff em PRs cosméticos — anchor proativo no CHANGELOG.
- Recovery de `--no-verify` denied via `git reset --soft HEAD~1`.

Refs: Sub-etapas 3.5 → 3.8 (todas usaram este padrão).

Este push (Sub-etapa 3.9) toca `docs/handbook/**` + `.agents/skills/**` + 
`AGENTS.md`. Path-filter trigger natural (já dispara freshness + validate); 
v1.2.0 codifica o aprendizado, não age como anchor.

## 1.1.8 — 2026-05-20

Anchor entry. PR (Sub-etapa 3.8 — manifest audit: 6 áreas em union literal,
fixes consistency em chat/knowledge/ledger, polish em registry + marketing)
toca `src/lib/tools/**` + `AGENTS.md` + `mcp/generated/**`. Mesmo
path-filter pattern. Anchor proativo neste push para disparar
freshness + validate.

## 1.1.7 — 2026-05-20

Anchor entry. PR (Sub-etapa 3.7 — split networkTool → organizationTool +
profileTool) toca `src/lib/tools/**` + `mcp/generated/**` + `public/llms.txt`.
Mesmo path-filter pattern. Anchor proativo neste push para disparar
freshness + validate.

## 1.1.6 — 2026-05-20

Anchor entry. PR #37 (Sub-etapa 3.6 — ALTER NetworkProfile + drop
NetworkProfileType + NCP) toca `prisma/**` + `src/**` + `mcp/generated/**`.
Mesmo path-filter pattern. Anchor proativo neste push.

## 1.1.5 — 2026-05-20

Anchor entry. PR #36 (Sub-etapa 3.5.5 — drop PartnerBrand entirely, keep
Perk as single concept) toca `prisma/**` + `src/**` + `mcp/generated/**`.
Mesmo path-filter pattern. Anchor proativo neste push para disparar
freshness+validate sem segundo round.

## 1.1.4 — 2026-05-20

Anchor entry. PR #35 (Sub-etapa 3.5 — DROP MLM/Commission/D2D tables) toca
apenas `prisma/**` + `src/**` + `mcp/generated/manifest.json`. Mesmo
path-filter pattern dos anchors anteriores (1.1.1, 1.1.2, 1.1.3). Anchor
proativo neste push.

## 1.1.3 — 2026-05-19

Anchor entry. PR #33 (Sub-etapa 3.4 — Commission/D2D/Network components
cleanup) toca apenas `src/**` (zero `.agents/skills/**`,
`docs/handbook/**`, `schemas/**`). Mesmo path-filter pattern dos PR
#31/#32. Anchor adicionado proativamente neste mesmo push para
disparar freshness+validate sem segundo round.

## 1.1.2 — 2026-05-19

Anchor entry. PR #32 (Sub-etapa 3.3 — remove RBAC + /api/network/* +
/admin/network/*) toca apenas paths não-cobertos pelos filtros de
`freshness`/`validate` (`src/**` + edits em `src/components/**`,
`src/app/api/**`). Mesma necessidade de âncora; mesmo fix.

## 1.1.1 — 2026-05-19

Anchor entry. PR #31 (Sub-etapa 3.2 — data cleanup MLM/Commission/D2D) confirma
mais uma vez o padrão "freshness/validate são checks path-filter" (aprendizado #4
da v1.1): um PR que só toca `.agents/runbooks/**` fica com os 2 Required checks
em "Expected — Waiting for status to be reported" indefinidamente. Fix
canônico mantém-se: tocar arquivo em `.agents/skills/**` (ou
`docs/handbook/**`, `schemas/**`) no mesmo PR. Esta entrada serve como a
âncora do PR #31.

## 1.1 — 2026-05-15

Enriquecimento pós-Fase 0 com 6 aprendizados operacionais descobertos empiricamente durante as Sub-etapas 0.3d.2 → 0.4.4.

Aprendizados adicionados (seção `## Aprendizados operacionais pós-PR #16` no `SKILL.md`):

1. Patch-equivalence pre-flight em reconciliação main↔origin (origem: Sub-etapa 0.2).
2. Patch-id check é necessário mas não suficiente — adicionar supersede detection (origem: Sub-etapa 0.5).
3. `git checkout --ours <file>` é destrutivo em arquivos multi-região (origem: Sub-etapa 0.4.3).
4. Branch protection: `freshness`/`validate` são checks path-filter, não órfãos (origem: Sub-etapa 0.4.4).
5. Backups específicos por sub-etapa de alto risco (com distinção entre `archive/*` e `pre-*-merge`).
6. Batches únicos > while-read loops em operações git.

Mergeado via PR [#18](https://github.com/nickmoreira23/herd/pull/18) na sub-etapa 0.6 do Plano Fase 0.

## 1.0 — 2026-05-14

Versão inicial. Codifica o protocolo de 3 fases (Discovery → Decisão → Execução) refinado através das Sub-etapas 0.3a → 0.3d.2 do Plano Fase 0 do Plano Central HERD.

Cobertura:
- 47 branches deletadas durante a Fase 0 (de 53 → 6 iniciais antes da 0.4).
- 48 tags archive criadas (todas pushadas pra origin).
- Zero perda de trabalho — todas as branches recuperáveis via tags.

Conteúdo inicial:
- Princípios (6): tags archive obrigatórios, discovery exaustiva, critério rígido, pause-and-report, patches já em main via squash, comparação local vs origin.
- Procedimento canônico (Fase A/B/C).
- Pitfalls observados (5): while-read em subshells, Prisma client dessincronizado, branch protection em main, path-filter deadlock, gh pr create --head explícito.

Mergeado via PR [#16](https://github.com/nickmoreira23/herd/pull/16) na sub-etapa 0.3d.2.
