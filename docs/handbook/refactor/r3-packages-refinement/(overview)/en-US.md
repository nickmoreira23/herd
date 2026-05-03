> For AI agents: this entry documents the R3 mini-spec (packages refinement). Status: draft (planned). Investigation revealed packages IS ALREADY a tool in sales — R3 changes shape vs the original plan.

# R3 — Packages Refinement

R3 refines the packages tool in sales. The original plan was "move packages inside products as a block-group". Investigation during R1.5 revealed that packages already exists as an active tool (`sales/packages`). R3 becomes a refinement: investigate whether the "products bundled" concept (a curated subset of products composing a package) warrants its own typed structure as a block-group inside the products block.

## Business

packages is an active tool — a bundle of products+services+plans for sale. Stays as a tool. The refinement investigates whether "products bundled" (curated subset) warrants its own typed structure as `ProductGroup` (block-group inside products), rather than remaining a schemaless string array.

For the customer: nothing visible changes short-term. The refinement enables future evolutions (bundled price defined on ProductGroup, group-level commercial discounts, attribute inheritance).

## Product

Nothing visible to the user changes. Internal data model refinement.

## Architecture

The packages tool composes a block-group of products (`ProductGroup`) + other things (bundled price, contracts). Investigation during R3:

- `ProductGroup` as a block-group of products: name, description, productIds list, light metadata (bundled price, commercial description).
- `BlockGroupSpec` inside `products.block.ts` gets its first real case (until R3, block-group exists only as the architectural category established in R0.1 without real implementation).
- The packages tool consumes the products block via `BlockConnection` with narrow scope (reads only `productGroups` inside products, not the whole block).

### Pre-condition

R2 (top-level features foundation) and R1 (tools foundation) already establish the discriminator schema. R3 introduces the first real `kind: "block_group"`.

## Operations

- Workflow to create a package: select an existing ProductGroup OR create a new one. The sub-workflow to create a ProductGroup lives in the products UI (not in the packages tool).
- Data migration: if today a package references productIds directly as a string array, migrate to an FK on ProductGroup.
- `packages.tool.ts` (already existing) updated to declare a `BlockConnection` with narrow path (`products.productGroups`).

## Glossary

- **ProductGroup**: block-group inside products. Curated subset of productIds with light metadata. First real case of the block-group pattern.
- **Bundled pricing**: price defined at the ProductGroup level, distinct from the sum of individual products.
- **Package**: sellable instance composing a ProductGroup + commercial terms (contract, billing). Tool in sales.
- **package vs product-group distinction**: a package is the commercial offering; a product-group is the underlying products bundle. A package consumes a product-group.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R3. First real case of the block-group pattern.
