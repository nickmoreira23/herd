---
title: "Pattern: Tool"
description: "Tool as ComeçaAI's commercial and operational unit: two modes, natural-language naming, manifest in registry."
locale: en-US
uid: herd.meta.pattern-tool-level
---

> For AI agents: this pattern is an architectural invariant. When creating a new tool, consult it first to differentiate from Surface, Block, or Tool Category. Decisions settled in the May 2026 architectural session.

# Pattern: Tool

Tool is the rich-manipulation level of ComeçaAI — where business rules, authoring, and full UI live. Every capability is born as a trio (see `pattern-three-level-composition`); this pattern explains the Tool level specifically: what it is, what it isn't, and how to create a new one without fragmenting the architecture.

## Business

Tool is ComeçaAI's commercial unit. It can be activated by a commercial plan, monetized individually, and composed into bundles (Solutions, a future concept). Each tool has a clear business goal — generating value that justifies its own space.

The practical consequence is selective: if a candidate "feature" has no business goal of its own, it is probably part of another tool (a surface, a block, or an internal sub-routine). Tools are not technical umbrellas — they are products. This rigor avoids accretive growth that turns commercial roadmaps into indistinct lists of "features".

## Product

A tool has **two modes** of operation. Same manifest, same core logic, but two UI scenarios:

- **Standalone**: the user accesses the tool at a canonical path (`/admin/products`, `/admin/plans`). Full workflow, own header, own breadcrumb. The "complete" form of using the tool.
- **Embedded**: the tool is invoked inline from another surface — "Quick add" modal, tab in another tool, inline sheet. Keeps core logic but trims the UI down to the immediate task.

**Naming** follows natural language — not a mechanical rule:

- **Plural** when the tool manages a collection: `Products`, `Plans`, `Contracts`, `Permissions`, `Roles`, `Business Units`, `Departments`, `Brand Kits`, `Locations`, `Routines`, `Agents`, `Campaigns`, `Pipelines`.
- **Singular** when the tool is a unique system: `Chat`, `Marketplace`, `Dashboard`, `Knowledge`, `Network`, `Profile`, `Handbook`, `Ledger`, `Recognition`, `Ranking`, `Capacitation`, `Remuneration`, `Points`, `Wallet`.

The rule: how does the team, design, and business talk about this tool day-to-day? That's the name.

## Architecture

### Manifest and registry

Every tool has a TypeScript manifest at `src/lib/tools/tools/{tool}.tool.ts` declaring identity, paths, capabilities, and associated block family. The manifest registers the tool in `src/lib/tools/registry.ts`. The chat orchestrator consumes the registry to route `execute_action` calls.

A manifest carries:

- Identity (`id`, displayName in pt-BR and en-US).
- Canonical paths (admin paths, source paths).
- Runtime category (Finances, Legal, Marketing, Sales, Operations, Foundation).
- Capabilities exposed to agents (actions and their parameters).
- Associated block family (list of blocks the tool produces/manipulates).

### Tool ≠ Surface ≠ Block

Decisive criteria to differentiate:

- **Tool**: rich UI, manipulation logic, generates/manipulates a family of blocks. Ex: Plans tool manages `plan-types`, `plans`, `plan-transitions`.
- **Surface**: consumes blocks and may invoke tools inline, but does not generate data of its own. Ex: Marketplace consumes `products` but does not manipulate them.
- **Block**: single source of truth for a data type. No rich UI of its own — manipulated by the tool that owns the family.

When in doubt, the question is: "if I remove this thing, what is lost?" Loss of rich UI and rules → it was a tool. Loss of manifestation → it was a surface. Loss of the data itself → it was a block.

### A tool generates a FAMILY, not a single block

Important decision: a tool never generates a single block. It always generates a **family** of correlated blocks. Plans generates 3 blocks (`plan-types`, `plans`, `plan-transitions`). Recognition generates 8. Ledger orchestrates `journal-entries` + `commissions-payments`.

This avoids the "one tool per block" anti-pattern that fragments the architecture, duplicates chrome, and makes it harder to evolve data that always travels together.

### Tool Category vs Area

Two distinct dimensions classify a tool:

- **Area** (structural, 6 fixed): Organization, Identity, Communication, Transaction, Workflow, Notification. Every tool lives in exactly one area.
- **Tool Category** (runtime, optional inside Workflow): Finances, Legal, Marketing, Operations, Sales, Foundation. Groups tools by runtime/orchestration affinity.

Don't conflate them: Area says *where the tool lives in the product*; Tool Category says *how the orchestrator groups it for routing*.

## Operations

### Checklist for creating a new tool

1. **Nature**: does the thing have a clear business goal that justifies its own unit? If not → probably a surface or part of an existing tool.
2. **Area**: in which of the 6 areas does the tool live? If it fits none → pause-and-report.
3. **Tool Category** (optional inside Workflow > Tools): Finances, Legal, Marketing, Operations, Sales, Foundation.
4. **Block Family**: which blocks does it generate/manipulate? Apply canonical suffixes (see `pattern-block-level`).
5. **Surfaces**: which surfaces consume or invoke this tool? Is there an External one? An Internal one?
6. **Manage Types/Sets pattern**: does the tool manage templates + instances? If yes → apply the header sub-action pattern (`pattern-manage-types`).
7. **Naming**: singular or plural? Decided by how the team talks about the tool, not by mechanical rule.

### Anti-patterns to avoid

- **Template-only tool**: a separate tool just to manage templates of another tool (e.g., a `plan-types-tool` separate from `plans-tool`). Use the Manage Types pattern instead.
- **Tool per block**: creating a tool for each isolated block. Tools always operate over a family, never a single block.
- **Tool with no standalone**: if the tool only exists in embedded mode, it is usually a surface, not a tool.
- **Tool with no Area**: if the tool fits none of the 6 areas, it signals the feature is not yet well defined — pause-and-report before inventing a new area.

## Glossary

- **Tool**: rich-manipulation unit — UI, rules, manifest, registry. ComeçaAI's commercial unit.
- **Tool Category**: runtime grouping of tools by orchestration affinity (Finances, Legal, Marketing, Sales, Operations, Foundation). Not a tool itself.
- **Area**: structural macro-division of the product (Organization, Identity, Communication, Transaction, Workflow, Notification). Tools live inside areas.
- **Manifest**: TypeScript declaration describing the tool — identity, paths, capabilities, block family.
- **Registry**: central table indexing all manifests; the orchestrator consults the registry.
- **Standalone Mode**: tool at its canonical path with full workflow.
- **Embedded Mode**: tool invoked inline from another surface.

## Changelog

- **2026-05-04 (v1.0)** — Pattern settled in the R2.5 expanded architectural session (May 2026). Establishes Tool as ComeçaAI's commercial and operational unit with two formal modes (standalone + embedded), natural-language naming, and whole-Block-Family generation rather than single-block.
