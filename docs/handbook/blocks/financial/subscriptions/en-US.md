---
title: Subscriptions
description: Active link between a BillingCustomer and a plan. Optionally connected to the platform's SubscriptionTier catalog.
locale: en-US
uid: herd.block.financial.subscriptions
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Subscriptions

`Subscription` represents an active billing relationship: a `BillingCustomer` subscribing to a plan in the provider. It is the source of truth for "who has what plan, right now". Each row optionally links to a platform `SubscriptionTier` row (when the provider plan maps to a known catalog tier) and to a `PaymentMethod` (the instrument that will be charged at the next cycle).

## Business

A subscription is "the customer is on this plan and we expect to bill them again on this date". The `status` field captures lifecycle (`active`, `paused`, `cancelled`, `expired`, etc.) and `next_charge_at` is the operational date used by dashboards and dunning logic. Cancellation is recorded by `cancelled_at` (timestamp) AND `status` change — both signals exist because legacy data can lose one or the other.

## Product

- `customer_id` is required: a subscription always has a buyer.
- `payment_method_id` is nullable: a subscription can lose its method (card expired, customer removed) without itself being cancelled.
- `tier_id` is nullable: a provider plan may not be reflected in the platform catalog (off-menu offer, legacy plan, custom enterprise pricing).
- Side concepts:
  - **PortalSession** — a short-lived URL handing the customer to the provider's hosted billing UI to manage the subscription.
  - **BillingEvent** — internal audit log capturing state transitions on this subscription (e.g. `subscription.paused`).

## Architecture

Tenant-scoped. FK chain:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE`
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT`
- `customer_id` → `billing_customers(id)` `ON DELETE CASCADE` — when the customer is removed, the subscription record is removed with it.
- `payment_method_id` → `payment_methods(id)` `ON DELETE SET NULL`
- `tier_id` → `SubscriptionTier(id)` `ON DELETE SET NULL`

Indexes on `tenant_id`, `customer_id`, `tier_id`, `status`. UNIQUE `(provider_id, external_id)` enforces one mirror row per provider subscription.

## Operations

- Find a customer's active subscriptions: `WHERE customer_id = ? AND status = 'active'`.
- Audit a status change: cross-reference `billing_events` rows with `entity_type = 'subscription'` and `entity_id` matching the subscription.
- Re-link a subscription's payment method after a card update: provider webhook updates `payment_methods` first; the subscription's `payment_method_id` follows in a subsequent webhook (provider-driven sequence).

## Glossary

- **Subscription**: an active billing relationship in the provider mirrored locally.
- **PortalSession**: short-lived URL to the provider's hosted billing UI.
- **BillingEvent**: internal audit log row capturing a state transition.

## Changelog

- **2026-05-19** — Initial publication (Sub-etapa 9, Payment Provider Layer).
