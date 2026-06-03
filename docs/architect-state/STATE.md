# Architect State — ComeçaAI Fase 4

> **Propósito:** Este arquivo é o estado canônico cross-session do trabalho de chat-architect em curso. Atualizado ao final de cada sub-etapa Fase 4. Qualquer nova sessão Claude.ai (chat-architect) deve ler este arquivo PRIMEIRO antes de propor qualquer trabalho.
>
> **Versão:** v1.12 (atualizado 2026-06-02, auto-migrate: CORREÇÃO — a FORMA do comando é o defeito. O inline `cd … && binstub` do #129 FALHOU no pre-deploy (deploy `51511ea9`, logs vazios, DB up-to-date); o wrapper `sh /app/migrate-tools/predeploy.sh` FUNCIONA (`c0448bbd`/`f2cf037f`). Railway não trata inline `cd X && Y` como shell. Fix: predeploy.sh lean (`cd` + `exec binstub`). Explica o #122 retroativamente. Regra: preDeployCommand invoca binário real, nunca operador de shell inline. PROD intacto (fail-safe). Gate verde 2 arches incl. abort)
>
> **Próxima atualização esperada:** pós-merge da Fatia 1 (Locations piloto) do ADR-002.

---

## 🛑 Incidente de PROD (2026-06-01) — RESOLVIDO, com pendências de segurança

**Sintoma:** PROD (`herd-production.up.railway.app`) com **500 universal** (`/admin`, `/api/*`).

**Causa-raiz: schema drift.** `railway.json` predeploy era só `npx prisma generate` (gera o
client, **nunca** `migrate deploy`) → 8 migrations (Sub-18 → 26.2) acumularam **sem aplicar**
no banco de PROD. Quando o client passou a esperar `organizations.status`, a
`organization.findUnique` que o `proxy.ts` roda **em toda request** estourou **P2022**
(`column organizations.status does not exist`). Como o proxy rodava a query **antes do auth
gate e sem try/catch**, o erro virava **500 universal**.

**Achado de segurança que o incidente expôs:** o `proxy.ts` só gateava `/admin` + `/orgs` —
**toda a superfície `/api/*` (~330 handlers) estava sem gate de auth** e os handlers não têm
auth própria → leitura/mutação **anônima** de PII, contatos, transcrições, e proxy de
integrações (gorgias/gmail/recharge) sem login. **Classe pior que o #95** (superfície inteira,
não 1 rota). O 500 do drift **mascarava** isso. PROD **não tinha cliente real** (Bucked Up
ausente) → expunha PII interna/de-teste, não de cliente.

**Resolução — Opção B (ordem segura, sem janela de exposição):**
1. **#111** — gate `/api/*` (default-deny + allowlist) + `try/catch` no `resolveOrgByHost`.
   Subiu **antes** de destravar o DB → fechou o anônimo independente do schema. `/api/* → 401`.
2. **Backup** — `pg_dump -Fc` de PROD (1.9 MB, custom).
3. **8 migrations** aplicadas via `railway run -- npx prisma migrate deploy` (0 pendentes;
   dashboard logado renderiza; gate intacto).
4. **#112** — `predeploy` passa a `prisma generate && prisma migrate deploy`. **⚠️ TENTATIVA
   QUE NÃO FUNCIONA — ver correção abaixo.**

**🛑 CORREÇÃO (2026-06-01, pós-Fatia 1a): o #112 NÃO previne drift — é incompatível com o runtime.**
O predeploy roda no **runner/standalone image**, que o Dockerfile multi-stage monta copiando
**só** `.next/standalone` + `.next/static` + `public`. Esse image **não tem** o CLI `prisma`,
nem `prisma/schema.prisma`/`prisma.config.ts`, nem `prisma/migrations/`. Então
`npx prisma … migrate deploy` **falha** (sem schema/migrations/CLI) e **o deploy promove mesmo
assim** — o "fail-safe" do #112 também **não vale** (Railway predeploy é best-effort, não aborta).
Comprovado na estreia: o merge da Fatia 1a (#115) promoveu **sem aplicar** a migration → PROD
ficou com drift parcial; tive de aplicar manual via `railway run`. **O #112 está documentado
errado como "resolvido" — está QUEBRADO.**

**⚠️ AVISO OPERACIONAL — auto-migrate via `preDeployCommand` FUNCIONA: caminho feliz (no-op)
provado em PROD no deploy `c0448bbd` (2026-06-02).** O pre-deploy rodou, conectou ao DB
(`Datasource ... pooler.supabase.com:5432`), `migrate deploy` → `No pending migrations`, `done=0`,
deploy promovido. **PENDENTE de exercitar em PROD:** (i) aplicação automática de uma migration
**NOVA** e (ii) **abort** numa migration que falha. Até exercitar ambos, conferir `railway run --
npx prisma migrate status` (`up to date`) após a próxima migration real — e, se quiser cinto e
suspensório, aplicar manual antes do merge nessa primeira migration nova. Causa do #122/#125:
**build travado / infra transiente do Railway** (NÃO o comando — 4 hipóteses de comando
falsificadas no gate; o deploy instrumentado provou a fase pre-deploy end-to-end).

**Lição cravada:** o proxy roda uma query de DB **antes do auth gate** — qualquer falha de DB
(drift, blip) derruba a superfície inteira. O `try/catch` (#111) degrada pra `org=null` em vez
de 500. E a prevenção de drift via predeploy **ainda não existe de fato** (ver tech-debt
[ALTA-OPERACIONAL] na seção 5).

---

## 1. Identidade da plataforma

- **Nome:** ComeçaAI (rebrand de HERD em Sub-etapa 18).
- **Repo:** `github.com/nickmoreira23/herd`.
- **Path local:** `/Users/nickmoreira/Desktop/Projects/HERD/`.
- **Stack:** Next.js 16 (Turbopack, App Router, Cache Components), Prisma 7, NextAuth v5, Tailwind, Supabase Postgres + RLS.
- **Hospedagem:** Railway (PROD) + local DEV.
- **Owner platform super_admin:** `nick@comecaai.com.br`.
- **Domain:** `comecaai.com.br` (GoDaddy → planejado Cloudflare cutover Sub-etapa 28.5).

---

## 2. Sub-etapas Fase 4 — status canônico

| # | Sub-etapa | Status | Merge hash | Archive tag |
|---|---|---|---|---|
| 1 | 18 — Rename + Foundation | ✅ | — | archive/sub-etapa-18-* |
| 2 | 18.1 — Rename batch | ✅ | — | archive/sub-etapa-18-1-* |
| 3 | 19 — Tenant scope (Dept/Loc) | ✅ | — | archive/sub-etapa-19-* |
| 4 | 20 — Membership + Roles | ✅ | — | archive/sub-etapa-20-* |
| 5 | 20.1 — Drop Organization.ownerId | ✅ | — | archive/sub-etapa-20-1-* |
| 6 | 21 — Permissions + RBAC | ✅ | — | archive/sub-etapa-21-* |
| 7 | 22 V2 — Domain routing foundation | ✅ | a19d2e9 | archive/sub-etapa-22-v2-* |
| 8 | 23 — Bucked Up DEV + host-based tenant | ✅ | 8ab3a17 | archive/sub-etapa-23-* |
| 9 | 22.1 — Cookie domain + apex redirect | ✅ | — | archive/sub-etapa-22-1-* |
| 10 | 22.1.1 — lvh.me hotfix | ✅ | — | archive/sub-etapa-22-1-1-* |
| 11 | 22.1.2 — Login server action | ✅ | — | archive/sub-etapa-22-1-2-* |
| 12 | 22.1.3 — Cloudflare cleanup (Opção A) | ✅ | — | archive/sub-etapa-22-1-3-* |
| 13 | 22.2 — Org selector + login branding + switch-org | ✅ | f5d2b6e | archive/sub-etapa-22-2-org-selector-f5d2b6e |
| 14 | **24 — Invitation flow + EmailProvider mock** | ✅ | `9149412` (PRs #77→#85) | — |
| 15 | **25 — Audit log** | ✅ | `fdc7a75` (PR #88) | — |
| 16 | 26 — Sub-org hierarchy (Escopo C) — **COMPLETA** (26.1 `ebc6344` · 26.2 `3c036cc` · 26.3 `1c2472b` · 26.4a `eed8eb0` · 26.4b `29666b2`) | ✅ | `29666b2` (#103) | `post-sub-26-{1,2,3,4a,4b}` |
| 17 | 27 — UI consolidation | ⏭️ pending | — | — |
| 18 | 28 — Smoke harness DEV | ⏭️ pending | — | — |
| 19 | 28.5 — Domain cutover + Resend + Bucked Up PROD | ⏭️ pending | — | — |

**Progresso:** 16/17 cravadas (94%).

---

## 3. Pendência ativa

### Sub-etapa 25 (Audit log) — ✅ MERGED (2026-05-29)

Entregue em PR #88 (single squash, merge `fdc7a75`), branch `feat/sub-25-audit-log`.
Estrutura: 1 commit base (schema + migration + helper) + 2 commits de instrumentação.

**Cravado:**
- `model AuditLog` tenant-scoped estrito (molde `BillingEvent`): `tenant_id NOT NULL`
  (FK Organization CASCADE), `actor_profile_id` nullable (FK NetworkProfile SET NULL),
  `resource_id String` genérico, `metadata Json`, 5 índices. Registrado em
  `TENANT_SCOPED_MODELS`.
- **RLS estrita (lição #82):** policy única `audit_logs_tenant_isolation`, SEM
  `herd_app_full_access` permissivo. `WITH CHECK` explícito (superset seguro da
  referência BillingEvent, que confia no `USING` dobrando como write-check) por ser
  tabela write-heavy. Verificada ao vivo no DB DEV antes de marcar applied.
- Migration aplicada cirurgicamente via `DIRECT_URL` (drift DEV pré-existente
  confirmado benigno, NÃO mascarado/resetado) + `migrate resolve --applied`.
- Helper `writeAuditLog` (`src/lib/audit/write-audit-log.ts`): abre o próprio
  `withTenant` (re-entrante), best-effort try/catch — falha de auditoria nunca
  derruba a ação de negócio.
- **6 pontos instrumentados**, todos passando o MESMO tenant do `withTenant`
  envolvente (invariante de correção): invitations (`created`/`accepted` ×2 paths/
  `revoked` na rota fora da transação), departments (`created`/`updated`/`deleted`/
  `member_changed`), locations (`created`/`updated`/`deleted`). Ator = profile que
  EXECUTOU a ação (no accept, a pessoa convidada).

**Finding cravado:** `org-chart/internal` (e `external`) são GET-only — read-only.
O chart é derivado de departments; suas mutações estruturais (reparent, head,
membership) já são auditadas via rotas de department. Nenhum ponto de mutação novo
foi inventado (regra da spec).

**Gate manual recomendado pós-merge:** smoke DEV — exercer uma mutação
(invite/dept/location) e confirmar via SQL que uma linha aterrissa em `audit_logs`
sob o tenant correto. Backend confirmado via gates (typecheck + build + lint + 481
testes em cada commit) e RLS verificada ao vivo; falta só a confirmação end-to-end
de que uma ação real grava a linha.

### Sub-etapa 26 (Sub-org hierarchy, Escopo C) — ✅ COMPLETA (Escopo C ponta a ponta)

Discovery dupla concluída (read-only). Decisões cravadas em
**`docs/architect-state/adr/ADR-001-organization-hierarchy.md`** (Accepted).
Escopo C: org-pai vê **e opera** dados dos descendentes transitivamente,
preservando isolamento horizontal (irmãs nunca se veem; filho não vê pai).
Implementação faseada — estado por fatia:

- **26.1 — árvore estrutural ✅ MERGED** (PR #93, merge `ebc6344`, tag
  `post-sub-26-1`). Migration `parent_org_id` → `onDelete: Cascade` + CHECK
  self-ref (aplicada DEV, `confdeltype='c'` verificado); helpers
  `getDescendants`/`getAncestors`/`assertNoCycle` (`WITH RECURSIVE`, PG 17.6,
  `src/lib/org-hierarchy/`); `create-org --parent`; rotas `GET /api/org/hierarchy`
  + `PATCH /api/org/hierarchy/reparent` (anti-ciclo antes de gravar); fluxo de
  dissolução 2-passos (ADR-001 D6, porta única: dissolve→ARCHIVED reversível /
  DELETE com 3 guardas OWNER+ARCHIVED+confirmName / restore). Backend only (sem
  UI). **Zero toque em RLS/Extension** (organizations não é tenant-scoped).
  29 unit tests. **Validada nos dois eixos via smoke real DEV (descartável):**
  (a) árvore + anti-ciclo (getDescendants/getAncestors + os 4 casos de ciclo);
  (b) dissolução destrutiva — dissolve preserva `parentOrgId`, restore intacto,
  3 guardas barram (409/400), hard-delete dispara CASCADE recursivo apagando o
  subtree, e dados reais (ComeçaAI/Bucked Up/profile Nick) sobrevivem.
- **26.2 — leitura vertical (coração #82) ✅ MERGED** (PR #96, merge `3c036cc`,
  tag `post-sub-26-2`). Mecanismo 3.1 (decidido por benchmark): GUC array
  `current_app_tenant_ids()` + filtro `= ANY` no caminho de leitura da Extension;
  `current_app_tenant_id()` exato preservado (write anchor). **Molde de 2 policies**
  por tabela (`_tenant_isolation` FOR ALL exato USING+WITH CHECK / `_vertical_read`
  FOR SELECT `= ANY`) nas 18 tabelas tenant-scoped — DELETE/UPDATE ficam exatos
  (vertical write é 26.3). 15 Classe A ganharam `WITH CHECK` exato explícito;
  **dept/loc perderam `herd_app_full_access`** (gap #82 fechado DB-level, habilitado
  pelo fix #95). **Validada nas 3 frentes:** 19/19 canários integration (#2/#4/
  via-Extension vertical GREEN; #1/#3/#5/#6/#7 + breach ISL/IWE + #95 dept-loc-leak
  seguem GREEN) + via-Extension (ORM) + smoke real end-to-end (matriz vê filial,
  rival não vê filial, filial não vê matriz). ADR-001 D2/D3/D4.
- **26.3 — escrita vertical + audit ✅ MERGED** (PR #98, merge `1c2472b`, tag
  `post-sub-26-3`). Inversão de risco vs 26.2: a RLS **não** protege a escrita
  vertical (a re-entrada seta a GUC do filho, o `WITH CHECK` exato aprova) → a
  autorização app-layer é a fronteira INTEIRA. **Portão único `withVerticalTenant`**
  (`src/lib/org-hierarchy/`): `assertCanOperateOnTenant` (ancestralidade FRESCA via
  `getDescendants`, sem cache; self → throw) **e então** `withTenant(childId)`.
  Nunca `withTenant(<request id>)` cru. Autorização = `requireOrgRole(["OWNER",
  "ADMIN"])` (role no pai) **E** ancestralidade — sem membership no filho.
  Audit cross-tier: `tenantId=filho`, `actorProfileId=pai`, `metadata.via_parent_org`
  (sem schema change). Surface V1: `POST`+`DELETE /api/org/[id]/departments`.
  **Zero toque em policy/RLS/migration** (o molde exato da 26.2 é o que faz a
  re-entrada gravar certo). Lint rule `TENANT_WRAPPERS` += `withVerticalTenant`
  (continua check estrutural, não de authz). **Validada nas 3 frentes:** unit
  (gate) + integration 4/4 (incl. canário #7: a RLS não barra a escrita vertical
  — o guard é app-layer) + smoke real (pai opera filho create+delete; irmã/
  ascendente/self barrados; audit cross-tier). ADR-001 D4/D5.
- **26.4a — UI: árvore + contexto de filho ✅ MERGED** (PR #101, merge `eed8eb0`,
  tag `post-sub-26-4a`). Frontend puro, consome 26.1/26.2/26.3, zero toque em
  RLS. `org-tree` navegável (`GET /api/org/hierarchy`); banner de contexto loud
  persistente (token, in-host via `?ctx=<childId>`); escrita vertical reusando
  `DepartmentForm` (prop aditiva `verticalContext` → `POST /api/org/[childId]/
  departments`, título nomeia o filho); delete via `confirm()`; 403 tratado.
  **Fix de hidratação cravado:** `useSearchParams` no render body sob
  `cacheComponents` matava o client → `<Suspense>` boundary no `page.tsx` +
  guard `params?.get`. **+ Porta "Organization" no sidebar** (`nav-config.ts`,
  faltava entrada top-level — sub-painel era inacessível) **+ seção STRUCTURE**
  no `subPanelRegistry.organization` (Hierarchy/Departments/Members/Org Chart/
  Network Map — linka 5 órfãos). i18n pt-BR+en-US. Validada em dev fresco
  (hidrata + interativa; o "(stale)" era miragem — P6). ADR-001 D7.
  **Tech-debt descoberta/registrada** (Tier 1): Org Chart/Network Map crasham
  (Fase 3, refs stale) [ALTA]; warning pg em departments (#95) [MÉDIA].
- **26.4b — dashboard consolidado ✅ MERGED** (PR #103, merge `29666b2`, tag
  `post-sub-26-4b`). Server-page-direct (sem endpoint): agregação inline via
  `groupBy` sob leitura vertical (26.2) + `getDescendants` (26.1). **Linhas da
  lista completa, números com default-0** (org vazia não some); dept/loc
  SEQUENCIAL dentro de `withTenant` (não `Promise.all` → evita o warning pg do
  #95). Cards de totais + tabela por-org indentada por `depth`. Métricas V1:
  departments/locations/members (billing/audit deferidos). Link "Dashboard"
  primeiro na STRUCTURE. Read-only, zero RLS/escrita/migration. ADR-001 D7.

**✅ Sub-26 (Escopo C) COMPLETA ponta a ponta** — 26.1 (árvore) + 26.2 (leitura
vertical, coração #82) + 26.3 (escrita vertical + audit) + 26.4a (UI: navegação
+ contexto + porta Organization + STRUCTURE) + 26.4b (dashboard consolidado).
A matriz **vê e opera** descendentes transitivamente, isolamento horizontal
preservado, UI completa. Progresso **16/17 (94%)**.

**Faxina de tech-debt Tier 1 — concluída (2026-06-01).** Org Chart/Network Map
crash NEUTRALIZADO (#105); warning pg intra-handler RESOLVIDO (#106); item
"middleware" FECHADO como misdiagnosed; nav top-level i18n (#107) e i18n do bloco
locations (#109) RESOLVIDOS. Detalhes no close-out da seção 5 (tech debt).

### Próxima etapa: "Proveniência + consumo curado" — ⏭️ ADR aceito, implementação faseada 1→4 pendente (ANTES da Sub-27)

**Discovery concluída + ADR cravado:** **`docs/architect-state/adr/ADR-002-block-ssot-curated-consumption.md`** (Accepted).

Padrão: o **bloco** é catálogo-mestre/SSOT (modelo Prisma É a fonte; **não há tabela `Block`**);
superfícies (**Organization**, **KB**, futuras) consomem **subconjunto curado** via **tabela de
junção** (molde `*TierAssignment` — precedente real; anti-precedente `AgentKnowledgeItem` = cópia),
com **proveniência** via enum `RecordSource` **por modelo** (não tabela central). Ver ADR-002 D1–D6.

**Fatias (sequência 1→4, cada uma discovery→spec→smoke):**
- **Fatia 1** — Locations piloto (junção `OrganizationLocation` + `RecordSource` + backfill + UI vincular/criar). Risco baixo.
- **Fatia 2** — Proveniência transversal (`RecordSource` nos demais blocos + consolidar campos ad-hoc + syncs).
- **Fatia 3** — **KB tenancy** (gate de segurança pré-go-live do KB). **⚠️ perdeu o componente `auth`** — já coberto pela **Camada 1 (#111)**; **resta só tenancy** (`tenantId` + `TENANT_SCOPED_MODELS` + RLS + backfill). Pré-requisito da Fatia 4.
- **Fatia 4** — Knowledge consumo curado (espelha Locations, após tenancy).

A rota `/profile/locations` + o `LocationsForm` ficam **intocados** até a Fatia 1 cravar o consumo curado (Organization **consome** o bloco).

### Sub-etapa 27 (UI consolidation) — ⏭️ pending (depois da etapa de proveniência)

Aguardando discovery antecipada antes da spec (regra cravada da skill).

---

## 4. Decisões arquiteturais cravadas (canon)

### Tenancy & routing

- **Host = source of truth pra tenant resolution.** `x-org-id` header injetado por `src/proxy.ts`.
- **`proxy.ts` em Node runtime.** Edge não suporta Prisma. Cloudflare migration foi rejeitada via Opção A.
- **Cookie domain `.lvh.me` em DEV.** Chrome PSL bloqueia `.localhost`.
- **`OrganizationInvitation` NÃO está em `TENANT_SCOPED_MODELS`.** Routes filtram `organizationId` manualmente.

### Auth & sessions

- **Login via server action** (`loginAction` em `src/app/(auth)/login/actions.ts`).
- **NextAuth v5 `trustHost: true`** + secret fallback `NEXTAUTH_SECRET ?? AUTH_SECRET`.
- **Switch-org: redirect subdomain, não JWT update.** POST `/api/auth/switch-org`.
- **JWT `activeOrgId` mantém fallback.** Refactor completo planejado Sub-etapa 28.5.

### Invitation flow (Sub-etapa 24)

- **Design A:** invitation tabela separada, membership criada só no accept.
- **EmailProvider mock V1.** `console.log` + `mockSentEmails[]` in-memory. Resend = Sub-etapa 28.5.
- **Dedup application code** (zero migration).
- **Senha mínima 8 chars.** bcrypt hash.
- **Expiração 7 dias.** Revoke via `expiresAt = now()`.
- **`InvitationStatus.REVOKED` não existe** (e não vai existir nesta sub-etapa).
- **POST `/api/users` removido.** `user-table.tsx` adaptado (dead code, refs limpos).
- **Redirect pós-accept via `AcceptedRedirect` (client) + `buildOrgAdminUrl`.** Server
  action retorna `{redirect}` (happy path), mas o branch terminal `ACCEPTED` em
  `page.tsx` renderiza `<AcceptedRedirect>` que re-emite `window.location.href` no
  mount — neutraliza a race do RSC-revalidation que desmontava o form. URL
  cross-subdomain de fonte única em `src/lib/tenant/org-url.ts` (action + page).
  `redirect()` server-side NÃO usado (não cruza subdomínio sob Turbopack — N2/N3).

### Audit log (Sub-etapa 25)

- **`AuditLog` molde `BillingEvent` estrito.** Tenant-scoped, RLS policy única
  (sem `herd_app_full_access`). `WITH CHECK` explícito.
- **`actorProfileId` nullable + `onDelete: SetNull`.** Ator deletado anonimiza, não
  apaga a trilha.
- **`resourceId String` genérico.** Sem FK tipada — qualquer recurso referenciável.
- **Helper abre o próprio `withTenant`** (re-entrante) e é **best-effort** (try/catch
  log-and-swallow). Auditoria NUNCA derruba a ação de negócio.
- **Ator = profile que EXECUTOU a ação.** No accept de convite, a pessoa convidada.
- **Auditoria gravada DEPOIS do commit da ação** (no accept, FORA do `$transaction`;
  no revoke, na rota fora da transação do service).
- **Invariante de tenant:** todo ponto passa a mesma expressão de tenant do
  `withTenant` envolvente (`session.user.activeOrgId` / `organizationId`).
- **V1 = cobertura sobre completude.** 6 pontos (invitations/departments/locations).
  Role + settings FORA. Read ops não logadas. UI de browse não existe (tech debt).
- **action strings `{recurso}.{verbo}` lowercase.** metadata mínimo-útil, NUNCA
  sensível (sem senha/hash/token completo).

### Schema crítico

- `Organization`: 17 cols, sem `ownerId` (drop 20.1), `subdomain UNIQUE`, `customDomain UNIQUE nullable`.
- `OrganizationMember`: relation name `organizationMemberships`.
- `MemberRole` enum: OWNER, ADMIN, MEMBER, DEPARTMENT_HEAD, DEPARTMENT_MANAGER, DEPARTMENT_MEMBER.
- `MembershipStatus`: ACTIVE, SUSPENDED, INVITED (NÃO USADO), REMOVED.
- `InvitationStatus`: PENDING, ACCEPTED, DECLINED, EXPIRED (sem REVOKED).
- `NetworkProfile.isSuperAdmin Boolean`. Nick = true.
- `AuditLog`: tenant-scoped estrito. `tenant_id`, `actor_profile_id` (nullable),
  `action`, `resource_type`, `resource_id`, `metadata Json`, `created_at`. 5 índices.

### Process discipline

- Squash merge pattern.
- Backup tags `pre-<sub-etapa>-*` antes de mutations.
- Worktrees `.claude/worktrees/<name>/` per sub-etapa.
- Discovery antecipada mandatory antes de cada spec.
- DEV smoke → PR Draft → merge → archive tag → cleanup.
- `npm run build` mandatory pra route handlers / next.config.
- Status reports só no fim da sub-etapa completa.

---

## 5. Tech debt rastreado

### Tier 1 (resolve durante Fase 4)

- **[ALTA-OPERACIONAL] Reprojetar o auto-migrate — design isolado implementado, gate local verde, PENDENTE deploy de prova.**
  **Causa-raiz do #112 (corrige relatos anteriores):** o `railway.json` usava o campo
  **inválido `predeploy`** (o canônico do Railway é **`preDeployCommand`**) → o comando
  **nunca rodou** (confirmado pelos logs do #115 — sem fase pre-deploy alguma). O
  "runner sem toolchain" era barreira **secundária, nunca atingida** (o comando nem chegou a
  executar).
  **Enquanto aberto: aplicar TODA migration manual em PROD via
  `railway run -- npx prisma migrate deploy` após o merge + checar `migrate status`.** (Aviso
  reforçado — duas tentativas de automatizar falharam.)

  **Tentativa 1 — #118 (REVERTIDA):** corrigiu o campo → `preDeployCommand` + 6 COPYs do
  toolchain **dentro de `/app/node_modules`**. **Crash de boot em PROD** (`Starting/Stopping
  Container` loop → `bd0a2306` FAILED); fail-safe segurou (PROD 200 o tempo todo); revertida via
  #119 (`c87b9be`). **Causa real INDETERMINADA estaticamente** — a hipótese inicial ("COPYs de
  `@prisma/*` por cima do standalone corromperam o runtime") **NÃO se confirmou**: a discovery
  mostrou que o standalone só traça `@prisma/{client,client-runtime-utils}` + `adapter-pg` +
  `.prisma/client`, e **nenhum** dos pacotes copiados (`prisma` CLI, `@prisma/engines`,
  `@prisma/config`, `dotenv`) estava nesse conjunto → não houve colisão de paths óbvia. A causa
  exata exigiria os logs do crash (que o CLI não entregou) — mas **virou irrelevante** sob o
  design isolado abaixo.

  **Tentativa 2 — design ISOLADO (`/app/migrate-tools/`):** o toolchain inteiro vai num diretório
  separado com `node_modules` próprio; **nunca toca `/app/node_modules` nem o standalone** → não
  pode corromper o boot. `preDeployCommand: "cd /app/migrate-tools && node
  node_modules/prisma/build/index.js migrate deploy"` (CLI resolve siblings de
  `/app/migrate-tools/node_modules` via node resolution). **Verificado localmente com docker
  (gate executado) em arm64 E amd64:** (i) `docker build` conclui; (ii) **boot-test** — `node
  server.js` sobe estável, sem crash loop (isolamento confirmado: `/app/node_modules/prisma`
  ausente, CLI só em migrate-tools); (iii) `migrate status` in-image carrega o `prisma.config.ts`,
  roda o schema-engine e conecta no DB (`29 migrations · up to date`). **Slim feito** via um
  **stage `migrate-tools` dedicado** que faz `npm install` isolado da closure do CLI (prisma +
  `@prisma/config` + dotenv, versão pinada) em vez de copiar o `node_modules` inteiro — o CLI do
  Prisma 7 carrega eager `@prisma/dev`/`studio-core` (pglite/hono/effect/c12), então hand-pick por
  COPY não convergia; o `npm install` computa a closure correta. **Resultado: `/app/migrate-tools`
  1.7G → 228M; imagem 4.45GB → 2.53GB (amd64), gate verde nos 2 arches.**

  **Tentativa em PROD (#122) — FALHOU; revertida (#123).** O #122 mergeou por engano a versão
  **whole-copy** (o slim `ab11bbe` se perdeu num reset do tree principal compartilhado) e seu deploy
  **FALHOU em PROD** na fase pre-deploy — o **`preDeployCommand` APAREU** (ao contrário do #115:
  campo certo funciona), o fail-safe **abortou**, PROD seguiu intacto no deploy anterior. **Revertido
  via #123 (`0cbbbd9`)** → main deployável. **Causa exata da falha NÃO determinada** (deploy logs do
  `d47c70ca` só no dashboard; CLI não entrega). ⚠️ **Hipótese "invocação `node build/index.js` pula o
  config-load" FALSIFICADA** no gate: as DUAS invocações (`node build/index.js` E o binstub
  `.bin/prisma`) carregam o `prisma.config.ts` + conectam + rodam `migrate deploy` (`No pending`) em
  container fresco, nos 2 arches. **A causa real do #122 segue desconhecida.**

  **Re-fix (`fix/auto-migrate-refix`, worktree ISOLADA):** parte do slim `ab11bbe` (recuperado;
  whole-copy descartado), troca a invocação pro binstub `cd /app/migrate-tools && ./node_modules/.bin/prisma
  migrate deploy` (boa prática, roda o entry point completo — embora o gate mostre que a invocação
  antiga também carregava o config). Gate reforçado verde nos 2 arches: build + boot-test estável +
  **`migrate deploy`** (não só status) carregando config + conectando. Imagem ~2.53GB (slim), isolamento
  intacto. **Lição de processo:** sessão isolada em worktree própria (a contenção do #122 veio de
  operar no tree principal compartilhado).

  **Status:** re-fix pronto, gate local verde nos 2 arches. **Pendente: (1) os Deploy Logs de
  `d47c70ca` (dashboard) pra cravar por que o #122 falhou — o re-fix endereça uma NÃO-causa
  (invocação), então o motivo real do #122 ainda é incógnito; (2) deploy de prova em PROD, só com OK
  do Nick.** **O aviso "manual" acima permanece** até o deploy de prova confirmar a fase pre-deploy
  rodando + aplicando em PROD.

  **Build de prova INSTRUMENTADO (v1.10).** Como o gate local NÃO reproduz a falha de 14s-sem-output
  do #122 (path/binário/env-ausente todos descartados — env-ausente falha loud em 1s, não 14s) e os
  Deploy Logs do `d47c70ca` no dashboard vieram vazios ("No logs in this time range" = artefato do
  filtro de janela), o caminho de medição é um **deploy instrumentado**. O `preDeployCommand` virou
  `sh /app/migrate-tools/predeploy.sh` (script versionado em `migrate-tools/predeploy.sh`, COPY +
  `chmod +x` no stage `migrate-tools`). O script cospe marcos **com timestamp** (`date -Iseconds`):
  `start → cd ok → DIRECT_URL set:yes → tcp ok/FAIL/TIMEOUT → migrate deploy → done=N`, com **`exit
  $rc`** propagando o resultado do migrate (preserva o abort-on-failure — falha = PROD intacto). Marco
  decisivo: se morrer no `tcp TIMEOUT` (~10s) → **egress de rede do container de pre-deploy bloqueado**
  (casa com os 14s do #122); se passar o TCP e morrer no migrate → erro do prisma fica no log.
  Captura de stdout **confirmada empiricamente**: `railway logs -d <deployment_id> --lines 300` puxa
  deploy logs históricos (independe do filtro do dashboard). Gate local verde nos 2 arches (build +
  boot-test + predeploy.sh in-image: COM env → marcos + `done=0`/exit 0; SEM env → marcos + guard +
  `done=1`/exit 1). **Pendente: OK explícito do Nick pro merge + deploy de prova; ler os marcos via CLI.**

  **RESOLVIDO — deploy de prova SUCEDEU + instrumentação limpa (v1.11).** O #126 (instrumentado)
  mergeou e deployou: deployment `c0448bbd` (2026-06-02 17:41 -03) buildou em ~4min (sem travar),
  o `preDeployCommand` rodou, `Loaded Prisma config` → `30 migrations found` → `Datasource ... :5432`
  (conectou — **egress NÃO bloqueado**, hipótese de rede falsificada) → `No pending migrations` →
  `[PREDEPLOY] done=0` → deploy promovido a SUCCESS/ACTIVE, health 200. **Diagnóstico final do
  #122/#125: a falha foi BUILD travado / infra transiente do Railway** (o `6a0d718c`/#125 pendurou
  ~1h15 no build e foi cancelado; o `d47c70ca` FAILED) — **nunca o comando** (4 hipóteses de comando
  falsificadas: runner-sem-toolchain, invocação binstub-vs-index, env-ausente, DIRECT_URL-whitespace).
  Após a prova, a instrumentação foi removida e o `preDeployCommand` voltou ao enxuto inline
  `cd /app/migrate-tools && ./node_modules/.bin/prisma migrate deploy` (o `migrate deploy` retorna
  exit code → abort-on-failure de graça). `predeploy.sh` + COPY/chmod removidos. Gate limpo verde
  nos 2 arches (inclui cenário de abort: env ruim → exit ≠ 0). **Item rebaixado de [ALTA-OPERACIONAL]
  — caminho feliz provado; resta exercitar migration-nova + abort reais em PROD (ver aviso operacional).**

  **CORREÇÃO (v1.12) — a FORMA do comando É o defeito; o #129 concluiu errado.** O #129 trocou
  o `preDeployCommand` pelo **inline** `cd /app/migrate-tools && ./node_modules/.bin/prisma migrate
  deploy` achando-o "são". O deploy de confirmação `51511ea9` (2026-06-02 18:50) **FALHOU no
  pre-deploy com logs VAZIOS** — DB `up to date`, build completo (imagem pushed), migrate seria
  no-op → o **único** que falhou foi a execução do comando. Placar controlado (mesma migrate, mesmo
  DB, mesmo build; única variável = forma): **`sh /app/migrate-tools/predeploy.sh` (script) →
  SUCCESS + logs** (`c0448bbd`, `f2cf037f`); **inline `cd … && binstub` → FAILED + logs vazios**
  (`51511ea9`, e retroativamente `d47c70ca`/#122). **Conclusão: o executor de `preDeployCommand`
  do Railway NÃO trata o inline `cd X && Y` como shell** (provável: passa a string como argv único →
  "binário" inexistente → falha sem output). O `sh script.sh` funciona porque `sh` é um binário real.
  **Isto explica o #122 retroativamente** — as 4 "hipóteses de comando falsificadas" no #126 foram
  testadas num **shell local** (que interpreta `cd`/`&&`), não no executor do Railway; o defeito real
  é a forma inline. Fix (este PR): voltar ao wrapper `sh /app/migrate-tools/predeploy.sh` com um
  `predeploy.sh` **lean** (`cd` + `exec ./node_modules/.bin/prisma migrate deploy` — `exec` propaga o
  exit code → abort preservado). **Regra cravada: o `preDeployCommand` do Railway DEVE invocar um
  binário real (`sh script.sh`), nunca operadores de shell inline.** Gate verde nos 2 arches (build +
  boot + isolamento + COM env no-op exit 0 + env ruim → exit ≠ 0). **PROD intacto** durante o erro —
  `51511ea9` FAILED não promoveu, fail-safe manteve `f2cf037f`.
- **[ALTA-SEGURANÇA] Camada 2 de auth `/api`.** O gate do #111 é **presence-based**
  (`isLoggedIn = !!cookie`) — **NÃO valida o JWT** → um cookie forjado passa. Falta:
  (a) validar o JWT no proxy, **e** (b) **scoping por-tenant nos handlers** (cross-tenant
  entre usuários logados continua aberto — os ~330 handlers `/api` não filtram por tenant).
  Trabalho por-rota/modelo. O #111 (camada 1) fechou só o **anônimo**.
- **[MÉDIA-SEGURANÇA] KB tenancy.** `KnowledgeDocument`/`KnowledgeFolder`/etc. **sem
  `tenantId`, sem auth, `/api` público**; não estão em `TENANT_SCOPED_MODELS`; folders são
  globais. **Vazio hoje (latente)** — vira gate de segurança **antes do go-live do KB**.
  Pré-requisito da fatia de Knowledge da etapa de consumo curado (KB é flat **E** global).
- **[FEATURE] Proveniência + consumo curado** (ver "Próxima etapa" na seção 3). Bloco = SSOT
  (modelo Prisma É a fonte; **não há tabela `Block`**); superfície (Organization/KB) consome
  subconjunto curado via **junção** (molde `*TierAssignment`) + proveniência via `RecordSource`
  enum **por modelo**. Locations já é bloco (sem migração de dados); KB precisa de tenancy
  primeiro. Precedente: `PerkTierAssignment`/`AgentTierAccess`. Anti-precedente:
  `AgentKnowledgeItem` (cópia, não vínculo). → **ADR-002 + fatias, ANTES da Sub-27**.
- **[BAIXA] Duplicação de UI de Locations** (`profile/locations` form vs `blocks/locations`
  bloco canônico). **NÃO deletar** (descartado) — resolve junto da etapa de consumo curado
  (Organization **consome** o bloco). Rota + form intocados em main.
- `MembershipStatus.INVITED` enum value não-usado (Design A) — Sub-etapa 27 decide drop ou usar.
- `user-table.tsx` dead code — Sub-etapa 27 deleta ou mantém legacy.
- Click-outside dropdown handler sidebar — Sub-etapa 27.
- Default-org persistence — Sub-etapa 27.
- Sidebar dropdown polish — Sub-etapa 27.
- Profile popover sidebar não permite click — Sub-etapa 27.
- Audit log: UI admin para browse/filtrar a trilha — Sub-etapa 27 ou quando produto pedir.
- Audit log: cobertura de role + settings mutations — quando esses pontos existirem.
- ✅ Audit log: smoke end-to-end DEV — VALIDADO (2026-05-29). Write path provado
  (3 rows reais sob tenant ComeçaAI correto: `invitation.created`/`department.created`/
  `location.created`, vistas no Studio) + isolamento cross-tenant provado (BuckedUp
  `count=0` via script read-only usando o `prisma` singleton + `herd_app` NOBYPASSRLS,
  caminho real da app). Lição #82 confirmada ao vivo.
- WITH RECURSIVE de fechamento descendente **duplicado** (Sub-26.2):
  `src/lib/org-hierarchy/tree.ts` (`getDescendants`) + inline em
  `src/lib/tenancy/prisma-extension.ts` (caminho de leitura). Inline na Extension
  evita o ciclo de import prisma→extension→org-hierarchy. Se a lógica de
  fechamento mudar, mudar nos DOIS. Consolidar quando o ciclo de import puder ser
  quebrado (ex.: SQL cru num módulo sem dependência de `prisma`).
### Faxina de tech-debt — close-out (2026-06-01)

- **[ALTA] Org Chart + Network Map crasham (Fase 3, refs stale) → ✅ NEUTRALIZADO
  (#105, `a2b1e87`).** Ambas as telas viraram placeholder "em breve" (`ComingSoon`),
  então o crash **não é mais exposto**. O código da Fase 3 (`OrgChartCanvas` /
  `NetworkMapCanvas`, refs stale a `NetworkProfile.profileRoles`/`parentId` dropados
  na 3.6) foi **preservado no repo** (não deletado) para conserto futuro — derivar a
  árvore de `Department.parentId`/`departmentMemberships`. Reabrir quando o produto
  decidir reviver essas telas.
- **[MÉDIA] Warning pg de concorrência intra-handler → ✅ RESOLVIDO (#106).**
  Os 5 sites de `Promise.all([scoped, …])` sob `withTenant` foram sequenciados
  (`const a = await A; const b = await B;`) — classe intra-handler eliminada por
  construção.
- **[MÉDIA] Warning pg "cross-request no middleware" → ❌ FECHADO (misdiagnosed).**
  A hipótese de que `proxy.ts`/`resolveOrgByHost` era a fonte foi **falsificada**:
  esse caminho faz `Organization.findUnique` **não-scoped** → Extension no-op →
  conexões separadas do pool → 8× concorrente no boot = **0 warnings**. O `(middleware)`
  no stack trace era **rótulo de chunk webpack, não contexto de execução**. O item
  spun-off do #106 está mal-diagnosticado e **não há fix de middleware a fazer**.
  A fonte real é **single-operation**: leitura scoped com `include` sob `withTenant`
  (a Extension envolve em `$transaction`; o interpretador do Prisma 7 carrega as
  relações do `include` como queries irmãs concorrentes na mesma conexão). **Benigno**
  (dados corretos, `pg` pinado em `^8.20.0`, once-per-process). Sem fix app-side; opção
  durável só **upstream** (`@prisma/adapter-pg`). Documentado em `AGENTS.md` (seção
  "pg DeprecationWarning — benign"). Baixa prioridade, não agora.
- **[BAIXA] Top-level do sidebar i18n → ✅ RESOLVIDO (#107).** `labelKey?: MessageKey`
  aditivo + fallback pro `label` literal; 30 labels migrados (26 NavLink + 4 headers).
  6 nomes próprios (Dashboard, Chat, Handbook, Marketplace, Ledger, Roadmap) ficam em
  inglês **deliberadamente**.
- **[BAIXA] i18n dos componentes do bloco locations → ✅ RESOLVIDO (#109).** 4 componentes
  + `types.ts` roteados por `useT()`/`MessageKey`; 19 chaves novas (pt-BR + en-US). Sem
  mudança de comportamento/dados.
- **"Duplicação de Locations" → ⚠️ RECLASSIFICADA (não era dedup).** A investigação
  revelou que o bloco é o **catálogo-mestre/SSOT** e superfícies como Organization (e KB)
  são **subconjuntos curados** com proveniência rastreável — um **padrão de produto a
  implementar**, não uma duplicação a remover. A rota `/admin/organization/profile/locations`
  + o `LocationsForm` seguem **intocados em main** (a deleção/redirect foi descartada).
  Vira a etapa nova "Proveniência + consumo curado" (abaixo), a fazer **antes** da Sub-27.
- **[BAIXA] Chaves i18n órfãs** (defined-but-unused, resíduo da 26.4a e da fatia de
  locations) — faxina de i18n futura, não-bloqueante. `check:i18n` só pega used-but-undefined,
  então não trava CI.
- **Docs close-out (#110)** — registrou a faxina + cravou o diagnóstico correto do warning pg
  (middleware misdiagnosed; fonte real = `include` scoped sob `withTenant`) em `AGENTS.md`.
- **Incidente de PROD (#111/#112)** — ver o callout "🛑 Incidente de PROD" no topo do arquivo.

### Tier 2 (resolve em Sub-etapa 28.5 ou cutover)

- Refactor pra abandonar JWT `activeOrgId` completamente.
- Resend integration real (substitui MockEmailProvider).
- Marketing site `comecaai.com.br` root.
- Cloudflare DNS migration de GoDaddy.
- Railway wildcard `*.comecaai.com.br`.
- Bucked Up CNAME `herd.buckedup.com` (3 DNS records).

### Tier 3 (pós-Fase 4)

- NetworkProfile → User rename + ProfileStatus → UserStatus.
- OAuth providers (Google, GitHub).
- Granular permission table (RolePermission).
- Custom roles per-org.
- Approval flows, GDPR/LGPD compliance.
- SSO/SAML, MFA.
- API keys per-org.
- Drop `NetworkProfile.email @unique`.
- Railway → Vercel migration consideration (Cloudflare descartado).
- Audit log archiving > 1 year.
- Network-map feature decision.
- Edge KV / Redis cache pra org-resolver (V1 in-memory).
- JWT memberRole caching (V1 per-request lookup).
- Auto-update `allowedDevOrigins` via env var.
- Race condition em invitation dedup (sem unique constraint DB).
- `mockSentEmails` não persiste fora do server process.
- CI workflows `paths:` filter removido — trade-off CI minutes elevado (aceitável projeto solo).

---

## 6. DEV environment

### Orgs

- ComeçaAI: subdomain `app`, 7 departments.
- Bucked Up: subdomain `buckedup`, 0 departments.

### Owner

Nick (`nick@comecaai.com.br`), isSuperAdmin=true, owner ambas orgs.

### URLs

- `http://lvh.me:3000` — apex login.
- `http://app.lvh.me:3000` — ComeçaAI.
- `http://buckedup.lvh.me:3000` — Bucked Up.

### ENV críticos

- `COOKIE_DOMAIN=.lvh.me`
- `APEX_HOST=lvh.me`
- `NEXTAUTH_URL=http://lvh.me:3000`
- `NEXTAUTH_SECRET=<secret>`
- `RUNTIME_DATABASE_URL=<Supabase pooler>`

### Smoke pre-flight

```bash
cd /Users/nickmoreira/Desktop/Projects/HERD/.claude/worktrees/<current-sub-etapa>
ls -la .env  # Symlink absoluto pro main
ps aux | grep "next dev" | grep -v grep  # kill se houver
rm -rf .next/
npm run dev
```

---

## 7. Lições cravadas (skill `chat-code-handoff` v0.2.4)

Codificadas em `.agents/skills/chat-code-handoff/SKILL.md`. Resumo:

- **Worktrees (W1-W3):** `npm install` real (sem symlink), `.env` symlink absoluto, `allowedDevOrigins` pra hostnames não-localhost.
- **Next.js 16 (N1-N3):** `signIn redirect: false` pattern; cross-origin nav via `window.location.href` em useEffect; **N3 (Sub-24): server action que retorna `{redirect}` corre risco de RSC-revalidation race desmontar o form — renderizar componente client dedicado pro status terminal.**
- **Smoke (S1-S2):** smoke pega bugs que testes não pegam; DEV antes de Railway.
- **Browser (B1):** Chrome PSL + lvh.me workaround.
- **Process (P1-P4):** allowedDevOrigins preventivo, proxy smoke gate, PopoverTrigger asChild, Auth.js mock typing.

### Lição P5 (Sub-etapa 24)

Pressure verbal de Nick durante execução não substitui pause-and-report pra mudanças arquiteturais. Aconteceu em Sub-etapa 24 com workflow files. Padrão correto: diagnostica → relata → autoriza → executa. Reforçado durante o diagnóstico A1: três SPECs read-only antes de qualquer mutação, pause-and-report obrigatório (Tarefa 0 confirmando `redirect()` cross-subdomain) antes de aplicar a fix.

---

## 8. Pré-cutover Sub-etapa 28.5

Pendências do Nick (não-código):

- Cloudflare account + DNS migration de GoDaddy.
- Resend account + `comecaai.com.br` domain verification.
- Railway wildcard `*.comecaai.com.br`.
- Bucked Up DNS team coordination (CNAME `herd.buckedup.com`).

---

## 9. Onde está cada coisa importante

- **Schema:** `prisma/schema.prisma`.
- **Migrations:** `prisma/migrations/`.
- **Proxy:** `src/proxy.ts`.
- **RBAC:** `src/lib/permissions/require-org-role.ts`, `src/lib/permissions/can.ts`.
- **Auth config:** `src/lib/auth/config.ts`.
- **Tenant resolver:** `src/lib/tenant/org-resolver.ts`.
- **RLS context:** `src/lib/tenancy/context.ts`.
- **Email infra (Sub-etapa 24):** `src/lib/email/`.
- **Invitation service (Sub-etapa 24):** `src/lib/invitations/`.
- **Audit helper (Sub-etapa 25):** `src/lib/audit/write-audit-log.ts`.
- **Audit migration (Sub-etapa 25):** `prisma/migrations/20260529000000_sub_25_audit_log/`.
- **Audit handbook (Sub-etapa 25):** `docs/handbook/tools/infrastructure/audit-log/`.
- **Members UI (Sub-etapa 24):** `src/app/admin/organization/members/`.
- **Accept page (Sub-etapa 24):** `src/app/accept/[token]/`.
- **Skill chat-code-handoff:** `.agents/skills/chat-code-handoff/SKILL.md`.
- **Org admin URL helper (Sub-etapa 24):** `src/lib/tenant/org-url.ts`.
- **Accept redirect component (Sub-etapa 24):** `src/app/accept/[token]/accepted-redirect.tsx`.
- **Architect state (este arquivo):** `docs/architect-state/STATE.md`.

---

## 10. Como atualizar este arquivo

Ao final de cada sub-etapa Fase 4 (pós-merge):

1. Bump versão no topo.
2. Atualiza tabela seção 2 (status, merge hash, archive tag).
3. Move pendência ativa pra próxima sub-etapa (seção 3).
4. Adiciona decisões arquiteturais novas (seção 4) se houverem.
5. Atualiza tech debt (seção 5) — move resolvidos pra "done" inline ou remove.
6. Adiciona lições novas (seção 7) — referencia skill update.
7. Commit em sub-etapa separada OU como último commit da sub-etapa atual.

Comando:

```bash
# Após merge sub-etapa N
git checkout main
git pull origin main
# Edita docs/architect-state/STATE.md
git add docs/architect-state/STATE.md
git commit -m "docs(state): update post-sub-etapa-<N>"
git push origin main
```

---

## 11. Como iniciar nova sessão chat-architect

Primeiro turno na nova sessão Claude.ai:

```
Estou abrindo uma nova sessão. Leia o arquivo docs/architect-state/STATE.md
do repo HERD pra contexto cravamento. Tenha em mãos também HANDOFF.md
da sessão anterior se precisar de mais detalhe operacional.

Estado atual: <descreva 1 linha o que está pendente>.

Próximo passo proposto: <descreva>.
```

A nova sessão deve:
1. Confirmar entendimento em 2-3 sentenças.
2. Validar premissas (sub-etapa pendente, gates, smoke status).
3. Propor ação concreta.

---

## 12. Cravamento

Este arquivo é o estado canônico. Tudo o que diverge dele deve ser confrontado com evidência empírica (commits, gates, smoke). Sem reescrever história sem causa.
