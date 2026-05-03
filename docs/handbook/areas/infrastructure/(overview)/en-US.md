---
title: Infrastructure
description: Under-the-hood platform infrastructure. Tools that document, configure, or operate the platform.
locale: en-US
uid: herd.category.areas.infrastructure
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Infrastructure

Area grouping **platform infrastructure** tools — documentation, configuration, observability.

## Business

Infrastructure is the "below the waterline" of the product: invisible in normal flow but critical for operation. Handbook, domain-events, ledger (partly) live here or touch it.

## Product

Tools in this area appear at `/admin/areas` under "Infrastructure". In R2 it contains Handbook as the entry point for documentation.

## Architecture

Handbook is the bilingual reader for `docs/handbook/` entries. Other infrastructure tools (domain-events, ledger) live in the `tools/` layer but keep a semantic relation to this area.

## Operations

Adding a tool: register in `areaRegistry`, create an entry at `docs/handbook/areas/infrastructure/{tool}/feature.yml`.

## Glossary

- **Infrastructure area**: macro-division for platform tools (docs, observability, config) invisible in the normal product flow.

## Changelog

- **2026-05-03 (R2)** — Area created. Contains Handbook.
