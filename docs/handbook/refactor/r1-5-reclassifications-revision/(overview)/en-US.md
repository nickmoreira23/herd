> For AI agents: this entry documents R1.5 — doc-first revision of the planned R3-R8 re-classifications against the actual code state. Before starting any R2.5–R8 stage, read this entry and the specific stage's mini-spec.

# R1.5 — Re-investigation R3-R8 Reclassifications

R1.5 is an exclusively documentary stage. During R1, while reconciling the tools foundation with the discriminator schema established in R0.2, factual investigation of the code revealed significant divergences between the original refactor plan and the actual feature state. R1.5 crystallizes the revised decisions into mini-specs before any R2.5–R8 execution begins.

## Business

The original refactor plan (drafted in R0.1) assumed greenfield: that re-classifications would be mechanical, based on a uniform reading of the current state. Investigation during R1 revealed brownfield reality with feature-specific architectural debt: packages is already a tool, campaigns coexists in two forms (active block + coming-soon placeholder), marketplace is its own structure without a manifest, agents has a dual surface (admin/agents top-level alongside admin/blocks/agents), and so on. Documenting these decisions before execution avoids repeated litigation in each individual stage.

R1.5 is pure doc-first — zero code touched. The payoff is eliminating ambiguity in downstream stages.

## Product

No product change. Internal planning work documented canonically.

## Architecture

R1.5 produces eight Handbook artifacts:

1. **R1.5 own entry** (this one) — documents the revision methodology.
2. **R2.5 — Network Split** — current Network, today a top-level with rich sub-features, will split into Organization (institutional structure) + Directory (people structure). Channel disambiguation included.
3. **R3 — Packages Refinement** — packages confirmed as a tool at sales/packages. R3 changes shape: investigate a block-group of products inside the tool (rather than moving packages inside products as originally planned).
4. **R4 — Campaigns Convergence** — campaigns is currently an active block + a coming-soon placeholder in marketing.category.ts. R4 promotes the block to a real tool and deletes the placeholder.
5. **R5 — Subscriptions Split + Offering Creation** — subscriptions remains a residual block (real customer record). New `subscription-offering` tool created in sales for the sellable catalog. Divergent paths (components/tiers/, api/tiers/) consolidated.
6. **R6 — Routines as Top-Level Feature** — routines today is a block with no top-level surface. Promoted by creating `/admin/routines/` and a dedicated sidebar item.
7. **R7 — Agents as Top-Level Feature** — agents has a dual surface (admin/agents top-level already exists alongside admin/blocks/agents). R7 consolidates and drops admin/blocks/agents/.
8. **R8 — Marketplace as Top-Level Feature** — marketplace is standalone UI without a block manifest. Plan change (it was a tool in the original); formalizes as a top-level feature with a manifest established.

The re-classifications table in `_meta/handbook/{pt-BR,en-US}.md` was updated to reflect these factual decisions, replacing the original R0.1 version.

## Operations

Going forward, any agent (human or AI) executing an R3-R8 stage must:

1. Consult the respective mini-spec in the Handbook (`docs/handbook/refactor/r{X}-{name}/`) **before** proposing any executable spec.
2. Treat the mini-spec as a scope contract. Surprises during execution (that would grow the scope or contradict the mini-spec) must be escalated to the user, not silently absorbed.
3. Not pre-create manifests promised by mini-specs (e.g. `subscription-offering.tool.ts`, `marketplace.feature.ts`) during other stages — those landings belong to the specific stage.

R1.5 does not unblock downstream stages sequentially: R2.5–R8 depend on R2 (areas foundation). R6 and R7 in particular consume the registry established in R2.

## Glossary

- **Re-classification**: change of `technical_category` for an existing feature (e.g. block → tool, block → area). Documented in the stage's mini-spec.
- **Mini-spec**: Handbook entry describing scope and decisions for a refactor stage before execution. Status `draft` while not executed.
- **Brownfield investigation**: reading the actual code (paths, manifests, surfaces) to confront the original plan's assumptions. Opposite of greenfield (planning as if nothing existed).
- **Doc-first**: protocol where architectural decisions are crystallized into canonical prose before any code change.

## Changelog

- **2026-05-03 (R1.5 closes)** — Created. 7 mini-specs created (R2.5, R3, R4, R5, R6, R7, R8) + re-classifications table in `_meta/handbook` updated + stage sequence in refactor (overview) expanded to 12 stages. Current status: doc-first done; individual stages still in draft.
