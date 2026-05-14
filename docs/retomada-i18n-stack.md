# Retomada — Stack i18n (`phase-1.5/*`)

> **Estado:** trabalho 87.5% integrado em main; 18 branches preservadas via tags `archive/phase-1.5-*`.
> **Origem:** Sub-etapa 0.3d.2 da Fase 0 do Plano Central (preservação inteligente).
> **Última atualização:** 2026-05-14.

## Resumo executivo

Stack i18n de 18 branches representava trabalho estratificado em 6 etapas (1.5.1 → 1.5.6e). Análise empírica via patch-id check pós-Fase 0 revelou:

- **21 de 24 commits únicos da stack ESTÃO em main sob hashes diferentes** (squash merge agressivo durante integração original).
- **3 commits UNIQUE** sem patch-equivalent 1:1 em main, todos MADUROS por heurística (mensagens detalhadas, testes em 2/3, sem flags WIP/TODO/draft). Hipótese: absorvidos em squashes maiores que cruzaram múltiplas etapas — não-detectáveis por patch-id direto, mas conteúdo presente em main via outros caminhos.
- **Stack tocou 368 arquivos únicos**; main modificou todos 368 pós-divergência. Overlap 100%.
- **Merge/rebase agora seria contra-produtivo** — guerra de conflitos por contra-equivalência, não por discordância semântica real.

**Decisão de produto:** merge real diferido pra quando i18n virar prioridade explícita. Preservação via 18 tags archive cobre o risco residual.

## Estrutura ordinal da stack (cascata linear)

```
1.5.1-i18n-audit                    (1 ahead)
  ↓
1.5.2-i18n-hardening                (2 ahead)
  ↓
1.5.3-locale-switching-and-routing  (3 ahead)
  ↓
1.5.4-ledger-i18n                   (4 ahead)
  ↓
1.5.5-admin-shell-i18n              (5 ahead)
  ↓
1.5.6a-brand-critical-i18n          (6 ahead)
  ↓
1.5.6a-bis-financials-i18n          (9 ahead)   +3
  ↓
1.5.6b-identity-and-people-i18n     (11 ahead)  +2
  ↓
1.5.6b-bis-network-foundation-i18n  (12 ahead)  +1
  ↓
1.5.6b-tris-network-surfaces        (14 ahead)  +2
  ↓
1.5.6c-knowledge-cleanup            (15 ahead)  +1
  ↓
1.5.6d-pre-forms-public-cleanup     (16 ahead)  +1
  ↓
1.5.6d-alpha-forms-admin            (18 ahead)  +2
  ↓
1.5.6d-beta-tables-admin            (21 ahead)  +3
  ↓
1.5.6d-gamma-apps-admin             (22 ahead)  +1
  ↓
1.5.6d-delta-feeds-links            (23 ahead)  +1
  ↓
1.5.6d-epsilon-media-batch          (24 ahead)  +1   ← tip da cascata não-mergeada
  ↓
1.5.6e-knowledge-shell              (0 ahead)        ← consolidação final, já em main
```

`1.5.6e-knowledge-shell` foi a única ancestral de main — provável commit de consolidação final que entrou via squash. As 17 anteriores apontam pros commits originais não-squashed.

## 18 branches preservadas via tags archive

| Etapa | Hash original | Tag archive |
|-------|---------------|-------------|
| 1.5.1-i18n-audit | `daca2dc` | `archive/phase-1.5-etapa-1.5.1-i18n-audit-daca2dc` |
| 1.5.2-i18n-hardening | `1da3d43` | `archive/phase-1.5-etapa-1.5.2-i18n-hardening-1da3d43` |
| 1.5.3-locale-switching-and-routing | `d58728b` | `archive/phase-1.5-etapa-1.5.3-locale-switching-and-routing-d58728b` |
| 1.5.4-ledger-i18n | `b19afbd` | `archive/phase-1.5-etapa-1.5.4-ledger-i18n-b19afbd` |
| 1.5.5-admin-shell-i18n | `d0f0a05` | `archive/phase-1.5-etapa-1.5.5-admin-shell-i18n-d0f0a05` |
| 1.5.6a-brand-critical-i18n | `35d0722` | `archive/phase-1.5-etapa-1.5.6a-brand-critical-i18n-35d0722` |
| 1.5.6a-bis-financials-i18n | `86b5b4d` | `archive/phase-1.5-etapa-1.5.6a-bis-financials-i18n-86b5b4d` |
| 1.5.6b-identity-and-people-i18n | `7feca4e` | `archive/phase-1.5-etapa-1.5.6b-identity-and-people-i18n-7feca4e` |
| 1.5.6b-bis-network-foundation-i18n | `38858bd` | `archive/phase-1.5-etapa-1.5.6b-bis-network-foundation-i18n-38858bd` |
| 1.5.6b-tris-network-surfaces | `0ae2ef7` | `archive/phase-1.5-etapa-1.5.6b-tris-network-surfaces-0ae2ef7` |
| 1.5.6c-knowledge-cleanup | `42d8168` | `archive/phase-1.5-etapa-1.5.6c-knowledge-cleanup-42d8168` |
| 1.5.6d-pre-forms-public-cleanup | `88f097a` | `archive/phase-1.5-etapa-1.5.6d-pre-forms-public-cleanup-88f097a` |
| 1.5.6d-alpha-forms-admin | `5a4bf1d` | `archive/phase-1.5-etapa-1.5.6d-alpha-forms-admin-5a4bf1d` |
| 1.5.6d-beta-tables-admin | `874c57a` | `archive/phase-1.5-etapa-1.5.6d-beta-tables-admin-874c57a` |
| 1.5.6d-gamma-apps-admin | `2725893` | `archive/phase-1.5-etapa-1.5.6d-gamma-apps-admin-2725893` |
| 1.5.6d-delta-feeds-links | `5d1f320` | `archive/phase-1.5-etapa-1.5.6d-delta-feeds-links-5d1f320` |
| 1.5.6d-epsilon-media-batch | `84bb5f6` | `archive/phase-1.5-etapa-1.5.6d-epsilon-media-batch-84bb5f6` |
| 1.5.6e-knowledge-shell | `10a70c9` | `archive/phase-1.5-etapa-1.5.6e-knowledge-shell-10a70c9` |

Todas tags em local + origin (push em batch único na Sub-etapa 0.3d.2).

## 21 commits patch-equivalent em main

Trabalho integralmente preservado em main sob outros hashes. Não há nada a recuperar nesses — tabela é apenas referência histórica.

| Stack commit | Subject (truncado) | Em main como |
|--------------|--------------------|--------------|
| `daca2dc` | chore(1.5.1): i18n audit report — state of the system | `66c7ee3` |
| `d58728b` | feat(1.5.3): locale switching UX + hybrid public routing | `536c432` |
| `35d0722` | feat(1.5.6a): brand-critical (commissions + helpers) | `78b7945` |
| `cbc0b4b` | feat(1.5.6a-bis): financials i18n fase A — small files + units | `74f0cc8` |
| `9022cb4` | feat(1.5.6a-bis): financials i18n fase B — spreadsheets + audit | `25c45c4` |
| `86b5b4d` | feat(1.5.6a-bis): financials i18n fase C — entry point + builder | `023c9cb` |
| `db2ffa3` | feat(1.5.6b): identity fase A — organization (sem brand-kit) | `285d1be` |
| `7feca4e` | feat(1.5.6b): identity fase C — partners + profile | `2668954` |
| `38858bd` | feat(1.5.6b-bis): network foundation — subpanel + structural | `e098d16` |
| `709a623` | feat(1.5.6b-tris): network promoters i18n (Fase δ) | `6e28b46` |
| `0ae2ef7` | feat(1.5.6b-tris): network surfaces i18n (Fase ε) | `cc5e2dd` |
| `42d8168` | refactor(1.5.6c): knowledge zombie code cleanup | `44732a8` |
| `88f097a` | refactor(1.5.6d-pre): delete forms public surface | `53ee36d` |
| `22c32da` | feat(1.5.6d-alpha): forms builder + field types i18n | `12a198f` |
| `5a4bf1d` | feat(1.5.6d-alpha): forms admin (responses + templates + import) | `f93e49a` |
| `5517177` | feat(1.5.6d-beta): tables grid + cells + field types i18n | `eafb096` |
| `874c57a` | feat(1.5.6d-beta): tables admin chrome i18n | `0bcd061` |
| `2110861` | feat(1.5.6d-beta): tables airtable import wizard i18n | `53d49a6` |
| `2725893` | feat(1.5.6d-gamma): apps admin i18n + Template K (Token Auth) | `98c2135` |
| `5d1f320` | feat(1.5.6d-delta): feeds + links admin i18n + Knowledge twins | `fe39908` |
| `84bb5f6` | feat(1.5.6d-epsilon): media batch admin i18n + Knowledge twins | `ee4da6a` |

## 3 commits UNIQUE — verificação obrigatória antes de retomar

Estes 3 commits são MADUROS por heurística mas não têm patch-equivalent 1:1 em main. **Hipótese de trabalho:** foram absorvidos em squashes que cruzaram múltiplas etapas. **Verificação empírica recomendada antes de qualquer decisão futura.**

### 1. `1da3d43` — 1.5.2 i18n hardening (27 arquivos, 6 testes, body rico)

Estabelece base técnica: 5 formatters localizados (`formatDate`, `formatNumber`, `formatRelativeTime`, `pluralize`, `compareCollation`), `formatMoney` aceita locale como parâmetro, `setLocaleCookie` server action, locale identifiers em forma completa (pt-BR, en-US), CHECK constraint no DB, CI gate.

**Comandos prontos pra colar quando i18n virar prioridade:**

```bash
# Conteúdo focado em src/lib/i18n
git diff main archive/phase-1.5-etapa-1.5.2-i18n-hardening-1da3d43 -- src/lib/i18n/

# Stat geral
git diff main archive/phase-1.5-etapa-1.5.2-i18n-hardening-1da3d43 --stat
```

### 2. `b19afbd` — 1.5.4 ledger i18n + canonical pattern (25 arquivos, 1 teste, body rico)

Internacionaliza Ledger end-to-end e estabelece o pattern canonical de i18n que as etapas 1.5.5 e 1.5.6a-e replicaram. 23 error classes ganharam campo `code: string`, helpers `translateError()` / `translateErrorWithT()`, ~85 keys em pt-BR.ts + en-US.ts, pattern satisfies-map pra enum-to-key mapping.

```bash
# Conteúdo focado em ledger
git diff main archive/phase-1.5-etapa-1.5.4-ledger-i18n-b19afbd -- src/lib/ledger/

# Stat geral
git diff main archive/phase-1.5-etapa-1.5.4-ledger-i18n-b19afbd --stat
```

### 3. `d0f0a05` — 1.5.5 admin shell i18n + common namespace (13 arquivos, sem testes, body rico)

Internacionaliza admin chrome (sidebar, sub-panel, breadcrumb, profile dropdown, error boundaries) e estabelece estrutura permanente do namespace `common.*`: actions (21 verbos), states (9), placeholders, confirmations, feedback, time, units (deferred). Sem testes esperado (UI shell).

```bash
# Conteúdo focado em components/layout
git diff main archive/phase-1.5-etapa-1.5.5-admin-shell-i18n-d0f0a05 -- src/components/layout/

# Stat geral
git diff main archive/phase-1.5-etapa-1.5.5-admin-shell-i18n-d0f0a05 --stat
```

**Workflow de verificação (em 5 minutos):**
- Rodar os 6 comandos acima.
- Se `--stat` retornar vazio ou triviais (whitespace, imports): trabalho 100% em main → nada a fazer, arquivar definitivamente.
- Se `--stat` retornar mudanças substantivas: cherry-pick seletivo do(s) commit(s) UNIQUE, seguindo o padrão de migração canonical (`b19afbd`/1.5.4 é o template).

## Escopo da stack

| Área | Arquivos únicos |
|------|---------:|
| `src/components/` (UI principal) | **267** |
| `src/app/` (admin pages) | 55 |
| `src/lib/i18n/` (core) | 22 |
| outros (config, lib específicas) | 19 |
| `docs/` | 3 |
| `prisma/` | 1 (migration `locale_constraint`) |
| `scripts/` | 1 |
| **Total único** | **368** |

Outros notáveis: `.agents/skills/ledger/SKILL.md`, `.github/workflows/ci.yml`, `AGENTS.md`, `eslint.config.mjs`, `package.json`, `src/lib/apps/provider-catalog.ts`, `src/lib/blocks/blocks/forms.block.ts`, `src/lib/domain-events/errors.ts`, `src/lib/feeds/status-options.ts`, `src/lib/knowledge/media-status.ts`, `src/lib/ledger/errors.ts`, `src/lib/links/status-options.ts`, `src/lib/money/format.ts`, e ~6 outros.

## Conflitos antecipados contra main

- Merge-base main vs tip da stack: `650c814`
- Commits em main após divergência: **125**
- Arquivos únicos modificados em main pós-divergência: **946**
- **Overlap stack ∩ main pós-divergência: 368/368 arquivos (100%)**

**Severidade conceitual: ALTA, mas esperada.** Overlap massivo é consequência direta do squash agressivo — 87.5% do trabalho já está em main, então cada arquivo modificado pela stack TEM contra-equivalente em main. Rebase produziria conflitos por contra-equivalência (trabalho duplicado), não por discordância semântica.

## Estratégia recomendada para retomada futura

### ✅ Opção A — Diff direto dos 3 UNIQUE contra main atual (RECOMENDADA — default)

Quando i18n virar prioridade explícita do produto, executar os 6 comandos `git diff main archive/...` da seção "3 commits UNIQUE" acima. Em 5 minutos sabe-se se há trabalho real a recuperar.

**Por que é o caminho certo:**
- 87.5% do trabalho da stack já está em main.
- Overlap de 100% em arquivos → qualquer rebase seria guerra de conflitos por contra-equivalência.
- 3 commits UNIQUE são o único delta possível. Diff direto os isola sem custo de coordenação.
- Cherry-pick seletivo dos 3 (se ainda forem novidade) é operação de 1 dia, não 1 semana.

### ⚠️ Opção B — Re-implementação informada pelas tags archive (não-recomendada)

Manter as tags como "specs históricas" e reimplementar do zero. **Não-recomendada porque:** trabalho já existe em main sob outros hashes. Reimplementar seria triplicar custo sem benefício técnico. Mantida aqui apenas pra contexto histórico caso futuro descubra trabalho real perdido em escopo grande.

### ⚠️ Opção C — Rebase da cascata (NÃO-recomendada)

Reaplicar as 18 branches em sequência sobre main atual. **Não-recomendada porque:** 368 arquivos overlap = 100% guerra de conflitos por contra-equivalência. Custo prático: semanas de resolução manual com ganho técnico zero. Mantida aqui apenas pra contexto histórico.

## Comandos úteis

```bash
# Listar todas as tags archive da stack
git tag --list 'archive/phase-1.5-*'

# Ver histórico completo de uma etapa específica
git log archive/phase-1.5-etapa-1.5.4-ledger-i18n-b19afbd

# Recriar branch local a partir de tag archive (se precisar inspecionar com checkout)
git branch phase-1.5/etapa-X.Y.Z-name archive/phase-1.5-etapa-X.Y.Z-name-<hash>

# Diff de uma tag arquivada contra main atual (substituir o nome da tag)
git diff main archive/phase-1.5-etapa-1.5.4-ledger-i18n-b19afbd --stat

# Listar commits únicos de uma tag arquivada vs main
git log main..archive/phase-1.5-etapa-1.5.6d-epsilon-media-batch-84bb5f6 --oneline
```

## Próximos passos quando i18n virar prioridade

1. **Re-ler este documento** — verificar staleness (datas, hashes, tags ainda válidos).
2. **Executar os 6 comandos de diff dos 3 UNIQUE** (seção acima).
3. **Decisão baseada nos diffs:**
   - Vazio/trivial → arquivar definitivamente, deletar tags se quiser (opcional).
   - Substantivo → cherry-pick seletivo, seguindo pattern canonical de `b19afbd` (1.5.4).
4. **Se trabalho substantivo for descoberto**, gerar plano-mestre dedicado (modelo chat-code-handoff) antes de implementar.

---

> **Documento de retomada.** Gerado em 2026-05-14 pela Sub-etapa 0.3d.2 da Fase 0 do Plano Central. Atualizar `Última atualização` no topo quando re-revisado.
