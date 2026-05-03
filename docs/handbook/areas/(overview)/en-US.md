---
title: Areas
description: Structural layer of product macro-divisions. Each area groups tools by their function in the product.
locale: en-US
uid: herd.layer.areas
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Areas

Areas are a structural layer that organizes tools by **function in the product**. Unlike commercial layers (Solutions) or functional-taxonomy layers (Tools), Areas answer "what part of the product does this live in?" — Communication, Transaction, Workflow, Notification, Identity, Infrastructure.

## Business

Areas are the structural layer of product macro-divisions. Each area groups tools by function (Communication, Transaction, Workflow, Notification, Identity, Infrastructure). They enable coherent navigation in the `/admin/areas` landing page and architectural organization by macro-nature.

There are 6 canonical areas, defined in code under `src/lib/core/areas/` and referenced in the Handbook as categories under the `areas` layer.

## Product

Users can explore tools grouped by area at `/admin/areas`. The sidebar keeps featured shortcuts (by usage frequency); areas offer taxonomic exploration complementary to functional-category grouping.

## Architecture

Post-R2 official hierarchy: **Networks → Areas → Tools → Blocks → Integrations**.

- 6 canonical areas (sortOrder 1-6).
- Each area is a category-level entry in the Handbook, under the `areas` layer.
- Tool entries inside areas mirror the code taxonomy in `src/lib/tools/tools/{tool}.tool.ts`.
- Schema/code: `src/lib/core/manifest.ts` (`AreaManifest`) + `src/lib/core/registry.ts` (`areaRegistry`).
- Areas replace the previous `top-level-feature` concept removed in R2.

## Operations

To create a new area: rare — only when a new macro-division genuinely justifies it. Add `*.area.ts` under `src/lib/core/areas/`, register it in `areaRegistry`, create the handbook entry in `docs/handbook/areas/{name}/(overview)/` (Areas layer) with bilingual md + feature.yml.

Tools within an area: create an entry at `docs/handbook/areas/{area}/{tool}/feature.yml` pointing to `parent: herd.category.areas.{area}`.

## Glossary

- **Area**: product macro-division grouping tools by the function they perform (Communication, Transaction, Workflow, Notification, Identity, Infrastructure).
- **AreaManifest**: TypeScript schema in `src/lib/core/manifest.ts` describing an area.
- **areaRegistry**: static registry in `src/lib/core/registry.ts` enumerating the 6 canonical areas.
- **getToolsByArea**: helper returning tools registered in a given area.
- **areas-as-Handbook-layer**: R2 convention — areas became the 5th canonical Handbook layer (under `docs/handbook/areas/`).

## Changelog

- **2026-05-03 (R2)** — Areas layer locked in with 6 canonical areas. Replaces the former `top-level-feature` concept.
