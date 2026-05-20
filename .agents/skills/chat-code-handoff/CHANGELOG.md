# CHANGELOG — chat-code-handoff (project-local)

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
