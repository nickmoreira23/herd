# Plano — Fase 3: Network MLM Removal

Histórico canônico de Fase 3. Cada sub-etapa abaixo foi executada via chat-code-handoff protocol com discovery antecipada, worktree dedicado, PR squash-merged em main, e archive tag em origin.

**Janela:** 2026-05-18 → 2026-05-20.
**PRs:** #31 a #39.
**Backup pre-fase:** tag `pre-fase-3-network-mlm-removal` em origin (pre-PR #31 state).

---

## Sub-etapas

### ✅ Sub-etapa 3.1 — Discovery inicial + categorização

Mapeamento exaustivo do que existia antes da fase: 24 tabelas no cluster Network/Commission/D2D/Partner, 6 enums dedicados, ~58 arquivos consumidores em código, 11 routes API + 17 admin pages. Categorização em "preservar / dropar / reescrever".

### ✅ Sub-etapa 3.1.1 — Discovery extra (NetworkProfile shape, RBAC, sample data)

Discovery dedicada para o cluster `NetworkProfile` (shape interno + papéis RBAC + dados existentes em DEV). Confirmou que `NetworkProfile` é o User canonical e que RBAC era zumbi (sem consumer real).

### ✅ Sub-etapa 3.2 — Data cleanup DEV (PR #31)

Limpeza dos dados existentes em DEV antes do destrutivo: ~58 deletes em 5 batches. Backup tag pre-cleanup.

### ✅ Sub-etapa 3.3 — Remove RBAC + /api/network/* + /admin/network/* (PR #32)

Delete do `src/lib/permissions.ts` (RBAC zumbi). Delete de 11 rotas `/api/network/*` e 17 pages `/admin/network/*`. Tooling de RBAC limpo.

### ✅ Sub-etapa 3.4 — Commission + D2D + Network components cleanup (PR #33)

Delete de ~58 consumers de Commission, D2D, e Network components. Validators dedicados removidos. Components legacy excluídos. Test fixtures atualizados.

### ✅ Sub-etapa 3.4.5 — Skill chat-code-handoff project-local (PR #34)

Criação da skill `.agents/skills/chat-code-handoff/` (v0.1.0) cravando a regra de **discovery antecipada obrigatória** antes de toda spec. Razão: pause-and-reports recorrentes em Camada 1 mostraram que specs sem discovery custavam muito mais que o tempo de discovery economizaria.

### ✅ Sub-etapa 3.5 — DROP 24 tables + 6 enums (PR #35)

Migration destrutiva canonical: 24 tables + 6 enums dropados. Hand-crafted SQL via `prisma db execute --file` + `prisma migrate resolve --applied`. Test fixtures atualizados em 6 arquivos integration.

### ✅ Sub-etapa 3.5.5 — Drop PartnerBrand entirely, keep Perk (PR #36)

Discovery 3.5.5 revelou colisão: spec inicial assumia rename `PartnerBrand → Perk`, mas `Perk` já existia como model paralelo com stack completo (zero rows, 11 consumers). Spec foi totalmente reescrita: drop `PartnerBrand` + `PartnerTierAssignment` inteiros. `Perk` permanece como conceito único. Lição L3 (sempre `grep "^model NewName"` em renames) cravada.

### ✅ Sub-etapa 3.6 — ALTER NetworkProfile + drop NetworkProfileType + NCP (PR #37)

`NetworkProfile` perde 3 colunas (`parentId`, `profileTypeId`, `networkType`) — vira identidade pura (14 campos). `NetworkProfileType` + `NetworkCompensationPlan` dropados. Discovery 3.6 introduziu **Tarefa 0.5** (prisma generate + tsc surface check em worktree throwaway) que detectou 20 files reais vs 13 estimados. Lição L2 cravada.

### ✅ Sub-etapa 3.7 — Split networkTool → organizationTool + profileTool (PR #38)

`networkTool` (manifest provisório com TODO há 3 sub-etapas) split em dois tools standalone: `organizationTool` (institucional, `area: identity`, ícone `Building2`, cor roxa) e `profileTool` (pessoal, `area: identity`, ícone `User`, cor cyan). `network.tool.ts` deletado. Registry atualizado. Lições L4 (build local em worktree fails) e L5 (symlink node_modules para pre-commit) cravadas.

### ✅ Sub-etapa 3.8 — Manifest audit (6 áreas em union literal) (PR #39)

`area: string` promovido para `Area` union literal em `src/lib/tools/manifest.ts` — 6 áreas canonicais (`communication`, `transaction`, `workflow`, `notification`, `identity`, `infrastructure`). Fixes semânticos: `chat` block ref `knowledge` → `documents`; `knowledge` area `identity` → `workflow`; `ledger` area `infrastructure` → `transaction`. Polish: registry imports alfabetizados, marketing category com TODO. 4 seções novas em AGENTS.md: Tools manifest convention, Reserved blocks, Reserved area `notification`, Dashboard exception.

### ✅ Sub-etapa 3.9 — Handbook + AGENTS.md + skill updates (PR #40)

Close-out de docs:
- Handbook entry stale `areas/identity/network/` deletada (`network.tool.ts` não existia mais).
- Entries criadas: `areas/identity/organization/`, `areas/identity/profile/`, `blocks/financial/perks/`.
- `chat-code-handoff` v0.2.0 — seção "Lições cravadas pós-criação" com L1-L5.
- `practice-housekeeping-git` v1.2.0 — seção "Worktree operations".
- AGENTS.md ganhou seção `# Fase 3 close-out` + tech debt consolidado (Camada 1 + Fase 3 + cron existente).
- Este `Plano_Fase_3.md` commitado em `docs/discovery/` como artefato histórico.

### ✅ Sub-etapa 3.10 — Final pass + Fase 3 close-out tag (PR #41)

Final pass:
- Fix de regressão residual: `src/app/admin/organization/users/page.tsx` deletado (redirect órfão para `/admin/network`, path que foi deletado em 3.3).
- `prisma validate` + `prisma migrate status` rodados — schema válido, 20 migrations up to date.
- 22 tombstones em comentários (`// X removed in Sub-etapa 3.Y`) preservados como context histórico — não débito.
- Tag `fase-3-complete` aplicada em main pós-merge.

**Fase 3 complete.** 12 de 12 sub-etapas ✅ (100%). Próximo: retomada de Camada 1 quando secrets Recharge chegarem do cliente.

---

## Backup / archive tags em origin

- `pre-fase-3-network-mlm-removal` — main state pré-PR #31.
- `pre-sub-3.X-*` — main state pré-merge de cada sub-etapa (11 tags: 3.2, 3.3, 3.4, 3.4.5, 3.5, 3.5.5, 3.6, 3.7, 3.8, 3.9, 3.10).
- `archive/sub-etapa-3-X-*-<hash>` — merge commit de cada sub-etapa (11 tags pós-merge).
- `fase-3-complete` — marco final em main pós-3.10.

Total: ~23 tags entre `pre-*`, `archive/*`, e marcos.

---

## Aprendizados cravados em skills

Após Fase 3:
- `chat-code-handoff` v0.2.0 — 5 lições (L1: reverse rels exaustivas; L2: tsc surface em worktree throwaway; L3: grep `^model NewName` para renames; L4: build local em worktree fail; L5: symlink node_modules para pre-commit).
- `practice-housekeeping-git` v1.2.0 — seção "Worktree operations" com setup, cleanup pré-push, cleanup pós-squash-merge, build expected failure, gen:all no-diff anchor, `--no-verify` recovery via soft reset.

---

## Status final pós-3.10 — Fase 3 ✅ complete

**Progresso:** ██████████████████████ **12 de 12 sub-etapas (100% ✅)**

- main em commit pós-3.10. Tag `fase-3-complete` aplicada.
- 24 tables + 6 enums + ~150 arquivos de código removidos.
- 8 standalone tools no registry (chat, dashboard, handbook, knowledge, ledger, marketplace, organization, profile).
- 30 blocks no filesystem (14 órfãos preservados como forward investment).
- Type `Area` union (6 valores) protegendo manifests contra typo.
- Handbook com entries para organization, profile, perks (cravadas em 3.9).
- 2 skills atualizadas com lições da fase.
- Zero referência de código vivo aos models dropados (22 tombstones em comentários preservados como context histórico).
- 1 regressão residual de redirect corrigida em 3.10.

## Timeline

- **2026-05-18:** Fase 3 iniciada (PR #31, Sub-etapa 3.2).
- **2026-05-19:** Sub-etapas 3.3 → 3.4 (PRs #32, #33).
- **2026-05-20:** Sub-etapas 3.4.5 → 3.10 (PRs #34 → #41). Fase 3 fechada.

## Retomada da Camada 1

**Estado atual:** Fase 3 complete. main em commit pós-3.10. Tag `fase-3-complete` em origin.

**Quando os secrets Recharge chegarem do cliente:**

1. Tag de marco da retomada: `camada-1-resume-post-fase-3` em main.
2. Retomar exatamente em **Sub-etapa 10 (Recharge OAuth)** do Plano_Camada_1.
3. Estado do código no momento da retomada **não tem débito MLM/Commission/D2D** para contaminar o cutover — Fase 3 limpou tudo.

**Sub-etapas pendentes da Camada 1:**

- **Sub-etapa 10** — Recharge OAuth + HTTP client + webhook pipeline + handbook entries.
- **Sub-etapa 10.5** — OAuth callback hardening (HMAC-signed state, requireSuperAdmin).
- **Sub-etapa 11** — Recharge mapper raw → canonical (Charge / Subscription / BillingCustomer normalization).
- **Sub-etapa 12** — Cutover + DLQ + observability + done Camada 1.
