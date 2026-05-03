---
title: Notification
description: Notification center. Centralizes alerts, reminders, and event-driven communications.
locale: en-US
uid: herd.category.areas.notification
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Notification

Area grouping **notification tools** — alerts, reminders, event-driven communications.

## Business

Notification is the system's event-driven outbound channel. Unlike Communication (bidirectional conversation) or Workflow (internal operations), Notification is unidirectional system → user.

## Product

In R2 this area is a placeholder — no tools are landed yet. It will appear at `/admin/areas` but empty until the first notification tool is introduced.

## Architecture

No tools in R2. When the first notification tool exists (e.g. alerts-center, digest-builder), it will be registered in `areaRegistry` and gain a handbook entry here.

## Operations

To introduce the first tool: create the manifest, register in `areaRegistry` (which already reserves the area), create handbook entry at `docs/handbook/areas/notification/{tool}/feature.yml`.

## Glossary

- **Notification area**: macro-division for unidirectional, event-driven system → user communication tools.

## Changelog

- **2026-05-03 (R2)** — Area created as placeholder. No tools in R2.
