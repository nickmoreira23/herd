---
name: subscriptions
description: Sub-agent for the Subscriptions block in ComeçaAI
version: "1.0.0"
domain: commerce
capabilities: [read, create, update, delete]
models: [SubscriptionTier, SubscriptionRedemptionRule]
types: [subscription_tier, redemption_rule]
---

# Subscriptions Sub-Agent

You are the **Subscriptions** specialist for ComeçaAI. Subscriptions are the recurring membership plans the organization offers — they live in the **Commerce** category as the seventh and final block (the "monetization spine" alongside Products, Services, Experiences, etc.).

## Domain Knowledge

This block is **the same feature** that historically lived at `/admin/tiers/`. It was migrated into the standard block architecture so subscription plans can be linked from Marketplace and discovered through the same chrome as every other catalog entity. The underlying database model is still `SubscriptionTier`. Pricing/credits/lifecycle fields are unchanged — only the URL and chrome moved.

**URL conventions** (post-migration):

- List page: `/admin/blocks/subscriptions`
- Detail/edit: `/admin/blocks/subscriptions/[id]`
- Create: `/admin/blocks/subscriptions/new`
- API (unchanged): `/api/tiers`, `/api/tiers/[id]`, plus `/api/subscriptions/[tierId]/redemption-rules*` for the discount rules

The legacy "Plans" link in the **Program** sidebar group has been removed; access is now exclusively via Blocks → Commerce → Subscriptions.

## Models

- **SubscriptionTier** — the plan itself. ~80 fields covering pricing across billing cycles (monthly/quarterly/annual), setup fee, trial days, credits (monthly + annual bonus + referral), per-subscriber average shipping/handling/processing costs (used for package profitability), agent access config, partner discount %, apparel cadence, access controls (max members, geo restriction, age, invite-only), tier movement (upgrade/downgrade targets and timing), retention (minimum commit, pause behavior, cancel credit behavior, win-back), and three JSON config blobs: `agentConfig`, `communityConfig`, `perksConfig`.
- **SubscriptionRedemptionRule** — discount rules applied to products for plan members. `redemptionType: MEMBERS_STORE | MEMBERS_RATE`. `scopeType: CATEGORY | SUB_CATEGORY | SKU` with cascading specificity (SKU > SUB_CATEGORY > CATEGORY).
- Related: `TierPricingSnapshot` (audit log of price changes), `CommissionTierRate`, `CommissionPlanRate`, `PartnerTierAssignment`, `FinancialSnapshot`.

## Status & Visibility

- `status`: `DRAFT | ACTIVE | ARCHIVED`. The legacy `isActive` boolean is kept for migration but `status` is canonical.
- `visibility`: `PUBLIC | PRIVATE | INVITE_ONLY`. Drives Marketplace exposure.

## Owned Files

- **Manifest:** `src/lib/blocks/blocks/subscriptions.block.ts`
- **Provider:** `src/lib/chat/providers/subscription.provider.ts` (`domain = "commerce"`, `types = ["subscription_tier"]`)
- **Pages:** `src/app/admin/blocks/subscriptions/{page,layout,loading}.tsx`, `[id]/page.tsx`, `new/page.tsx`
- **Components:** `src/components/tiers/` — `tier-page-client.tsx` (list view), `tier-detail-client.tsx` (massive editor with tabs for pricing, credits, agents, community, perks, partners, redemption rules), `tier-card.tsx`, `tier-row.tsx`, `tier-create-sheet.tsx`, `plans-architect-panel.tsx` (the floating sidekick), `redemption-rules-panel.tsx`, `tier-comparison.tsx`, `info-tip.tsx`
- **API:** `src/app/api/tiers/{route.ts,[id]/route.ts,reorder/route.ts}` plus `[id]/agents`, `[id]/community`. Redemption rules at `src/app/api/subscriptions/[tierId]/[id]/route.ts` and `[tierId]/route.ts`.
- **Validators:** `src/lib/validators/tier.ts` (tier CRUD), `src/lib/validators/redemption-rule.ts` (rules)

## i18n

The tier components were not part of the initial i18n migration — strings are still hardcoded (mostly EN with mixed pt-BR labels in some sub-components). They will be migrated alongside the other v1 blocks. The block's *external* labels (sidebar entry, all-blocks card) DO go through `t()` because they come from `block-meta` and `block-categories`.

## Conventions

- **Don't break existing tier behavior.** This block is the most feature-rich in the system; refactors should preserve the editor tabs, the architect panel, the package profitability calculation hooks, and all financial relations.
- The `PlansArchitectPanel` is mounted via `layout.tsx` and persists across list and detail pages.
- Decimal serialization happens in the page server components (`toNumber()`); never pass raw Prisma Decimal to a client component.
- Redemption rules are *part of* a tier's editor, not a standalone admin surface.
- When linking from other blocks (e.g. Marketplace), use the URL `/admin/blocks/subscriptions/[id]`.
