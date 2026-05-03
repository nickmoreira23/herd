> Para agentes de IA: esta entrada documenta a mini-spec de R6 (routines as top-level feature). Status: draft (planned). Primeiro caso real de top-level feature pattern.

# R6 — Routines as Top-Level Feature

R6 promove routines de block para top-level feature. Cria `/admin/routines/` e sidebar item dedicado. É o primeiro caso real de top-level feature pattern (depois de R2 cravar a foundation).

## Business

routines é infraestrutura compartilhada — sequências reutilizáveis usadas em marketing, vendas, operations. Top-level feature por definição (cross-area, não pertence a nenhum block específico ou tool específica). Hoje é declarado como block apenas, sem top-level surface. Promover formaliza estrutura existente e expõe routines como cidadã de primeira classe.

## Product

Usuário vê **Routines** como sidebar item próprio (NOVO — hoje não aparece). UI permanece (kanban, detail, wizard de 6 files, run-detail).

## Architecture

- `routines.block.ts` → `routines.feature.ts` (`kind: "top_level_feature"`).
- `src/app/admin/blocks/routines/` → `src/app/admin/routines/`.
- Sidebar adiciona Routines item entre Agents e Tools (ou posição apropriada).
- `routines.feature.ts` registrado em `featureRegistry`.

### Pré-condição

R2 (top-level features foundation) cravou `FeatureManifest` type real + `featureRegistry`. R6 é o primeiro caso real de top-level feature pattern em produção.

## Operations

- Routines pode consumir blocks (via `consumes` em `BlockConnection[]`) e pode ser consumida por tools.
- `Routine` model + `RoutineRun` model permanecem como models do feature.
- Endpoints `api/routines/*` permanecem (path admin mudou; api path estável).
- Workflow para criar/editar/executar routine permanece o mesmo, só path admin mudou.

## Glossary

- **Routine**: sequência reutilizável de steps com triggers configuráveis. Top-level feature.
- **RoutineRun**: instância de execução de uma routine.
- **RoutineTriggerType**: tipo de gatilho (MANUAL, SCHEDULE, EVENT).
- **RoutineStatus**: estados de uma routine (DRAFT, ACTIVE, PAUSED, ARCHIVED).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R6. Primeiro caso real de top-level feature pattern depois de R2 cravar foundation.
