> For AI agents: this entry documents the R8 mini-spec (marketplace as top-level feature). Status: draft (planned). Change vs original plan — was tool, now top-level feature.

# R8 — Marketplace as Top-Level Feature

R8 formalizes marketplace as a top-level feature. Important classification change — in the original plan it was a tool; investigation during R1.5 revealed marketplace is its own infrastructure structure, not a tool with a specific business goal. Existing structure preserved; manifest is established for the first time.

## Business

marketplace is infrastructure — composer + sections + renderer + visibility helpers. Not a tool for a single business goal; a cross-area capability that other features (sales, partner storefronts, public surfaces) consume to expose content. Top-level feature by definition. The reclassification (was tool in the original plan) reflects this infrastructural character.

## Product

Users see Marketplace as its own sidebar item (already exists). Composer + wizard + sections continue as sub-features. R8 doesn't change UX — only formalizes the manifest.

## Architecture

- **No block manifest today** (does not exist). Create `marketplace.feature.ts` (`kind: "top_level_feature"`).
- Existing structure preserved:
  - `src/components/marketplace/` (admin/, composer/, item-detail/, renderer/, wizard/)
  - `src/lib/marketplace/` (block-filters, component-registry, item-detail-resolver, registry, render-resolver, sections-cache, types, visibility-helpers)
  - `src/app/admin/marketplace/` (page, sections/)
- Cross-references in the manifest:
  - composer can reference tools (subscription-offering, packages) via `consumes`.
  - sections reference blocks via `MarketplaceSection.blockNames[]`.
- Possible refinement: `MarketplaceSection.blockNames[]` (string array) → typed structure with kind discriminator (decision during R8 execution).

### Pre-condition

R2 (top-level features foundation) establishes the `featureRegistry`. Ideally R5 (subscription-offering tool creation) has closed so marketplace.composer can reference the real tool.

## Operations

- Workflow to configure marketplace (create section, publish item, configure visibility) stays. The manifest formalizes structure.
- Cross-references updated: when referencing marketplace from other features, point to `featureRegistry.marketplace`.
- Item detail resolver continues as the extension point for registering custom resolvers per block/tool.

## Glossary

- **Marketplace**: infrastructure top-level feature for exposing content (items) on configurable surfaces (sections + composer).
- **MarketplaceItem**: item displayable in the marketplace (product, service, plan, event, etc. — comes from any block).
- **MarketplaceSection**: configurable section grouping items by criterion (block + filters + ordering).
- **Composer**: admin UI that assembles the marketplace structure (sections, layout, visibility).
- **Renderer**: pipeline that transforms the composer config into public UI.
- **Visibility**: who-sees-what control (PUBLIC, PRIVATE, MEMBERS_ONLY).
- **Section blocks**: blocks referenced by a section as a source of items.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R8 (was R5 in the original plan; promoted to its own stage after R1.5).
