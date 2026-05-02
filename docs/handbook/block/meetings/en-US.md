---
title: Meetings
description: Customer meetings — discovery, demos, support. Syncs with external calendars.
locale: en-US
uid: herd.block.meetings
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Meetings

The Meetings block represents customer interactions on a calendar — sales calls, support sessions, internal syncs. Each meeting links to one or more contacts, optionally to deals, and synchronizes with external calendar providers (Google, Microsoft, etc.) via the integrations layer. Meetings are the most common time-bound artifact tracked in HERD's commercial workflow.

## Business

Meetings are where commercial relationships move forward. Every deal that closes passes through meetings; every customer who churns has a meeting history that can be analyzed. Tracking meetings in HERD — rather than only in calendar tools — keeps the customer relationship coherent across systems and accessible to agents (sales reps, AI orchestrator) without context-switching.

<!-- TODO: 2-3 more paragraphs on commercial signal: meeting frequency as health indicator, time-to-first-meeting as funnel metric, meeting outcomes as deal predictor. -->

## Product

<!-- TODO: How users schedule, conduct, document meetings inside HERD. Calendar view, meeting detail, contact linking, notes capture, follow-up automation. -->

## Architecture

The Meetings block owns the `Meeting` Prisma model and exposes CRUD via REST endpoints under `src/app/api/meetings/`. UI surfaces live in `src/components/meetings/` and `src/app/admin/blocks/meetings/`. The block manifest at `src/lib/blocks/blocks/meetings.block.ts` declares capabilities for the chat orchestrator.

Meetings consume contacts (every meeting must link to at least one contact) and consume `google-calendar` for synchronization with Google Calendar (other calendar integrations follow the same pattern). The `google-calendar` integration is documented separately as a `level: integration` entry; today its `feature.yml` does not yet exist, so the cross-reference is registered in the strangler-fig allowlist (`docs/handbook/_meta/.legacy-allowlist.txt`).

The block exposes one block-group day-1: `discovery-calls`, a curated view of meetings flagged as first-contact prospect conversations.

<!-- TODO: 2-3 more paragraphs on schema details, calendar sync semantics, conflict resolution when calendar and HERD disagree, recurrence handling. -->

## Operations

<!-- TODO: Conventions for working with meetings: timezone handling, calendar sync edge cases, how meetings interact with the chat orchestrator's scheduling logic. -->

## Glossary

<!-- TODO: Local glossary of meetings-specific terms (e.g., "discovery call", "demo", "QBR", "no-show"). -->

## Changelog

- **2026-05-01** — Initial publication. Block exemplar in the Handbook Foundation etapa. Demonstrates strangler-fig allowlist via dangling reference to `google-calendar` integration.
