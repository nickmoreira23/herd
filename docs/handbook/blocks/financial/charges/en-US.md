---
title: Charges
description: Charge events from the provider, splittable across multiple subscriptions via ChargeLineItem (N:N junction).
locale: en-US
uid: herd.block.financial.charges
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Charges

`Charge` is a single charge event in the provider: one customer, one moment in time, one money amount. The status field uses the canonical `ChargeStatus` enum (8 values, normalized across providers) so dashboards don't have to know that Recharge says `success` while another provider might say `paid`. Failed charges feed into `DunningAttempt` rows.

## Business

A charge is "we tried to take money on this date for this amount". For composite charges — one customer pays for three subscriptions in a single transaction — the row in `charges` is the parent, and three rows in `charge_line_items` split the amount per subscription. This is the core reason `ChargeLineItem` exists as N:N (one charge ↔ multiple subscriptions).

## Product

- `amount_cents` is `INTEGER` storing the smallest currency unit; never use floats for money in this layer.
- `status` is `ChargeStatus` enum: `QUEUED, PENDING, SUCCESS, FAILED, REFUNDED, PARTIALLY_REFUNDED, SKIPPED, CANCELLED`.
- `processed_at` set on success; `failed_at` + `failure_reason` set on failure. Both timestamps and the status field move in lockstep so consumers can filter on either dimension.
- Related entities:
  - `Invoice` — issued PDF / invoice document for a charge.
  - `Refund` — partial or full refund (multiple refunds per charge possible).
  - `DunningAttempt` — retry attempts on a failed charge.

### ChargeLineItem (N:N junction)

When Recharge bills one customer for three concurrent subscriptions in a single transaction, the wire shape is **one charge with three line items**. The platform mirrors that:

```
Charge (id=X, amount_cents=12000)
  ├─ ChargeLineItem (charge_id=X, subscription_id=A, amount_cents=4000)
  ├─ ChargeLineItem (charge_id=X, subscription_id=B, amount_cents=5000)
  └─ ChargeLineItem (charge_id=X, subscription_id=C, amount_cents=3000)
```

Without the junction we'd have to either (a) duplicate charges per subscription — wrong total per customer — or (b) lose per-subscription attribution — wrong per-tier revenue. The junction makes both shapes correct simultaneously. UNIQUE `(charge_id, subscription_id)` prevents duplicate line items for the same pair.

`ChargeLineItem` has no `external_id` or `provider_id` of its own — the line item is an internal split, not a provider entity in its own right. The line item inherits provider context from the parent charge.

## Architecture

Tenant-scoped. FK chain:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE`
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT`
- `customer_id` → `billing_customers(id)` `ON DELETE CASCADE`
- `payment_method_id` → `payment_methods(id)` `ON DELETE SET NULL`

`ChargeLineItem` cascades from both `charges` and `subscriptions` (deleting either cleans up the junction). Status column has its own index for fast "all failed charges this week" queries.

Integration with the Ledger primitives (`Account` / `JournalEntry` / `JournalLine`) is **Camada 3**, intentionally out of scope. The hook will be `JournalEntry.sourceKind = 'charge'` with `sourceId = charges.id`.

## Operations

- All charges for a customer this month: `WHERE customer_id = ? AND processed_at >= ?`.
- Failed charges that need retry: `WHERE status = 'FAILED' AND failed_at < ?`.
- Per-tier revenue: join `charges` → `charge_line_items` → `subscriptions` and sum `amount_cents` by `subscriptions.tier_id`.
- Refund accounting: sum `refunds.amount_cents WHERE charge_id = ?`; compare against `charges.amount_cents` to detect `PARTIALLY_REFUNDED` vs `REFUNDED`.

## Glossary

- **Charge**: a single charge event in the provider.
- **ChargeLineItem**: row that splits a composite charge across the subscriptions it covers (junction N:N).
- **DunningAttempt**: retry of a failed charge, tracked per attempt with an outcome.

## Changelog

- **2026-05-19** — Initial publication (Sub-etapa 9, Payment Provider Layer).
