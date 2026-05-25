---
title: Contacts
description: Single source of truth for people in ComeçaAI — leads, customers, partners, employees.
locale: en-US
uid: herd.block.miscellaneous.contacts
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Contacts

The Contacts block is ComeçaAI's single source of truth for people. Every individual the platform tracks — leads, customers, partners, employees — is a Contact, with a stable identity that persists across deals, meetings, and campaigns. Contacts are the most-consumed block in ComeçaAI; nearly every tool reads from this block, and several blocks (meetings, deals, campaigns) link back to it.

## Business

Knowing who a person is, what they care about, and what touchpoints they've had with the company is the foundation of any commercial relationship. Contacts as a single source of truth eliminates the silent drift that happens when the same person exists with slightly different attributes in CRM, email tool, calendar, and support inbox.

<!-- TODO: 2-3 more paragraphs on commercial value: lifecycle implications, lead qualification economics, retention insights. -->

## Product

<!-- TODO: How users (sales, marketing, support) interact with contacts in ComeçaAI's admin UI. List/detail views, filters, segmentation by lifecycle stage, integration with related blocks. -->

## Architecture

The Contacts block owns the `Contact` Prisma model and exposes CRUD via REST endpoints under `src/app/api/contacts/`. UI surfaces live in `src/components/contacts/` and `src/app/admin/blocks/contacts/`. The block manifest at `src/lib/blocks/blocks/contacts.block.ts` declares the block's capabilities to ComeçaAI's chat orchestrator (search via DataProviders, action execution).

The block exposes one block-group day-1: `leads`, a curated view of contacts in early-stage commercial qualification. Block-groups are intra-block — they share the same Prisma model and CRUD endpoints as the parent block, with semantic tagging or filtering applied.

<!-- TODO: 2-3 more paragraphs on schema details, indexes, RLS policies, lifecycle states, integration boundaries with meetings/deals. -->

## Operations

<!-- TODO: Conventions specific to working with contacts: validation rules, deduplication strategy, merge semantics, how to handle GDPR/LGPD data subject requests. -->

## Glossary

<!-- TODO: Local glossary of contacts-specific terms (e.g., "lead", "MQL", "SQL", "lifecycle stage"). -->

## Changelog

- **2026-05-01** — Initial publication. Block exemplar in the Handbook Foundation etapa.
