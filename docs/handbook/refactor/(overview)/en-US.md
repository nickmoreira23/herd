> For AI agents: this is the canonical document for the pre-1.5.6f structural refactor. Before starting any stage (R0–R7), read this overview and the specific stage entry at `docs/handbook/refactor/r{N}-{name}/(overview)/`.

# Pre-1.5.6f Structural Refactor

This layer groups the refactor stages preceding Phase 1.5.6f. The refactor emerged from architectural reconnaissance during 1.5.6f planning: production code had accumulated ad-hoc classifications (fields like `domain` on manifests, `category` on blocks vs tools vs features) that didn't match the canonical taxonomy documented in the Handbook (`_meta/handbook`). Before building new layers (plural Tools, Solutions, Networks), the ground had to be leveled.

The refactor introduces no new behavior. It aligns existing structures — or prepares the registry to receive aligned structures — before more code is written on misaligned foundation.

## Business

Why the refactor exists commercially: every refactor stage deferred would force every subsequent stage (R3 packages, R4 campaigns, R5 subscriptions, R7 agents) to re-litigate foundation questions — "is this a block or tool?", "which field classifies?", "where does it live?". The indecision propagates into code. R0 commits the foundation so R1–R7 are mechanical.

The payoff is indirect and deferred: future features ship pre-aligned, agents (human and AI) make classification decisions by consulting canonical documentation rather than inferring from existing code, and the burden of maintaining consistency drops.

## Product

Invisible to end users. Pure foundation work. The impact arrives via: faster downstream feature delivery (decisions already made), avoided classification bugs (manifests don't derive meaning from drift), and a Handbook usable as source of truth.

## Architecture

The refactor is divided into 12 stages. R0 and R1 are closed; R1.5 is the doc-first re-investigation of the planned re-classifications. Stages R2.5–R8 were revised against the actual code state.

| Stage | Work | Status |
|---|---|---|
| R0 | Foundation (cleanup + content reform + schema bump) | done (2026-05-02) |
| R1 | Tools Foundation reconciliation (5 technical categories) | done (2026-05-02) |
| R1.5 | Re-investigation R3-R8 (re-classifications revised against actual state) | done (2026-05-03) |
| R2 | Top-level features foundation | planned |
| R2.5 | Network split (Organization + Directory) | planned |
| R3 | Packages refinement | planned |
| R4 | Campaigns convergence (block → tool) | planned |
| R5 | Subscriptions split + subscription-offering creation | planned |
| R6 | Routines → top-level feature | planned |
| R7 | Agents → top-level feature (consolidate dual surface) | planned |
| R8 | Marketplace → top-level feature | planned |

Each stage has its own entry at `docs/handbook/refactor/r{N}-{name}/(overview)/` documenting: motivation, decisions, migration mechanics, and reference to the commit that closed it.

## Operations

For agents (human or AI) working on the refactor:

1. Read the specific stage entry before proposing changes. The decisions are canonical and justified — improvising contradicts the protocol.
2. Consult `_meta/handbook` for the classification decision tree (block / block-group / tool / top-level-feature). The whole refactor depends on this taxonomy.
3. Downstream stages (R3–R7) consume decisions from R0 (kind discriminator) and R1/R2 (tool/feature manifests). Don't skip reading the prior stages.
4. Every stage closes with commit + updated Handbook entry. Without the entry, the stage isn't closed.

## Changelog

- **2026-05-02 (R0 closes)** — Foundation ready. R0.0 (pre-refactor cleanup), R0.1 (architectural content reform), R0.2 (manifest schema bump) merged to main. R1–R7 unblocked.
- **2026-05-02 (R1 closes)** — Tools Foundation reconciliation. Tool gains `kind: "tool"`. ToolCategoryManifest gains `kind: "tool_category"`. `tool-category` established as 5th canonical architectural category.
- **2026-05-03 (R1.5 closes)** — Doc-first re-investigation. Re-classifications R3–R8 revised against actual code state. 7 mini-specs created (R2.5, R3, R4, R5, R6, R7, R8). Sequence expanded to 12 stages.
