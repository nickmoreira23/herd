---
title: Identity
description: Identity and knowledge area. Tools that manage who is in the system and what it knows.
locale: en-US
uid: herd.category.areas.identity
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Identity

Area grouping **identity and knowledge** tools — who is in the system and what it knows.

## Business

Identity is the cognitive foundation of the product: directory of people/orgs, knowledge base. Without identity there's no context; without knowledge there's no intelligence.

## Product

Tools in this area appear at `/admin/areas` under "Identity". In R2 it contains Knowledge and Network.

## Architecture

- **Network**: provisional in R2. Will be split into Organization + Directory in R2.5.
- **Knowledge**: meta-tool composing 9 first-class blocks (documents, images, videos, audios, tables, forms, links, feeds, apps).

## Operations

Adding a tool: register in `areaRegistry`, create an entry at `docs/handbook/areas/identity/{tool}/feature.yml`.

## Glossary

- **Identity area**: macro-division for who (Network/Directory) and what is known (Knowledge) tools.

## Changelog

- **2026-05-03 (R2)** — Area created. Contains Knowledge, Network.
