# CHANGELOG — chat-code-handoff (project-local)

## v0.2.2 — 2026-05-21

- L7: `npm run build` local obrigatório para sub-etapas tocando route
  handlers ou `next.config.ts`. CI roda `tsc + lint + test` mas não
  roda full Next.js build — Railway/Vercel pode falhar com erros que
  passaram em CI. Rodar no main repo (não worktree, per L4).

Refs: Sub-etapa 12.0.1.

## v0.2.1 — 2026-05-20

- L6: Scripts CLI standalone via `tsx` precisam `import "dotenv/config"`
  explícito. `tsx`/`node` não carregam `.env` automaticamente (só
  frameworks como `next dev`). Sintoma: `process.env.X is undefined`.
  Padrão de referência: `prisma/seeds/seed-ledger.ts`.

Refs: Sub-etapa 10.0.1.

## v0.2.0 — 2026-05-20

Adições pós-Fase 3 (Sub-etapas 3.5 → 3.8). Nova seção "Lições cravadas
pós-criação" no SKILL.md, com 5 lições codificadas:

- L1 — Reverse rels em todos preserved models (não só o principal).
- L2 — `prisma.X` literals + `include: { X }` patterns via tsc surface
  em worktree throwaway (Tarefa 0.5 da discovery).
- L3 — `grep "^model NewName"` para detectar colisões em renames.
- L4 — `npm run build` local em worktree é expected failure (trust CI).
- L5 — Symlink temporário de node_modules para pre-commit hook em worktree.

Refs: Sub-etapas 3.5.5, 3.6, 3.7, 3.8.

## v0.1.0 — 2026-05-20

Inicial. Cravamento da regra de **discovery antecipada obrigatória**
após observação empírica em Camada 1 (Sub-etapas 4-10) e Fase 3 (3.1-3.4).

- Princípio cravado: chat NUNCA escreve spec sem discovery antecipada prévia.
- Fluxo padrão em 7 passos documentado.
- Exceções permitidas explicitadas (raras).
- Exemplo concreto: Sub-etapa 3.4 (Commission + D2D cleanup).
- Histórico empírico das sub-etapas que motivaram a regra.

Refs: Fase 3, Sub-etapa 3.4.5.
