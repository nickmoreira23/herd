---
title: Perks
description: Catalog of benefits offered to members — internal from the company itself or external via partners. Each perk is configurable per subscription tier.
locale: en-US
uid: herd.block.financial.perks
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or add `.md` to the URL to avoid HTML rendering.

# Perks

Block modeling the **benefits catalog** offered to platform members. A Perk is an entry in this catalog (e.g. "Gym access", "Bookstore discount") that can be **internal** (offered by the company itself) or **external** (via partners). Each perk is configurable per `SubscriptionTier` — the same perk may be available only in the "Pro" tier, or in all tiers.

## Business

Perks address the need to communicate "what comes with the subscription" in a structured way, instead of free-text inside the tier description. Without this block, a tier ends up with a `description: string` field that becomes a source of drift between what is sold and what is actually delivered.

The canonical model was crystallized in Sub-etapa 3.5.5: `Perk` is the single concept; `PartnerBrand` was dropped and the external-vs-internal story lives as a flag/category inside Perk itself (not as a parallel model).

## Product

Interface accessible at `/admin/blocks/perks`. Operations: CRUD, bulk, import, export. Each perk can receive tier assignments via `PerkTierAssignment` (N:N junction between `Perk` and `SubscriptionTier`).

Configurable sub-options: a perk can let the member choose between variants (e.g. "Choose between Spotify or Apple Music"). Modeled inside the perk via options fields.

Block exposes orchestrator actions: `list_perks`, `create_perk`, `update_perk`, `delete_perk`, `bulk_*`, `import_perks`, `export_perks`.

## Architecture

Manifest in `src/lib/blocks/blocks/perks.block.ts`. Registry: `src/lib/blocks/registry.ts`. Validators: `src/lib/validators/perk.ts`. Prisma models: `Perk` + `PerkTierAssignment`. Status enum: `PerkStatus` (`ACTIVE`, `DRAFT`, `ARCHIVED`).

Components in `src/components/perks/`. Routes in `src/app/admin/blocks/perks/` (UI) + `src/app/api/perks/` (REST). Chat provider: `src/lib/chat/providers/perk.provider.ts`.

Declared capabilities: `read`, `create`, `update`, `delete`, `bulk`, `import`, `export`. Dependencies: `tiers` (via `PerkTierAssignment.subscriptionTierId`).

## Operations

No dedicated cron or worker. Lifecycle managed by the administrator via UI. Bulk imports via CSV. Drafts do not appear in chat queries until promoted to ACTIVE.

## Glossary

- **Perk:** unit of the benefits catalog (e.g. "Gym access").
- **PerkTierAssignment:** junction linking a perk to a subscription tier.
- **PerkStatus:** perk state (ACTIVE, DRAFT, ARCHIVED) controlling visibility.

## Changelog

- **2026-05-20 (Sub-etapa 3.5.5):** consolidated as a single concept. `PartnerBrand` (parallel zeroed model, zero rows) was dropped; the entire partners stack will migrate to Perk if/when a real case arises.
- **2026-05-20 (Sub-etapa 3.9):** handbook entry created as canonical artifact.
