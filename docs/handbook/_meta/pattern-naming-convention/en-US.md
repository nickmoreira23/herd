---
title: "Pattern: Naming Convention"
description: "Natural-language naming; blocks always plural; canonical suffixes; semantic distinction between Profile, profile-types, and profiles."
locale: en-US
uid: herd.meta.pattern-naming-convention
---

> For AI agents: this pattern is a vocabulary invariant. When creating a new tool, block, or surface, consult it to ensure consistent naming. Decisions settled in the May 2026 architectural session.

# Pattern: Naming Convention

Clear naming reduces friction across product, design, engineering, and business. ComeçaAI adopts precise but non-mechanical conventions — the rule is **natural language** when applicable (tools), and **canonical conventions** where shared vocabulary has value (blocks).

This pattern consolidates three rules: how to name tools, how to name blocks (including canonical suffixes), and how to avoid the classic confusion between Profile (tool), profile-types (block), and profiles (block).

## Business

Bad naming is invisible debt. On a platform with dozens of tools and blocks, talking about "the points module" vs "Points tool" vs "points block" without shared rules turns every conversation into a disambiguation step.

The consequence is twofold. For the team, consistent vocabulary cuts onboarding time, speeds up code review, and makes spec writing easier. For AI agents (orchestrator, MCP, Claude Code), predictable naming enables correct reasoning without ambiguity — an agent that knows "block name is always plural" reads the schema with more confidence.

## Product

### Tool naming — natural language

The single rule for tools: **how do the team, design, and business talk about this tool day-to-day? That's the name.** There is no mechanical rule forcing singular or plural; natural language decides.

**Plural** when the tool manages a collection:

| Tool | Why plural |
|---|---|
| Products, Plans, Contracts, Permissions, Roles | manage collections of items of the same type |
| Expenses, Payments, Forms, Packages, Milestones | same pattern |
| Brand Kits, Locations, Pipelines, Routines, Agents, Subscriptions, Campaigns | same pattern |
| Business Units, Departments | multiple organizational units |

**Singular** when the tool is a unique system:

| Tool | Why singular |
|---|---|
| Chat, Marketplace, Dashboard | unique system in the platform |
| Knowledge, Network, Profile, Handbook, Ledger | same pattern |
| Recognition, Ranking, Capacitation, Remuneration, Points | progression systems (singular as a concept) |
| Wallet (future) | same pattern |

**Quick test**: pronounce the sentence "I'll open [tool]". "I'll open Plans" sounds natural; "I'll open Plan" sounds wrong. "I'll open Chat" sounds natural; "I'll open Chats" sounds wrong. This test resolves most cases.

### Block naming — always plural

Unlike tools, blocks **are always plural** — because they represent collections of records:

```
products (not product)
contacts (not contact)
recognition-events (not recognition-event)
points-balances (not points-balance)
```

The reason is simple: a block is "the table" / "the list of things of this type". Singular breaks the mental model.

### Profile semantic distinction

Special case that illustrates the importance of the three rules. There are **four things called profile** in the product, and they don't collide because they live in distinct contexts:

| Term | Type | Location | Singular/Plural |
|---|---|---|---|
| **Profile** (institutional) | Standalone tool | Organization area | Singular |
| **Profile** (personal — future) | Standalone tool | Identity area | Singular |
| **profile-types** | Block (managed via Network "Manage types") | Network tool | Plural |
| **profiles** | Block (instances) | Network tool consumes | Plural |

The different contexts (area, layer, singular vs plural) eliminate ambiguity. Confusing the four produces wrong documentation, confused schemas, and inconsistent UI.

The same principle applies to any family with "type + instance":

- `plan-types` (templates plural) vs `plans` (instances plural) — Plans tool singular or plural? Plans tool is plural (manages a collection).
- `permission-sets` (templates) vs `permissions` (instances) — Permissions tool plural.

## Architecture

### Canonical block suffixes

Suffixes in the block id encode semantics. **Apply whenever the semantics match**; do not invent ad-hoc variants.

| Suffix | Function |
|---|---|
| (no suffix) | Main block of the family (e.g., `products`, `contacts`) |
| `-categories` | Block Group naming (intra-block grouping) |
| `-tracks` / `-systems` / `-rules` | Main definitions |
| `-levels` | Named levels |
| `-criteria` | Reusable conditions |
| `-events` | Time log (with mandatory source attribution) |
| `-progress` | Continuous current state |
| `-positions` | Ranking current + history (Ranking-specific) |
| `-balances` | Dynamic balance updating on event |
| `-snapshots` | Frozen history per configurable period |
| `-benefits` | Conditional rules active at a level |
| `-rewards` | One-off awards granted |
| `-stories` | Publishable narrative content |
| `-payouts` | Audited consolidated payments |
| `-redemptions` | Redemptions |
| `-transitions` | Log of state changes between instances |

The semantic detail of each suffix is documented in `pattern-block-level` (structure) and `pattern-snapshots` (state suffixes).

### Always kebab-case

In file paths, ids, and UIDs, always kebab-case (lowercase + hyphen). No snake_case, camelCase, or PascalCase in ids/UIDs.

```
✓ pattern-naming-convention
✓ recognition-tracks
✓ business-units

✗ patternNamingConvention
✗ recognition_tracks
✗ BusinessUnits
```

### UID structure

A UID concatenates kebab-case tokens with dots. Already formalized in the schema (see `_meta/handbook`):

```
herd.layer.{layer-name}              — layer
herd.category.{layer-name}.{cat-id}  — category
herd.{level}.{cat-id}.{feat-id}      — individual feature
herd.meta.{id}                       — meta entry
```

A UID never changes after creation — it is a stable identifier (see invariant in `_meta/handbook`).

## Operations

### Checklist for naming a new tool

1. **Natural language first**: how does the team talk about the tool? "I'll open Plans" or "I'll open Plan"? Pronouncing the sentence decides singular/plural.
2. **Collection or unique system?**: a tool that manages multiple instances of the same type (Plans, Products, Contracts) → plural. A tool that is a unique system in the platform (Chat, Marketplace, Dashboard) → singular.
3. **Validate against existing tools**: does the name match tools already created? If the semantic category is new, double-check with product/design.
4. **Avoid redundancy with layer/area**: a tool inside "Marketing Tools" doesn't need a "Marketing" prefix in its name. The layer already provides context.

### Checklist for naming a new block

1. **Plural**: id always plural. No exception.
2. **kebab-case**: hyphen, lowercase, no special characters.
3. **Appropriate canonical suffix**: consult the table. If no suffix fits exactly, pause-and-report — that probably means the block's semantics needs reexamination before implementation.
4. **Avoid ad-hoc suffixes**: never `-history`, `-archive`, `-list`, `-data` — they break the vocabulary.
5. **Clear owning tool**: which tool does the block belong to? Consistent family.

### Checklist for naming a UID/path

1. **kebab-case mandatory** in every segment.
2. **path ↔ UID agreement**: the file path (`docs/handbook/{layer}/{cat}/{id}/`) must match the UID (`herd.{level}.{cat}.{id}`) letter by letter.
3. **`(overview)` reserved**: the `(overview)` segment is specific to layer/category overview entries. Do not use it as a feature id.
4. **Stability**: a UID, once published, does not change. Renames go through deprecation + successor.

### Anti-patterns to avoid

- **Tool with forced naming**: forcing plural when the team speaks singular (or vice versa). Breaks the usability of internal conversation.
- **Singular block**: creating `product` instead of `products`. Confuses the mental model.
- **Ad-hoc suffix**: creating `recognition-history` or `points-archive`. Use the canonical suffixes.
- **Profile confusion**: creating a `profile` block (singular) when it should be `profiles`. Mixing Profile (tool) with `profiles` (block).
- **Renaming a UID**: editing an entry's `uid` after publication. Always via deprecation.

## Glossary

- **kebab-case**: naming convention with lowercase words separated by hyphens (e.g., `recognition-tracks`).
- **singular-naming**: convention for tools that are unique systems (Chat, Marketplace, Recognition).
- **plural-naming**: convention for tools that manage collections (Plans, Products, Contracts) and for all blocks.
- **suffix-convention**: system of canonical suffixes encoding block semantics (`-events`, `-snapshots`, `-progress`, etc.).
- **semantic-distinction**: principle of differentiating between similar terms via context (e.g., Profile tool singular vs profile-types block plural).
- **natural-language-naming**: principle that a tool's name should reflect how the team talks about the tool day-to-day.

## Changelog

- **2026-05-04 (v1.0)** — Pattern settled in the R2.5 expanded architectural session (May 2026). Establishes natural-language naming for tools, always-plural naming for blocks, canonical suffixes as shared vocabulary, formal Profile vs profile-types vs profiles distinction, and kebab-case as the universal convention across paths/ids/UIDs.
