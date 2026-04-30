# Brand-kit promotion to block

> Placeholder document. To be developed when brand-kit promotion etapa
> begins (post-Fase 1.5).

## Context

Brand-kit currently lives as a sub-feature within Organization
(`/admin/organization/brand-kit/*`). The current model assumes 1:1
relationship: each organization has its brand assets.

The product reality: a single organization may have N brand kits, and
brand kits should be **consumable by other parts of the system** —
agents, surfaces, forms, landing pages, etc. — to provide consistent
visual tone across contexts.

Therefore brand-kit must be promoted to a **reusable block** in the
HERD block architecture (similar to how Companies, Products, etc. are
top-level blocks).

## Status

- Deferred from Fase 1.5 (i18n) on 2026-04-30 (Etapa 1.5.6b).
- ESLint ignore list preserves brand-kit paths through Fase 1.5.
- Discovery for the promotion etapa not yet performed.

## Open questions (to be answered during discovery)

1. **Schema model**: does brand-kit become a standalone Prisma model
   referenced by foreign key from consumers? Or stays as JSON blob in
   organization with a registry?
2. **Block manifest**: what capabilities (`create`, `update`, `read`,
   `attach_to_surface`)? What does the block manifest look like?
3. **Path migration**: `/admin/organization/brand-kit/*` →
   `/admin/brand-kit/*`? Top-level navigation entry?
4. **Sub-panel**: own sub-panel in `sub-panel.tsx` registry, similar
   to other top-level features?
5. **Consumers**: which existing surfaces should consume brand-kit
   (forms, landing pages, agents)? UX for "selecting a brand-kit"?
6. **Multi-tenancy**: organization has many brand-kits — UX of
   listing, default selection, switching between them?
7. **Migration strategy**: existing brand-kit data lives where in the
   schema? How do we migrate without breaking?

## Sequencing

Best timing for execution: after Fase 1.5 completes (i18n done across
all features), before Fase 2 (Marketplace + Direct Transactions). This
order:
- Allows the promotion etapa to use the i18n pattern from day one.
- Avoids polluting i18n etapas with architectural refactors.
- Brand-kit becomes a "first-class block" before downstream features
  (Marketplace, Transactions) try to consume it.

## Out of scope

- Custom themes per brand-kit (later product decision).
- Brand-kit versioning/history (later).
- AI-generated brand-kits (later).
