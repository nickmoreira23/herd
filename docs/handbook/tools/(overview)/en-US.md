---
title: Tools
description: Layer that organizes tools by functional nature — financial, legal, marketing, sales.
locale: en-US
uid: herd.layer.tools
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Tools

The Tools layer organizes individual tools by **functional nature** — what kind of tool it is, not what value it delivers. An `email-sequence-tool` belongs to "Marketing Tools" because it is, by its nature, a marketing tool, regardless of which solution composes it.

## Business

Tools are ComeçaAI's atomic units of execution. Each tool does one thing well: send a sequence of emails, generate an invoice, validate a contract clause. Tools are reusable building blocks that compose into Solutions.

Tools are categorized by their **technical/functional nature** — Marketing, Finance, Legal, Sales, HR, Operations. This taxonomy answers "what kind of tool is this?" and helps users discover tools by domain expertise. It contrasts with Solutions, which answer "what value does this deliver, and to whom?"

<!-- TODO: 2-3 more paragraphs on the strategic value of organizing tools by nature: how it informs reuse decisions, how it maps to internal team ownership (each tool category may have a domain expert), how onboarding content aligns with tool categories. -->

## Product

<!-- TODO: How users (admins, end-users) discover and configure tools in ComeçaAI's admin UI. Tool catalog, category browser, configuration UI per tool. -->

## Architecture

The Tools layer in the Handbook organizes documentation hierarchically. Tool categories are introduced lazily — created only when the first tool of a given category is documented. Day-1 the Tools layer has only this overview; categories will be populated during the backfill etapa.

When a new Tool is documented, the agent (human or AI via the `/new-feature` skill) decides which category it belongs to based on functional nature, not on which Solutions might consume it. A single Tool may participate in multiple Solutions; a single Solution may compose Tools from multiple categories.

<!-- TODO: 2-3 more paragraphs on architectural implications: how Tool composition into Solutions works via cross-references, how Tool versioning is handled, how Tool metrics aggregate up to Solution metrics. -->

## Operations

<!-- TODO: Conventions for working with Tools: when to introduce a new Tool category vs. extend an existing one, how to deprecate Tools, how Tool ownership maps to engineering teams. -->

## Glossary

<!-- TODO: Local glossary of Tool-specific terms (Tool, functional category, domain expertise, atomicity, composability, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Layer overview created during Handbook UI Sub-etapa 1.5.
