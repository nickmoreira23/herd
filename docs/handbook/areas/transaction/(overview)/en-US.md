---
title: Transaction
description: Commercial transactions. Customer-facing tools to sell, buy, and exchange value.
locale: en-US
uid: herd.category.areas.transaction
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Transaction

Area grouping **commercial transaction** tools — surfaces where value is sold, bought, and exchanged.

## Business

Transaction is the "front of house" of the product: public storefronts, checkouts, marketplaces. Tools in this area are predominantly customer-facing.

## Product

Tools in this area appear on the `/admin/areas` landing page grouped under "Transaction". In R2 it contains Marketplace — it may grow to include standalone checkout, billing-portal.

## Architecture

Marketplace is the only tool in this area in R2. It composes products, services, subscriptions, packages blocks.

## Operations

Adding a tool: register in `areaRegistry` (already present), create a handbook entry at `docs/handbook/areas/transaction/{tool}/feature.yml`.

## Glossary

- **Transaction area**: macro-division for customer-facing commercial-exchange tools.

## Changelog

- **2026-05-03 (R2)** — Area created. Contains Marketplace.
