---
title: Integration Model
description: Conceptual architecture of ComeçaAI integrations — horizontal vs. vertical axis and shallow vs. deep axis.
locale: en-US
uid: herd.category.integrations.integration-model
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Integration Model

All external connections in ComeçaAI are integrations. There is no secondary concept ("connector", "extension", "plugin") — one umbrella, one code root (`src/lib/integrations/`), one admin surface (`/admin/integrations`). The integration model describes how integrations are organized and why.

## Business

Integrations give ComeçaAI's operators access to the tools they already use. Recharge for subscriptions, Gorgias for support, Slack for notifications, Zoom for meetings. Rather than rebuild what those systems do, ComeçaAI connects to them via standard protocols (OAuth, webhooks, REST APIs).

The integration catalog is bounded by purpose, not by vendor count. ComeçaAI expects to maintain dozens of integrations across its lifetime — not hundreds. Each integration carries a real maintenance cost: credential management, OAuth token rotation, webhook signature validation, API version drift. Adding an integration is an architectural commitment, not a configuration entry.

## Product

From an operator's perspective, an integration is something they enable once, configure minimally, and then forget. The admin UI at `/admin/integrations` lists available integrations by category, shows connection status, and surfaces any sync errors. OAuth-based integrations take the operator through a standard consent flow; API-token integrations ask for a key that ComeçaAI stores encrypted.

Once connected, an integration may run silently in the background (syncing subscriptions, routing webhooks) or expose active-use surfaces (browsing Gorgias tickets, pulling Zoom recordings). The depth of that experience depends on the integration's depth — see Architecture.

## Architecture

ComeçaAI's integration architecture has two independent axes.

### Axis 1 — Horizontal vs. Vertical

**Horizontal** (the default) means the integration lives in `src/lib/integrations/` and shares the same infra as every other integration: OAuth flows, token storage in `MemberConnection`, webhook ingestion in `IntegrationWebhookEvent`, credential encryption, sync logs in `IntegrationSyncLog`. Horizontal integrations vary only in their API client and, for deeper ones, their webhook handlers.

**Vertical** means the integration gets its own domain-level sub-system when the business rules of its category justify structural separation. Payment is the first vertical: subscriptions, billing events, tier mapping, and charge reconciliation follow rules that don't apply to any other category. A vertical is a *category* of integrations with shared domain semantics — not simply a deep integration.

Vertical integrations are rare. The criterion is "do integrations of this type share domain rules that require their own models, services, or invariants?" Two or three verticals are realistic on a two-year horizon.

### Axis 2 — Shallow vs. Deep

**Shallow** integrations implement OAuth authorization and read-only API calls. They connect, retrieve data when asked, and disconnect cleanly. Most social, analytics, and AI-model integrations are shallow by design.

**Deep** integrations add write operations, inbound webhooks, state synchronization, webhook signature validation, and deduplication. They maintain ongoing state (tokens that expire, events that must be processed exactly once, sync cursors). Deep integrations require more operational surface: monitoring for token expiry, retry handling for failed webhook deliveries, and auditable sync logs.

### The Two-Axis Matrix

| | Horizontal | Vertical |
|---|---|---|
| **Shallow** | Most integrations — OAuth + read. Examples: Instagram, YouTube, Mixpanel, ElevenLabs. | Hypothetical — a vertical category whose integrations only read. Unlikely in practice. |
| **Deep** | Deep horizontal — full lifecycle but shared infra. Examples: Gorgias (support tickets + webhooks), Slack (read + write + notifications), Zoom (meetings + recordings). | Deep vertical — own domain models + shared infra overridden. Example: Payment (Recharge — subscriptions + webhooks + tier mapping + charge reconciliation). |

Axis 1 (horizontal/vertical) is a question of *domain model complexity*. Axis 2 (shallow/deep) is a question of *protocol complexity*. They are orthogonal: being deep does not make an integration vertical.

### Code Organization

```
src/lib/integrations/          ← horizontal shared infra (future home)
src/lib/services/recharge.ts   ← recharge API client (deep, vertical — payment)
src/lib/services/gorgias.ts    ← gorgias API client (deep, horizontal — support)
src/lib/services/intercom.ts   ← intercom API client (deep, horizontal — support)
src/app/api/integrations/      ← admin CRUD + per-integration REST routes
src/app/api/webhooks/          ← inbound webhook receivers (gorgias, intercom, recharge)
src/app/api/integrations/oauth/ ← OAuth authorization + callback
```

For tenancy conventions (how each call site resolves the current organization), see the `AGENTS.md` Tenancy section.

## Operations

Adding a new integration: decide axis 1 (horizontal or, if category rules justify it, a new vertical) and axis 2 (shallow or deep). Shallow horizontal integrations require an API client in `src/lib/services/`, routes under `src/app/api/integrations/{slug}/`, and an overview component in `src/components/integrations/overviews/`. Deep integrations additionally require a webhook receiver under `src/app/api/webhooks/{slug}/`, signature validation middleware, and sync log instrumentation.

Retiring an integration: set `status` to `DISABLED` in the database, revoke the platform credentials, and archive the corresponding code. Do not delete webhook receivers until all pending events have drained.

## Glossary

- **Integration**: A connection between ComeçaAI and a specific external service, identified by a `slug` (e.g., `recharge`, `gorgias`, `zoom`).
- **Shallow integration**: OAuth + read-only API calls. No inbound webhooks or state synchronization.
- **Deep integration**: OAuth + read/write + inbound webhooks + state synchronization + signature validation + deduplication.
- **Horizontal integration**: Uses the shared integration infra (token store, webhook table, sync logs) without domain-specific models.
- **Vertical integration**: A category of integrations that shares domain-level business rules requiring its own models or invariants (e.g., Payment).
- **MemberConnection**: Per-profile record storing OAuth tokens for integrations that support personal connections.
- **IntegrationWebhookEvent**: Raw inbound webhook payload stored before processing, enabling replay and audit.

## Changelog

- **2026-05-11** — Initial publication. Integration model entry created during Camada 1 (Integration & Payment Foundation) discovery.
