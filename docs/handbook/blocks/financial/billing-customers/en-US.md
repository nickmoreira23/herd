---
title: Billing Customers
description: Local mirror of customers from the payment provider, optionally linked to a platform member via MemberConnection.
locale: en-US
uid: herd.block.financial.billing-customers
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Billing Customers

`BillingCustomer` is the platform's local mirror of a customer record held by a payment provider (Recharge, Stripe in the future, etc.). Every charge, subscription, and payment method ultimately references a `BillingCustomer`. The customer may or may not be linked to a platform member yet — the optional `memberConnectionId` FK closes that loop when the link becomes known.

## Business

A billing customer is "the buyer-side identity at the provider". For Recharge this is the Shopify customer who subscribed; for a future Stripe-direct flow it would be the Stripe Customer object. The platform keeps a thin shadow row (`email`, `name`, `provider_data` raw) so we can answer "who paid?" without round-tripping the provider on every read.

## Product

- One billing customer per `(provider_id, external_id)` pair — uniqueness enforced at the DB.
- `memberConnectionId` is nullable: a customer can exist before they're linked to a platform member (e.g. the email matched but the OAuth handshake hasn't happened), and the link is set when discovery resolves it.
- Updating a customer is provider-driven: webhooks from the provider trigger upserts based on the external ID.

## Architecture

Tenant-scoped table (`tenant_id NOT NULL`, RLS strict policy `billing_customers_tenant_isolation`). FK chain:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE` — closing a tenant cascades to all billing data.
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT` — providers are deliberately removed; never as a side-effect.
- `member_connection_id` → `member_connections(id)` `ON DELETE SET NULL` — disconnecting a member leaves the customer record intact (we still need to attribute past charges).

`provider_data JSONB` holds the raw provider payload — never trust normalized columns alone for replay or audit.

## Operations

- Lookup by provider external ID: `SELECT * FROM billing_customers WHERE provider_id = ? AND external_id = ?` (covered by the unique index).
- Reverse-link from a member: `SELECT * FROM billing_customers WHERE member_connection_id = ?` (covered by `billing_customers_member_connection_idx`).
- Re-linking after manual reconciliation: update `member_connection_id` directly.

## Glossary

- **Billing customer**: the platform's local mirror of a customer record held by the payment provider.
- **External ID**: the customer's identifier in the provider's namespace (e.g. Recharge customer ID).

## Changelog

- **2026-05-19** — Initial publication (Sub-etapa 9, Payment Provider Layer).
