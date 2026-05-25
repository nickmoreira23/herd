> For AI agents: this entry documents R2 (areas foundation) — the introduction of Area as the 5th canonical technical category and a structural layer above Tools. Read before touching `src/lib/core/manifest.ts`, `src/lib/core/registry.ts`, `src/lib/tools/manifest.ts` (`area` field), or proposing changes related to the product hierarchy.

# R2 — Areas Foundation

R2 introduces Areas as product macro-divisions where Tools are positioned. It replaces the speculative `top-level-feature` slot (introduced in R0.1) with a concrete category — `area` — and simplifies the hierarchy from 6 to 5 levels (Networks → Areas → Tools → Blocks → Integrations). Pillars/Modules were eliminated in favor of simplicity.

## Business

Areas are a structural layer above Tools — product macro-divisions (Communication, Transaction, Workflow, Notification, Identity, Infrastructure). They allow grouping tools by their function in the product, providing coherent navigation. Pillars/Modules were eliminated in favor of simplicity — Areas + Tools cover what we need.

For ComeçaAI customers, R2 changes nothing immediately — it is technical foundation. The user-facing effect lands in Commit 4 (sidebar reorganized by area).

## Product

Users will see tools grouped by area in the sidebar (commit 4). Area = first navigation level; Tools inside as sub-items. Aggregator layers (Tools, Blocks, Integrations) preserved as separate entries.

## Architecture

Hierarchy simplified from 6 to 5 levels:

```
Networks (Corporate, Market, Multi-market — commercial category)
   ↓ contains
Areas (6 — Communication, Transaction, Workflow, Notification, Identity, Infrastructure)
   ↓ position
Tools (all tools — including cross-cutting)
   ↓ composed of
Blocks (32 existing manifests)
   ↓ fed by
Integrations
```

5 final technical categories:

- **block** — single source of truth for a data type.
- **block-group** — intra-block grouping (R3 brings first real case).
- **tool** — composes blocks for a concrete goal.
- **tool-category** — groups tools by business discipline.
- **area** (NEW) — product macro-division.

`top-level-feature` removed (was speculative). Cross-cutting tools (chat, marketplace, knowledge, network, handbook, dashboard) have no category but mandatory area.

R2 nailed in Commit 1:

- `src/lib/core/manifest.ts` with `AreaManifest` interface + `isAreaManifest` type guard.
- `src/lib/core/registry.ts` stub with `areaRegistry` + `getAllAreas` + `getAreaByName` + `getToolsByArea`.
- `Tool` interface gained mandatory `area: string` + explicit optional `category?: string`.
- `EntityKind` extended with `"area"` (top_level_feature removed).
- `EntityManifest` discriminated union imports `AreaManifest`.
- Schema enum `technical_category` replaces `top-level-feature` with `area` (12 values).
- 10 tools embedded in categories gained area field.
- 3 marketing placeholders dropped (Marketing category preserved empty for R4).

Next commits:

- Commit 2: 6 area manifests + 6 new standalone tool manifests.
- Commit 3: tool naming/path cleanup.
- Commit 4: Knowledge migration + registry-driven 2-level sidebar.
- Commit 5: Handbook docs reform (Areas layer + entries + R1.5 sweep).

## Operations

Workflow to create a new tool:

1. Decide area (mandatory) and category (optional).
2. Add tool in `*.category.ts` (with category) OR `src/lib/tools/tools/{name}.tool.ts` (cross-cutting, no category).
3. Define `area`, `BlockConnection[]`, `ToolAction[]`, paths.
4. Cross-cutting tools live in `src/lib/tools/tools/` (Commit 2 creates the structure).

## Glossary

- **area**: product macro-division where tools are positioned. 6 canonical values.
- **AreaManifest**: area manifest interface with kind: "area".
- **areaRegistry**: lookup `Record<string, AreaManifest>` in `src/lib/core/registry.ts`.
- **getToolsByArea**: helper that filters tools[] by area.name.
- **5-level hierarchy**: Networks → Areas → Tools → Blocks → Integrations.

## Changelog

- **2026-05-03 (v1.0 — Commit 1)** — Technical foundation: AreaManifest type, registry stub, Tool gains area field, EntityManifest extension, schema enum bump, 10 tools with area, 3 marketing placeholders dropped.
