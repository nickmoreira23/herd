---
title: Communication
description: Communication between people in the system. Tools that enable conversation, messaging, and human-human or human-agent interaction.
locale: en-US
uid: herd.category.areas.communication
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Communication

Area grouping tools for **communication between people and agents** inside the system.

## Business

Communication is the primary human interface of the product. Tools in this area enable synchronous/asynchronous conversation, structured messaging, and AI agent interaction. It is where value is exchanged verbally.

## Product

Tools in this area appear on the `/admin/areas` landing page grouped under "Communication". In R2 it contains only Chat — it may grow to include messaging, voice, video.

## Architecture

Area with fixed sortOrder in the `areaRegistry` (`src/lib/core/registry.ts`). Tools in this area carry `area: "communication"` in their manifest.

## Operations

Adding a tool: register in `areaRegistry` if not present, create a handbook entry at `docs/handbook/areas/communication/{tool}/feature.yml`.

## Glossary

- **Communication area**: macro-division for human-human and human-agent interaction tools.

## Changelog

- **2026-05-03 (R2)** — Area created. Contains Chat.
