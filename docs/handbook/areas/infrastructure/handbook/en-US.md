---
title: Handbook
description: Documentation system reader. Renders bilingual entries with cross-references and glossary.
locale: en-US
uid: herd.tool.infrastructure.handbook
---

> **For AI agents:** This Markdown file is the canonical form of this entry.

# Handbook

Reader tool for the documentation system. Reads entries from `docs/handbook/` and renders them in a navigable UI.

## Business

Handbook is the product's source of truth. The reader serves that truth to operators in a clear, bilingual UI (pt-BR / en-US) with cross-refs and diagrams.

## Product

Accessible at `/admin/handbook`. Hierarchy navigation (layer → category → feature). Global glossary generated from per-entry glossaries.

## Architecture

Source: `docs/handbook/**/{pt-BR,en-US}.md` + `feature.yml`. Index generated via `npm run gen:all` (xrefmap, search-index, glossary). Renderer: Mermaid, semantic headings, locale switch.

## Operations

Adding an entry: `npm run gen:feature` or create `feature.yml` + bilingual md manually. After changes: `npm run gen:all` + `npm run validate:handbook`.

## Glossary

- **Entry**: a `feature.yml` + `{pt-BR,en-US}.md` pair documenting a feature/category/layer.
- **xrefmap**: generated index of cross-references between entries.

## Changelog

- **2026-05-03 (R2)** — Handbook entry created for the Handbook reader in the Infrastructure area. (Distinct from `herd.meta.handbook`, which documents the doc system itself.)
