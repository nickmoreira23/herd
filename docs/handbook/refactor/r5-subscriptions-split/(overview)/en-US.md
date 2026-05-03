> For AI agents: this entry documents the R5 mini-spec (subscriptions split + offering creation). Status: draft (planned). Most complex stage of the post-R1.5 refactor.

# R5 — Subscriptions Split + Offering Creation

R5 splits the subscriptions monolith into two distinct commercial layers: a residual block (the customer's real subscription) + a new `subscription-offering` tool (sellable catalog). Consolidates divergent paths (components/tiers/, api/tiers/) into a coherent structure.

## Business

subscriptions today mixes two concepts:

- **"Tier offering"** — sellable catalog: definition of plans, tiers, billing terms, agent access.
- **"Real subscription"** — customer record: who subscribed to which tier, payment status, active billing cycle, cancellations.

Conceptually separate, currently in the same file and UI. R5 separates them into two distinct commercial layers — one sellable (offering), one operational (real subscription).

## Product

Users see:

- `/admin/tools/sales/subscription-offering/` (NEW tool) — where plans, tiers, billing terms are defined for sale.
- `/admin/blocks/subscriptions/` (existing, residual) — where real subscriptions are managed (active customers, subscribed tiers, payment status, operational actions like pause/cancel).

## Architecture

- `Subscription` model stays in the subscriptions block (real customer representation).
- `SubscriptionTier` model moves semantically to the subscription-offering tool (model stays in the same Prisma schema; ownership convention changes — owner is the tool).
- Components: `src/components/tiers/` → `src/components/tools/sales/subscription-offering/`. `src/components/subscriptions/` consolidates (becomes homonym of the residual subscriptions block).
- API: `api/tiers/` → `api/subscription-offering/`. `api/subscriptions/` for real subscriptions.
- subscription-offering tool with `BlockConnection[]` consuming products (catalog), services (catalog), agents (access control via tier).
- Marketplace.composer can reference the subscription-offering tool in sections (item-detail-resolver updated).

### Pre-condition

R1 (tools foundation) and ideally R4 (campaigns convergence) already closed. R5 is the second case of creating a new tool (after campaigns convergence in R4).

## Operations

- Workflow to create a new tier: goes to `/admin/tools/sales/subscription-offering/`.
- Workflow to manage a real subscription (cancel, pause, see payment status): stays in `/admin/blocks/subscriptions/`.
- URL migration: redirects from `/admin/blocks/tiers/` → `/admin/tools/sales/subscription-offering/`.
- i18n keys: `tiers.*` namespace migrates to `subscriptionOffering.*` (or similar — decision during execution).

## Glossary

- **Subscription**: real customer record (who subscribes to what, status, billing). Residual block.
- **SubscriptionTier**: offering structure — sellable plan/tier definition. Conceptual owner is the subscription-offering tool.
- **subscription-offering**: tool in sales that defines + sells tiers. Composes products + services + agents.
- **BillingCycle**: billing cycle (monthly, annual, etc.). Attribute of the real subscription.
- **SubscriptionStatus**: states (ACTIVE, PAUSED, CANCELLED, PAST_DUE, TRIAL).
- **Tier access**: matrix of which agents/features are accessible at each tier.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R5. Most complex stage of the post-R1.5 refactor.
