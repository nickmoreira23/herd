---
name: practice-housekeeping-git
description: Workflow para limpeza de branches git em lote com preservação histórica. Use quando o repo acumular branches órfãs, stacks de trabalho mergeado, sub-agent scratch branches, ou fragmentação que dificulte navegação. Aplicado na Fase 0 do Plano Central HERD (Sub-etapas 0.3a, 0.3b, 0.3c, 0.3d.1, 0.3d.2 — 47 branches deletadas, 48 tags archive criadas).
license: Apache-2.0
title: Git Housekeeping — Archive + Batch Delete
version: "1.0"
last_updated: "2026-05-14"
status: stable
metadata:
  herd:
    classification: practice
    abstract: Procedimento de 3 fases (Discovery → Decisão → Execução) para cleanup de branches git com preservação 100% reversível via tags archive. Codifica aprendizado da Fase 0 (Housekeeping git + re-baseline doc) do Plano Central HERD.
---

# Git Housekeeping — Archive + Batch Delete

Procedimento para cleanup de branches git que acumularam ao longo do tempo (scratch de sub-agents, stacks de trabalho merged, branches especiais). Preserva 100% do trabalho via tags archive antes de qualquer deleção. Estrutura em 3 fases evita decisões autônomas em escopo destrutivo.

## Quando usar

- Repo com >20 branches locais sem clareza imediata sobre quais são vivas vs mortas.
- Acúmulo de branches `phase-*`, `claude/*`, `chore/*`, `feature/*` órfãs após período de trabalho intenso.
- Necessidade de stack rebase ou merge envolvendo limpeza pré-merge.
- Auditoria pós-Camada/Fase do projeto onde ref-housekeeping precisa fechar.

## Princípios

### 1. Tags archive são gate obrigatório antes de delete

Pra **toda** branch a deletar, criar tag `archive/<branch-with-slashes-as-dashes>-<short-hash>` ANTES do delete, em local + origin. Padrão:

```bash
git tag archive/phase-1-etapa-1.4-ledger-query-177cc89 phase-1/etapa-1.4-ledger-query
git push origin archive/phase-1-etapa-1.4-ledger-query-177cc89
```

Recovery a qualquer momento via `git branch <name> <archive-tag>` ou `git log <archive-tag>`. Sem perda permanente.

### 2. Discovery exaustiva antes de decidir

Pra cada branch candidata a delete, capturar empiricamente:

```bash
git rev-list --count main..<branch>      # ahead de main
git rev-list --count <branch>..main      # behind de main
git merge-base --is-ancestor <branch> main && echo ancestor || echo NOT
git log -1 --format='%ai %ae %s' <branch>
git ls-remote --heads origin <branch>    # existe em origin?
git worktree list                         # em worktree ativo?
```

E quando `ahead > 0`, **patch-id check** contra main top-N:

```bash
# Build main patch-id index (one-shot)
git log -p --format='%H' main -500 | git patch-id --stable > /tmp/main-pids.txt

# Compute branch unique commits patch-ids
git show -p $(git log main..<branch> --format='%H' | tr '\n' ' ') --format='%H' | git patch-id --stable > /tmp/branch-pids.txt

# Join via patch-id to find commits already in main under different hashes
awk -v p="<pid>" '$1==p {print $2; exit}' /tmp/main-pids.txt
```

### 3. Critério rígido pra "obviamente morta"

Pra deletes em lote, exigir TODAS as condições simultaneamente:

- `git rev-list --count main..<branch>` retorna 0 (zero ahead).
- Último commit > 30 dias atrás OU `--is-ancestor main` retorna true.
- Não está em worktree ativo.
- Não está em lista crítica explícita (passada como exclusão).

Branches que não passam o critério vão pra revisão caso-a-caso na sub-etapa seguinte. **Ambíguo = pause-and-report, não delete-and-pray.**

### 4. Pause-and-report após Discovery

Sempre apresentar lista de candidatas + diagnóstico ao operador humano antes da execução. Lote de delete sem aprovação consciente é antipattern — escala mal e perde valor que existia.

### 5. Patches já em main via squash não são raros

Hipótese de trabalho durante Discovery: workflows que usam squash merge produzem **branches que parecem "ahead" mas têm commits patch-equivalentes a main sob hashes diferentes**. Patch-id check é mandatório. Casos observados na Fase 0:

- `dna-talks`: 3 commits "únicos", todos patch-equivalentes a main.
- Stack `phase-1.5/*` (18 branches, 24 commits únicos): 21/24 patch-equivalent em main.

### 6. Comparar hash local vs origin

`git ls-remote --heads origin <branch>` retornar 1 confirma presença, **mas não confirma sincronização**. Comparar hashes:

```bash
LOCAL=$(git rev-parse <branch>)
ORIGIN=$(git ls-remote --heads origin <branch> | awk '{print $1}')
[ "$LOCAL" = "$ORIGIN" ] && echo SYNC || echo DIVERGENT
```

Caso descoberto na Fase 0 (0.3c): `chore/fix-gen-all-ordering` aparecia "em origin" mas o local estava 1 commit ahead. Push fast-forward limpo resolveu, mas reportar evita decisões erradas.

## Procedimento canônico

### Fase A — Discovery exaustiva (read-only)

1. Listar todas branches candidatas via `git for-each-ref refs/heads/<prefix>/`.
2. Pra cada uma, capturar: hash, ahead, behind, ancestor, last commit date, em-origin, em-worktree.
3. Quando `ahead > 0`: patch-id check contra main top-N.
4. Quando aplicável: cross-validation com estado de filesystem (ex: pattern entries do Handbook em main).
5. Diagnóstico por branch: `DELETE seguro (ancestor)` / `DELETE seguro (patch-equivalent)` / `PRESERVAR (trabalho real)` / `INSPEÇÃO HUMANA (ambíguo)`.

### Fase B — Decisão humana em bloco

Apresentar matriz consolidada com:
- Diagnóstico por branch.
- Lista de tags archive a criar.
- Lista de branches a deletar (local + origin).
- Recomendação por linha.

**Aguardar aprovação explícita.** Nunca deletar autonomamente em lote.

### Fase C — Execução

```bash
# 1) Criar tags archive locais (batch)
git tag archive/<b1>-<h1> <b1>; git tag archive/<b2>-<h2> <b2>; ...

# 2) Push tags em batch único
git push origin archive/<b1>-<h1> archive/<b2>-<h2> ...

# 3) Delete local em batch único
git branch -D <b1> <b2> ...

# 4) Delete origin em batch único (apenas as que existem em origin)
git push origin --delete <b1> <b2> ...
```

Validar:

```bash
git status                              # clean
git tag --list 'archive/*' | wc -l      # tags totais
git for-each-ref refs/heads/ | wc -l    # branches restantes
git worktree list                       # worktrees intactos
npx prisma validate                     # smoke test schema
```

## Pitfalls observados

### `while read` em scripts com git em subshells

`while read b; do hash=$(git ...); ... done < file` trava sem motivo aparente em ambientes onde git invoca pager ou TTY interativo. Substituir por `for b in $(cat file); do ...`. Confirmado na Fase 0 (0.3a, 0.3d.2).

### `node_modules/.prisma/client/` dessincronizado após reset

`git reset --hard origin/main` não regenera o Prisma client. Se schema mudou na referência reset, types ficam stale e typecheck quebra. **Pre-flight padrão:** `npx prisma generate` antes de rodar `npm run typecheck` ou commit hook.

### Branch protection bloqueia push direto pra main

Repos com branch protection (status checks required) recusam `git push origin main`. Pra commits em main precisa workflow PR (`git branch chore/X HEAD; git reset --hard origin/main; git push origin chore/X; gh pr create`).

### Path-filtered workflows como required checks criam deadlock

Workflows com `paths:` filter listados como required em branch protection ficam "Expected — Waiting" indefinidamente em PRs que não tocam os paths. Solução: tornar workflows `paths-ignore`-based ou remover como required, OU forçar trigger adicionando mudança trivial num arquivo coberto.

### `gh pr create` precisa `--head` explícito quando você não está na branch

Se executar fora da branch alvo, gh tenta usar branch atual (frequentemente `main`) e falha com "head branch is the same as base branch". Sempre passar `--head <branch> --base main` explicitamente em automação.

## Exemplo completo — Fase 0 HERD

Aplicação prática deste skill resultou em:

- **47 branches deletadas** (de 53 iniciais → 6 finais).
- **48 tags `archive/*`** preservadas em local + origin.
- Zero perda de trabalho — todas branches recuperáveis via tags.
- Documento de retomada (`docs/retomada-i18n-stack.md`) pra trabalho diferido.

Sub-etapas:

- **0.3a** — 6 scratch claude/* (mesmo hash `cd323e8`).
- **0.3b** — 10 phase-1/* (Ledger fases 1.1–1.9 + 1.7.1).
- **0.3c** — 5 claude/* ambíguas + 4 casos especiais + worktree órfão.
- **0.3d.1** — 5 phase-refactor/* (R2.5-prelude — 9 patterns no Handbook).
- **0.3d.2** — 18 phase-1.5/* (i18n stack — merge diferido).

## How to update

Adicione novos pitfalls ou padrões descobertos em sub-etapas futuras (0.4 reconciliação Camada 1, sub-etapas da Fase 1+). Bump `version` (minor) quando adicionar padrão novo. Bump `version` (major) quando estrutura das 3 fases mudar materialmente.
