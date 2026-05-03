> For AI agents: this entry documents R0 (refactor foundation) — three sub-stages (R0.0, R0.1, R0.2) that prepared the ground for R1–R7. Read before touching `src/lib/blocks/manifest.ts` or proposing changes to the manifest registry.

# R0 — Manifest Registry Foundation

R0 is the foundation stage of the structural refactor. Composed of three sub-stages that land together in main: (i) consolidate Phase 1.5 + Handbook foundation into main, (ii) document the canonical architectural taxonomy in the Handbook, (iii) introduce the `kind` discriminator on `BlockManifest` preparing the registry for R3–R7 reclassifications. Without R0, every subsequent stage would have to re-litigate foundation questions.

## Business

Why R0 matters commercially: the refactor enables plural Tools, Solutions, and Networks layers on aligned foundation. Without R0, every R3–R7 stage — packages → block group, campaigns → tool, subscriptions split, agents → feature — would burn iteration debating "what is a block vs tool vs feature?". R0 commits the answer. Downstream stages become mechanical: apply the taxonomy, don't invent it.

## Product

Invisible to end users. R0 doesn't change behavior of any feature. What changes is what comes next — future features ship pre-classified and the registry is prepared to receive the three shapes (block, tool, area — the latter replaces the former top-level-feature in R2) instead of assuming only one.

## Architecture

### R0.0 — Pre-refactor cleanup (2026-05-02, hashes 9615dbd → 16d444f)

Structural pre-condition before any schema change. Phase 1.5 (28-commit chain) was rebased onto Handbook foundation and merged via PR #7. Handbook foundation merged via PR #6. `AGENTS.md` conflict resolved manually. Sidebar conflict resolved (Knowledge keeps Brain icon, Handbook uses BookOpen). i18n key `nav.sidebar.handbook` added.

Without R0.0, R0.1 and R0.2 would have no clean base to apply changes against.

### R0.1 — Architectural content reform (2026-05-02, hash 80f892c)

Six architectural gaps closed in `_meta/handbook`:

1. 5-level plural commercial hierarchy — Networks as a category with subtypes Multi-market / Market / Corporate.
2. Canonical architectural `technical_category` values — `block` / `block-group` / `tool` / `area` (area replaces `top-level-feature`, removed in R2).
3. Updated decision tree to classify a new feature by nature (data / utility / autonomous).
4. Updated path-mapping table covering the four architectural types.
5. Re-classifications table for R3–R7 — canonical reference so each stage knows what changes.
6. Five-instruction classification-discipline guide for agents — how to classify before proposing.

Additionally: `level` vs `technical_category` distinction documented (avoiding the inversion error), "SKILL → Handbook tool" pattern documented, `domain-events` references in AGENTS.md updated, `TechnicalCategory` enum in `schemas/feature.zod.ts` bumped from 3 → 11 values (4 canonical architectural + 7 thematic dimensions).

### R0.2 — Manifest schema bump (2026-05-02, hash b8670ed)

Schema bump in `src/lib/blocks/manifest.ts`:

```typescript
export type EntityKind = "block" | "tool" | "top_level_feature";
export type EntityManifest = BlockManifest | ToolManifest | FeatureManifest;

// BlockManifest preserves 10 functional fields + adds kind, removes domain
export interface BlockManifest {
  kind: "block";
  name: string;
  displayName: string;
  description: string;
  types: string[];
  capabilities: string[];
  actions: BlockAction[];
  models: string[];
  dependencies: string[];
  paths: { components, pages, api, lib?, validators?, provider? };
  groups?: BlockGroupSpec[];
}

// ToolManifest and FeatureManifest provisional.
// Final shapes refined in R1 (tools foundation) and R2 (features foundation).

export interface BlockGroupSpec { /* ... prepared for R3 packages */ }

// Type guards
export function isBlockManifest(m: EntityManifest): m is BlockManifest;
export function isToolManifest(m: EntityManifest): m is ToolManifest;
export function isFeatureManifest(m: EntityManifest): m is FeatureManifest;
```

**Decision: shape preservation over theoretical simplification.** The original spec proposed a 6-field minimal `BlockManifest`. The other 5 fields (`displayName`, `description`, `types`, `actions`, `dependencies`) are exercised at runtime by the chat orchestrator (`action-execution.ts`) and the UI (sidebar / dialogs). Simplifying would have broken Phase 2 chat. Simplification (if desirable) is a separate refactor with its own scope.

**Mechanical migration:** 32 manifests in `src/lib/blocks/blocks/` updated. Each got `kind: "block"` as the first field; `domain` field removed.

**Consumer cleanup:** `src/lib/marketplace/types.ts` and `src/lib/marketplace/registry.ts` had `EligibleBlock.domain` that mechanically mapped from `manifest.domain`. Removed (no semantic consumer beyond the mapping itself).

`domain` was deprecated, not replaced. The drift was severe (4 values declared in spec vs 7 in code, with `engagement` listed but never used). No `category` reintroduction in this stage — when concrete consumer demand appears, `category` can be added with proper semantics.

### Decision: separate registries

Block, tool, and feature registries are physically separate (`src/lib/blocks/blocks/`, `src/lib/tools/tools/`, `src/lib/features/`). R0.2 keeps `blockRegistry` as `Record<string, BlockManifest>`. R1 and R2 introduce parallel `toolRegistry` and `featureRegistry`. A unified `Record<string, EntityManifest>` was rejected in favor of physical separation matching the path layout.

## Operations

Five instructions for agents working on post-R0 surface:

1. When creating a new manifest, use the appropriate `kind` (`block` for now; `tool` and `top_level_feature` available but no producer in R0). Add `kind: "block"` as the first field of the literal.
2. When consuming a manifest where `kind` matters, use type guards (`isBlockManifest`, `isToolManifest`, `isFeatureManifest`) for narrowing. Don't access kind-specific fields without a guard.
3. When re-classifying a manifest from `block` to `tool` or `top_level_feature` (in R3–R7), follow the stage's spec for path moves and field mapping. Don't improvise.
4. `domain` field is removed and not replaced. If a use case appears that needs filtering/grouping manifests, propose it with concrete consumer + semantics; don't invent.
5. The 5 classification-discipline instructions in `_meta/handbook` apply: classify before proposing, justify with the decision tree, document re-classification in the commit, bring doubts to dialogue, don't invent new categories.

## Glossary

- **EntityManifest**: discriminated union of `BlockManifest | ToolManifest | FeatureManifest`. Replaces the monolithic `BlockManifest` of pre-R0.
- **kind**: discriminator field on `EntityManifest`. Values: `"block" | "tool" | "top_level_feature"`. Determines structural shape and where the manifest physically lives.
- **BlockGroupSpec**: nested specification for block groups (e.g., packages as a group of products). Lives inside the parent block's `groups?` field. R3 will exercise this.
- **type guard**: TypeScript narrowing function (`isBlockManifest`, etc.) that confirms the `kind` of an `EntityManifest` at runtime, allowing the compiler to access kind-specific fields safely.

## Changelog

- **2026-05-02 (R0 closes)** — Three sub-stages land in main: R0.0 cleanup (PR #7 + #6), R0.1 content reform (PR #8, hash 80f892c), R0.2 schema bump (this entry, hash b8670ed). 23 total `feature.yml` in the Handbook (was 21 → +1 for refactor overview, +1 for r0-manifest-registry).
