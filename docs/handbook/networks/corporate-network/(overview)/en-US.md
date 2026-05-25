---
title: Corporate Network
description: A company's internal network — organization, channels, profiles, departments, permissions.
locale: en-US
uid: herd.category.networks.corporate-network
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Corporate Network

The Corporate Network is ComeçaAI's internal representation of a specific company. It includes the organizational structure, internal communication channels, user profiles, departments, and permissions. Every company that uses ComeçaAI operates within its own Corporate Network with strict data isolation.

## Business

The Corporate Network is ComeçaAI's primary tenant-isolation boundary. When a customer adopts ComeçaAI, what they get is a Corporate Network: a private space for their internal structure, with its own users, channels, departments, and permissions. No data crosses Corporate Network boundaries except through explicit Market Network mechanisms.

This isolation matters commercially: customers expect their internal data — who works there, which department someone belongs to, what permissions they have — to be theirs alone. The Corporate Network is the container that guarantees that contract. It is also the unit on which billing, support tickets, and configuration are scoped.

<!-- TODO: 2-3 more paragraphs on the strategic value of Corporate-Network-as-tenant: how multi-tenant onboarding works, how customizations are scoped per Corporate Network, how reporting respects the boundary. -->

## Product

<!-- TODO: How users (admins, members) interact with Corporate Network surfaces in ComeçaAI's admin UI. /admin/organization, /admin/network, profile editor, channel management. -->

## Architecture

Features that compose the Corporate Network — organization profile, departments, profiles (people), channels, permissions — will be documented as individual features within this category as the backfill etapa proceeds. Today, those features exist as code under `src/app/admin/organization/` and `src/app/admin/network/`, but their Handbook entries are pending.

Each feature inside this category declares `parent: herd.category.networks.corporate-network` in its `feature.yml`. The Handbook graph validator enforces that this parent exists and is a category. UID format for features inside this category: `herd.{level}.corporate-network.{feature-id}`.

<!-- TODO: 2-3 more paragraphs on architectural implications: how RLS policies enforce tenant isolation at the database layer, how the chat orchestrator scopes queries by Corporate Network, how cross-network references (e.g., from Market Network back to Corporate Network) are modeled. -->

## Operations

<!-- TODO: Conventions for working with Corporate Network features: when to extend an existing feature vs. create a new one, how user permissions are layered (role + department + custom), how to handle multi-Corporate-Network admins. -->

## Glossary

<!-- TODO: Local glossary of Corporate-Network-specific terms (Corporate Network, tenant, profile, channel, department, permission, role, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Category overview created during Handbook UI Sub-etapa 1.5.
