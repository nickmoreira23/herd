> For AI agents: this entry documents the R6 mini-spec (routines as top-level feature). Status: draft (planned). First real case of the top-level feature pattern.

# R6 — Routines as Top-Level Feature

R6 promotes routines from a block to a top-level feature. Creates `/admin/routines/` and a dedicated sidebar item. First real case of the top-level feature pattern (after R2 establishes the foundation).

## Business

routines is shared infrastructure — reusable sequences used across marketing, sales, operations. Top-level feature by definition (cross-area, doesn't belong to any specific block or specific tool). Today it's declared as a block only, with no top-level surface. Promoting formalizes existing structure and exposes routines as a first-class citizen.

## Product

Users see **Routines** as its own sidebar item (NEW — today it doesn't appear). UI stays (kanban, detail, 6-file wizard, run-detail).

## Architecture

- `routines.block.ts` → `routines.feature.ts` (`kind: "top_level_feature"`).
- `src/app/admin/blocks/routines/` → `src/app/admin/routines/`.
- Sidebar adds Routines item between Agents and Tools (or appropriate position).
- `routines.feature.ts` registered in `featureRegistry`.

### Pre-condition

R2 (top-level features foundation) establishes the real `FeatureManifest` type + `featureRegistry`. R6 is the first real case of the top-level feature pattern in production.

## Operations

- Routines can consume blocks (via `consumes` in `BlockConnection[]`) and can be consumed by tools.
- `Routine` model + `RoutineRun` model remain as the feature's models.
- `api/routines/*` endpoints stay (admin path changed; api path stable).
- Workflow to create/edit/run a routine stays the same, only the admin path changed.

## Glossary

- **Routine**: reusable sequence of steps with configurable triggers. Top-level feature.
- **RoutineRun**: execution instance of a routine.
- **RoutineTriggerType**: trigger type (MANUAL, SCHEDULE, EVENT).
- **RoutineStatus**: routine states (DRAFT, ACTIVE, PAUSED, ARCHIVED).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R6. First real case of the top-level feature pattern after R2 establishes the foundation.
