---
title: Solutions
description: Layer that organizes feature packages focused on business value — by market, by department, by segment.
locale: en-US
uid: herd.layer.solutions
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Solutions

The Solutions layer organizes feature packages by **business value**, not by technical nature. A Solution answers "what value do we deliver, and to whom?" — for a market, for a department, for a segment. Solutions compose tools, blocks, and integrations from across ComeçaAI into coherent value propositions.

## Business

A Solution is ComeçaAI's commercial unit of articulation. When a customer says "we need help with sales pipeline acceleration," they're describing a Solution. The Solution may compose Marketing Tools, Finance Tools, and integrations from multiple categories — but the customer doesn't care about the composition. They care about the outcome.

This distinguishes Solutions from Tools. Tools are organized by **what they are** (Marketing Tools, Finance Tools, Legal Tools). Solutions are organized by **who they serve and what value they deliver** (Healthcare Solutions, Sales Department Solutions, SMB Solutions). The same tool may participate in multiple Solutions; the same Solution may compose tools across multiple categories.

<!-- TODO: 2-3 more paragraphs on commercial framing: how Solutions drive go-to-market, how customer journey aligns with Solution categories, how pricing tiers may align with Solution scope. -->

## Product

<!-- TODO: How users (sales reps, customer success, prospects) navigate Solutions in the admin and marketing surfaces. Solution browser, comparison views, ROI calculators per Solution. -->

## Architecture

The Solutions layer in the Handbook organizes documentation hierarchically. Solution categories are introduced lazily — created only when the first solution of a given category is documented. Day-1 the Solutions layer has only this overview; categories will be populated during the backfill etapa.

When a new Solution is documented, the agent (human or AI via the `/new-feature` skill) decides which category it belongs to. If the closest fit is a category that doesn't exist yet, the agent creates it. Categories thus emerge from the documented inventory rather than being prescribed top-down.

<!-- TODO: 2-3 more paragraphs on architectural implications: how a Solution composes tools/blocks via cross-references, how Solution-level metrics differ from feature-level metrics, how versioning of Solutions works. -->

## Operations

<!-- TODO: Conventions for working with Solutions: when to introduce a new Solution vs. extend an existing one, how to deprecate Solutions, how Solution roadmap fits into product planning. -->

## Glossary

<!-- TODO: Local glossary of Solution-specific terms (Solution, value proposition, segment, vertical, target market, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Layer overview created during Handbook UI Sub-etapa 1.5.
