---
name: practice-housekeeping-git
description: Workflow para limpeza de branches git em lote com preservação histórica. Use quando o repo acumular branches órfãs, stacks de trabalho mergeado, sub-agent scratch branches, ou fragmentação que dificulte navegação. Aplicado na Fase 0 do Plano Central ComeçaAI (Sub-etapas 0.3a, 0.3b, 0.3c, 0.3d.1, 0.3d.2 — 47 branches deletadas, 48 tags archive criadas).
license: Apache-2.0
title: Git Housekeeping — Archive + Batch Delete
version: "1.1"
last_updated: "2026-05-15"
status: stable
metadata:
  herd:
    classification: practice
    abstract: Procedimento de 3 fases (Discovery → Decisão → Execução) para cleanup de branches git com preservação 100% reversível via tags archive. Codifica aprendizado da Fase 0 (Housekeeping git + re-baseline doc) do Plano Central ComeçaAI.
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

## Exemplo completo — Fase 0 ComeçaAI

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

## Aprendizados operacionais pós-PR #16 (Fase 0 — Sub-etapas 0.3d.2 → 0.4.4)

Aprendizados descobertos empiricamente durante housekeeping da Fase 0 que estendem
ou refinam o protocolo desta skill.

### 1. Patch-equivalence pre-flight em reconciliação main↔origin (origem: 0.2)

Em qualquer reconciliação main local ↔ origin/main, executar **patch-equivalence
pre-flight** antes de decidir estratégia (A merge, B rebase, C reset --hard).

Comando padrão:

```bash
diff <(git show <local-commit> --format= --) <(git show <origin-candidate> --format= --)
```

Se patches batem, commit local já foi consumado em origin sob outro hash — não há
trabalho a preservar. Decisão default vira reset --hard.

**Caso real:** commit `908dc18` (local) era patch-equivalente a `6f39ece` (origin)
— refutou recomendação default de Opção A merge.

### 2. Patch-id check necessário mas NÃO suficiente (origem: 0.5)

Patch-id detecta cópia idêntica de patch, mas **não detecta refinamento** — mesmo
trabalho conceitual com implementação iterativa.

Pra cada commit ahead descoberto como UNIQUE, validar adicionalmente:

- **Mesmos arquivos tocados em main?** `git log main -- <files> --since=<data> --until=<data + 7d>`
- **Mesmo autor?** Refinamento iterativo costuma ter mesmo autor.
- **Subject conceitualmente relacionado?** Palavras-chave do subject.

Se 2+ sinais batem, hipótese de "trabalho superseded" é forte.

**Caso real:** commit `0766e5f` (`chore/fix-gen-all-ordering`, 19:59:16) foi
superseded por `24697e7` em main (20:25:56, +26min, mesmo autor, mesmo escopo
de UI polish do Handbook). Patch-id NÃO bateu, mas trabalho foi reimplementado.

### 3. `git checkout --ours <file>` destrutivo em arquivos multi-região (origem: 0.4.3)

Em merge com conflitos, `checkout --ours <file>` reverte o **arquivo inteiro**
pra versão de main — descartando regiões auto-mergeadas fora dos conflict markers.

**Caso real:** `prisma/schema.prisma` tinha bloco SubscriptionTier em conflito +
Organization model + tenantId em 4 tabelas auto-mergeados em outras regiões.
`checkout --ours` descartou Organization model (detectado via TSC error
`Property 'organization' does not exist on type 'PrismaClient'`).

**Correção:** `git checkout --merge <file>` restaura conflict markers; edição
manual cirúrgica dentro dos markers preserva auto-merge em outras regiões.

**Resolução defensiva:**

- Arquivos pequenos com mudanças concentradas: `checkout --ours/--theirs` OK.
- Arquivos grandes com modificações em múltiplas regiões: **sempre edição manual
  nos conflict markers**, nunca `checkout --ours/--theirs` em escopo de arquivo
  inteiro.
- Reservar `checkout --ours <file>` apenas pra arquivos gerados (ex:
  `mcp/generated/manifest.json`).

### 4. Branch protection: checks path-filter, não órfãos (origem: 0.4.4)

Hipótese inicial após PR #16: checks `freshness` e `validate` eram configurações
órfãs em branch protection. Hipótese **refutada empiricamente** no PR #17.

**Conclusão:** `freshness` e `validate` são GitHub Actions workflows com
path-filter triggers que disparam apenas quando paths específicos são modificados.

| Tipo de PR | Workflow esperado |
|---|---|
| Toca `.agents/` OU `mcp/generated/` OU `prisma/` OU `src/` OU scripts de build | 4/4 checks disparam naturalmente. PR merge sem bypass. |
| Só toca docs `.md` em raiz ou `docs/` (sem outros paths) | Path-filter dos workflows pode não disparar. Bypass admin (`gh pr merge --admin --squash --delete-branch`) pode ser necessário. |

### 5. Backups específicos por sub-etapa de alto risco

Pra sub-etapas que modificam main ou integram trabalho grande, **2 tags backup
específicas** antes de qualquer mutação:

- **Tag em main pré-merge:** `pre-<sub-etapa-name>-merge` (rollback total).
- **Tag no tip do trabalho a integrar:** `<source-branch>-pre-merge-<hash>`
  (preservação independente).

Exemplo da 0.4.3:

- `pre-camada1-merge` em main.
- `epic-hellman-pre-merge-70c29ae` no tip de epic-hellman.

Tags backup específicas **permanecem permanentemente** (não-deletar em cleanup).

Esses backups específicos são adicionais aos `archive/<branch-name>-<hash>`
padrão (criados pra todas as branches deletadas conforme protocolo principal
desta skill). A diferença: `archive/*` preservam refs deletadas; backups
específicos preservam ESTADOS antes de mutação de main.

### 6. Batches únicos > while-read loops em operações git

Comandos compactos com argumentos explícitos são mais robustos que loops:

```bash
# Robusto:
git push origin --delete b1 b2 b3 b4 ... b10

# Frágil (pode travar com latência ou expor race conditions):
while read b; do git push origin --delete "$b"; done < list.txt
```

Aplica a: tag creation/push, branch deletion (local + origin), cherry-pick em
sequência curta.

---

## Worktree operations (v1.2.0 — Fase 3)

Operações canônicas de worktree em sub-etapas de Fase 3 (Sub-etapas 3.5 → 3.8).
Aplicar para qualquer sub-etapa que usa o padrão `.claude/worktrees/<branch>/`.

### Setup do worktree

```bash
git worktree add .claude/worktrees/<name> -b feat/<name>
cd .claude/worktrees/<name>

# Symlink temporário de node_modules — necessário para rodar
# lint/typecheck/test (e pre-commit hook) dentro do worktree.
ln -sfn /<abs-path-main-repo>/node_modules node_modules
```

`node_modules` no worktree NÃO é committado em nenhum momento. O symlink
serve apenas para a sessão local. Remover pre-push.

Se o sub-etapa precisa de `.env` (integration tests), copiar do main repo:

```bash
cp /<abs-path-main-repo>/.env .env
```

Também NÃO committado — remover pre-push.

### Cleanup pré-push

```bash
rm node_modules .env
git push origin feat/<name>
```

### Cleanup pós-merge

Squash-merge **orfana** a branch local — após o squash, `feat/<name>` aponta
para um commit que **não está** no histórico linear de main (main tem o
squash commit diferente). `git branch -d` falha por "not fully merged".
Usar `-D` (force delete).

```bash
git checkout main && git pull origin main

MERGED=$(git rev-parse --short main)
git tag archive/sub-etapa-X-name-${MERGED} main
git push origin archive/sub-etapa-X-name-${MERGED}

git push origin --delete feat/<name>
git branch -D feat/<name>          # -D obrigatório pós-squash
git worktree remove .claude/worktrees/<name>
```

### Build local em worktree = expected failure

`npm run build` falha porque Turbopack rejeita symlinks cross-worktree de
`node_modules` ("symlink invalid, points out of filesystem root").

**Não tentar fix.** Validar build via CI. Outros gates (`tsc --noEmit`,
`npm run lint`, `npm test`, `npm run test:integration`) rodam localmente
com o symlink em pé.

### `gen:all` no-diff em PRs cosméticos

Quando o PR não toca `prisma/`, `src/lib/blocks/`, `src/lib/tools/`, ou
similares que afetam manifests gerados, `npm run gen:all` produz no-diff.

**Anchor proativo necessário mesmo assim** — path-filter no CI só dispara
`freshness` + `validate` quando há mudança em `.agents/skills/**` (ou
outros paths registrados nos workflows). Adicionar entry incremental
neste CHANGELOG no mesmo push.

### Recovery de `--no-verify` denied

Pre-commit hook é obrigatório (deny do harness sobre `--no-verify` mesmo
em hooks legítimos). Workflow correto:

```bash
git add -A && git commit -m "..."  # hook roda lint+typecheck+test
```

Se o `git add` ficou incompleto antes do commit (e.g. um `git add` denied
não rodou e o commit pegou só parte das mudanças), recovery:

```bash
git reset --soft HEAD~1
git add -A
git commit -m "..."  # mesma mensagem, agora completa
```

Antes de push. NÃO usar `git commit --amend` per regra global "always
create NEW commits rather than amending".

### Scripts standalone precisam dotenv

Scripts em `scripts/` ou `prisma/seeds/` executados via `tsx` ou `node`
direto **não carregam `.env` automaticamente**. Apenas frameworks como
`next dev` fazem isso.

Primeira linha obrigatória em qualquer script standalone que leia
`process.env.X`:

```typescript
import "dotenv/config";
```

Sintoma de esquecimento: o script falha com `process.env.X is undefined`
mesmo com X presente no `.env`. Erro confunde porque o app Next funciona.

Padrão de referência: `prisma/seeds/seed-ledger.ts`. Cravado na
Sub-etapa 10.0.1 após hotfix do `seed-recharge-integration.ts`.

### Column-drop hotfix pattern (v1.2.27 — Sub-etapa 20.1)

When a Prisma migration **drops a column**, the shared `node_modules` Prisma
client regenerates immediately. Any file in the MAIN repo that references the
dropped field breaks at TypeScript build time — even before the PR merges.

**Pattern:** apply hotfix commits directly to main before the PR lands.

Files to audit after a column drop (run from main repo root):

```bash
grep -rn "<droppedField>" src/ prisma/ --include="*.ts" --include="*.tsx"
```

Common culprits:
- `src/lib/auth.ts` — admin shortcut block referencing the field
- `src/lib/auth/resolve-*.ts` — dual-read fallback using the field
- `prisma/seeds/*.ts` — seed/backfill scripts filtering or writing the field
- `src/lib/tenancy/__tests__/backfill-state.integration.test.ts` — invariant
  assertions that reference the dropped relation

**Build gate:** always run `npm run build` from the MAIN repo (not the worktree)
to catch these breaks before creating the PR. The build includes `tsc` over
seed files and integration tests that `vitest run` does not cover.

**Precedent:** Sub-etapa 20 (dropped `Organization.ownerId @unique`) and
Sub-etapa 20.1 (dropped `Organization.ownerId` column entirely) both required
main-repo hotfixes to `auth.ts`, `resolve-active-org.ts`,
`backfill-organizations.ts`, and `backfill-state.integration.test.ts`.

## How to update

Adicione novos pitfalls ou padrões descobertos em sub-etapas futuras (0.4 reconciliação Camada 1, sub-etapas da Fase 1+). Bump `version` (minor) quando adicionar padrão novo. Bump `version` (major) quando estrutura das 3 fases mudar materialmente.
