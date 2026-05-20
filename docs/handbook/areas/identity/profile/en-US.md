---
title: Profile
description: Personal user profile — identity, avatar, preferences, locale, and account settings. The "me as an individual" view.
locale: en-US
uid: herd.tool.identity.profile
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or add `.md` to the URL to avoid HTML rendering.

# Profile

Standalone tool covering the **personal identity** of the authenticated user: first name, last name, email, avatar, locale, and account preferences. It is the "me as an individual" view — operating at the person level, not the company.

## Business

Profile addresses the basic need for each user to have a canonical place for their identity. Without it, personal data hides in opaque "Settings" sub-routes or mixes with organization configuration (which belongs to `organizationTool`, not Profile).

The audience is the **individual user** — first access (fill in basic data), updates over time (photo, locale, preferences), and credential management. This is not an administrative tool; each user only sees their own Profile.

Profile's natural pair is `organizationTool` — Profile handles "me as an individual", Organization handles "the company I am in". Both share `area: identity` but resolve distinct needs.

## Product

Interface accessible at `/admin/profile`. Single page today (no sub-routes) — `hasSubRoutes: false` in the manifest. When preferences and settings grow, sub-routes will be added.

Blocks consumed:

- `contacts` (read-write) — persists the user's own `NetworkProfile` record

No actions exposed to the orchestrator. Editing happens via a dedicated form (`profile-client.tsx`).

## Architecture

Standalone tool declared in `src/lib/tools/tools/profile.tool.ts`. Registered in `src/lib/tools/registry.ts` under the `standaloneTools` map with key `profile`. Area `identity`. `hasSubRoutes: false`. Icon `User`, color `#06b6d4` (cyan, distinguishing it from Organization's purple).

Single component today: `src/components/profile/profile-client.tsx`. The page `src/app/admin/profile/page.tsx` is an RSC that loads the authenticated user's `NetworkProfile` and passes it to the client.

`actions: []` — no orchestration via `execute_action`.

## Operations

No cron, worker, or pipeline. Profile changes write directly to `NetworkProfile` via a traditional API. Locale persistence is dual (cookie + DB) — see the "Locale persistence" section in `AGENTS.md`.

## Glossary

- **NetworkProfile:** Prisma model representing a user in the system. In Layer 1, there is a 1:1 `NetworkProfile : Organization` mapping.
- **Avatar:** profile image, stored in `NetworkProfile.avatarUrl`.

## Changelog

- **2026-05-20 (Sub-etapa 3.7):** created as a split from `networkTool` (which was deleted). Separated from `organization` to distinguish personal identity from institutional identity.
