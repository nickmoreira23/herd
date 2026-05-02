---
title: Miscellaneous
description: Blocks not yet classified into a specific category — temporary accommodation, debt to resolve during backfill.
locale: en-US
uid: herd.category.blocks.miscellaneous
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Miscellaneous

The Miscellaneous category exists to host blocks that have not yet been classified into a specific category. It is a temporary accommodation, and blocks that live here are priority candidates for classification during the backfill etapa.

## Business

This category is a pragmatic concession. Better to have a Block documented under "Miscellaneous" than to wait for the perfect classification before documenting it at all. The cost of imperfect placement is low; the cost of missing documentation is high.

Blocks here are not second-class — they have full feature.yml entries, full bilingual markdown, full cross-reference graph membership. The only signal that distinguishes them is the parent category, which flags them for re-classification.

## Architecture

Every block in this category carries an implicit TODO: re-classification. When a block is moved to its final category, three things happen:

1. The folder is renamed via `git mv` from `blocks/miscellaneous/{block}` to `blocks/{final-category}/{block}`.
2. The `parent` in the block's `feature.yml` is updated to the new category UID.
3. The block's UID is updated from `herd.block.miscellaneous.{block}` to `herd.block.{final-category}.{block}`. Markdown frontmatters are updated to match.

Cross-references to the block from other features must also be updated to the new UID. This is a coordinated change handled by the backfill etapa, not by the developer who happens to be touching unrelated code.

## Operations

<!-- TODO: Concrete process for re-classifying a block: who proposes the new category, who approves, how long blocks should stay in Miscellaneous before being prioritized for re-classification. -->

## Glossary

<!-- TODO: Local glossary if needed. Probably not — this category is intentionally generic. -->

## Changelog

- **2026-05-02** — Initial publication. Category overview created during Handbook UI Sub-etapa 1.5.
