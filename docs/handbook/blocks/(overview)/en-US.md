---
title: Blocks
description: Layer that organizes data blocks by nature — identity, media, time, commercial, financial.
locale: en-US
uid: herd.layer.blocks
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Blocks

The Blocks layer is HERD's foundation for **data primitives** — entities the platform tracks with stable identities and CRUD semantics. Contacts, Meetings, Deals, Documents, Images: each is a Block. Blocks are the most-consumed primitives in HERD; tools and solutions read and write to blocks constantly.

## Business

A Block is the atomic unit of *what HERD knows*. While Tools execute and Solutions deliver value, Blocks are *the data*. Every commercial interaction either creates new Block instances (a new Contact, a new Meeting, a new Deal) or modifies existing ones (Contact lifecycle changes, Deal stage progression).

Blocks are categorized by **data nature** — Identity (contacts, profiles), Media (documents, images, videos), Time (meetings, scheduling), Commercial (deals, pipelines), Financial (invoices, payments). This taxonomy organizes the data model in a way that humans and AI agents can navigate intuitively.

<!-- TODO: 2-3 more paragraphs on the strategic value of stable block identities, how lifecycle stages on blocks drive commercial workflows, how block ownership and access control work. -->

## Product

<!-- TODO: How users (sales, marketing, support, admins) interact with blocks in HERD's admin UI. List/detail views per block type, filters and segmentation, bulk operations, related-block navigation. -->

## Architecture

The Blocks layer in the Handbook organizes documentation hierarchically. Block categories are introduced lazily — created when the first block of a given category is documented. Day-1 the Blocks layer has one category, `miscellaneous`, which holds blocks (`contacts`, `meetings`) that have not yet been classified into their final category. The miscellaneous category will shrink as the backfill etapa proceeds.

Each Block in HERD owns a Prisma model and exposes CRUD via REST endpoints. Blocks support cross-references via `consumes` and `consumed_by` in the Handbook graph: a Meeting consumes a Contact (every meeting must link to at least one contact), and a Contact is consumed_by Meetings (referenced from many meetings).

<!-- TODO: 2-3 more paragraphs on architectural implications: how Block schemas are versioned, how RLS policies are uniform across blocks, how block-groups (intra-block organization, e.g. contacts.leads) work. -->

## Operations

<!-- TODO: Conventions for working with Blocks: when to introduce a new Block vs. extend an existing one with a block-group, deduplication strategies, GDPR/LGPD handling per block category. -->

## Glossary

<!-- TODO: Local glossary of Block-specific terms (Block, block-group, lifecycle, primary identity, foreign reference, soft delete, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Layer overview created during Handbook UI Sub-etapa 1.5.
