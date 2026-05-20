---
title: Organization
description: Institutional structure — brand kit, departments, locations, business hours, org chart, and member directory. The "company as a whole" view.
locale: en-US
uid: herd.tool.identity.organization
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or add `.md` to the URL to avoid HTML rendering.

# Organization

Standalone tool that concentrates the **institutional structure** of the user's business: brand kit, departments, physical locations, business hours, organizational hierarchy, and member directory. It is the "company as a whole" view — operating at the entity level, not the individual.

## Business

Organization exists because every operation needs a canonical place to answer "where is the company, what is it called, how does it present itself, and who works there". Without a dedicated tool, this metadata gets scattered (logo in one place, departments in another, hours in a third) and diverges over time.

The primary audience is the **platform administrator** configuring the company for the first time or adjusting metadata over time. Secondary audience: other tools that **consume** companies/contacts for their own purposes (marketplace uses company metadata in listings, chat uses the member directory to identify participants, etc.).

Organization's natural pair is `profileTool` — Organization handles "the company", Profile handles "me as an individual within it". They share `area: identity` but have distinct scopes.

## Product

Interface accessible at `/admin/organization`. Sub-routes:

- `/admin/organization/brand-kit` — visual identity (logos, colors, typography)
- `/admin/organization/departments` — company departments
- `/admin/organization/users` — member directory
- `/admin/organization/org-chart` — hierarchical visualization
- `/admin/organization/network-map` — relationship mapping
- `/admin/organization/profile` — the organization's institutional profile (identity form)

Blocks consumed:

- `companies` (read-write) — institutional metadata, departments, locations
- `contacts` (read) — member directory

No actions exposed to the orchestrator today. Direct manipulation via UI.

## Architecture

Standalone tool declared in `src/lib/tools/tools/organization.tool.ts`. Registered in `src/lib/tools/registry.ts` under the `standaloneTools` map with key `organization`. Area `identity`. `hasSubRoutes: true`. Icon `Building2`, color `#a855f7`.

Components in `src/components/organization/`: 14 files covering forms (brand-kit, business-hours, contact-info, general-info, locations, regional-settings), visualizations (org-chart-canvas, network-map-canvas), and member management (user-table, user-columns).

`actions: []` — no orchestration via `execute_action` at the moment. Editing is via direct UI.

## Operations

No cron, worker, or pipeline associated with Organization. Metadata changes propagate to other tools consuming the `companies` block on next read.

When a tenant is provisioned, Organization is initialized with defaults (empty brand kit, no departments) and the administrator fills it in progressively.

## Glossary

- **Brand kit:** visual identity assets (logos, colors, typography) configured centrally.
- **Org chart:** hierarchical representation of roles and reporting relationships.
- **Network map:** visual representation of relationships between members and entities (departments, locations).

## Changelog

- **2026-05-20 (Sub-etapa 3.7):** created as a split from `networkTool` (which was deleted). Separated from `profile` to distinguish institutional identity ("the company") from personal identity ("me as an individual").
