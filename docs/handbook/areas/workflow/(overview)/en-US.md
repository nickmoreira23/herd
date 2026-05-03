---
title: Workflow
description: Operational workflow hub. Internal tools to manage day-to-day work.
locale: en-US
uid: herd.category.areas.workflow
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Workflow

Area grouping the **operational center of the product** — internal tools to manage day-to-day work across finance, sales, legal, milestones, dashboards.

## Business

Workflow is the "back of house": where the internal team operates the product. It's not customer-facing — it's admin-facing. Dashboards, finance ops, sales ops, legal ops live here.

## Product

Tools in this area appear at `/admin/areas` under "Workflow". In R2 it contains Dashboard as the unified operational entry point.

## Architecture

Dashboard aggregates key metrics from operational blocks (products, subscriptions, partners, financial snapshots). Tools like financial (ledger), sales-ops, legal-ops live in the `tools/` layer but their operational entry point is Workflow.

## Operations

Adding a tool: register in `areaRegistry`, create handbook entry at `docs/handbook/areas/workflow/{tool}/feature.yml`.

## Glossary

- **Workflow area**: macro-division for admin-facing day-to-day operations tools.

## Changelog

- **2026-05-03 (R2)** — Area created. Contains Dashboard.
