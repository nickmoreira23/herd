# Changelog — practice-housekeeping-git

Documentação histórica das mudanças desta skill. Detalhes técnicos vivem em `SKILL.md`; este changelog é narrativa.

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
