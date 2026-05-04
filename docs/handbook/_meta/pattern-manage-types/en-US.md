---
title: "Pattern: Manage Types/Sets"
description: "UX pattern for tools managing templates + instances together via header sub-action."
locale: en-US
uid: herd.meta.pattern-manage-types
---

> For AI agents: this pattern is a UX invariant. When creating a tool that has reusable templates and attached instances, apply this pattern instead of creating a separate template-only tool. Decisions settled in the May 2026 architectural session.

# Pattern: Manage Types/Sets

UX pattern settled for tools that manage **templates** (reusable definitions) **and instances** (concrete entities that use those templates) together. Instead of creating a separate tool to manage templates (which pollutes the architecture with a template-only tool), the pattern uses a **header sub-action** that opens the template manager as a secondary view of the same tool.

## Business

The motivation is to avoid fragmentation. When a business concept has "type + instance" (plan-types vs plans, permission-sets vs permissions, profile-types vs profiles), the natural temptation is to create two tools: one for managing types, another for instances. The result is an inflated architecture with template-only tools that duplicate chrome, complicate navigation ("to create a Renda Pura plan I have to go to Plan Types first"), and fragment vocabulary.

The Manage Types/Sets pattern fixes this: **one tool, one main listing of instances, and a sub-action in the header to manage templates**. The user understands the template-instance relationship without switching tools. Templates and instances live in the same block family; the UI reflects the cohesion.

## Product

### Canonical layout

```
┌─────────────────────────────────────────────┐
│  Plans                  [Manage types ▾]   │
├─────────────────────────────────────────────┤
│  [+ New Plan]                               │
│  ─────────────────                          │
│  - João — Renda Principal                   │
│  - Maria — Renda Extra                      │
│  - Pedro — Renda Pura                       │
└─────────────────────────────────────────────┘
```

The header has two affordances:

- **Sub-action "Manage types"** (or "Manage sets" for set-style terminology): opens the template manager. Lists, creates, edits, and archives templates. Modal, sheet, or dedicated sub-route inside the tool — but always reached via the main tool's header.
- **Primary action "+ New {Instance}"**: creates a new instance using one of the existing templates.

### Canonical applications

| Tool | Header sub-action | Managed templates | Audience |
|---|---|---|---|
| Plans | "Manage types" | `plan-types` | Plans attached to profiles |
| Permissions | "Manage sets" | `permission-sets` | Granted permissions |
| Network > Internal | "Manage types" | `profile-types` (audience=internal) | Listed Members |
| Network > External | "Manage types" | `profile-types` (audience=external) | Listed Partners |

The choice between "types" and "sets" follows the natural terminology of the concept — Plans has "plan types"; Permissions has "permission sets". Both variations are legitimate.

### Mental model for the user

The user enters the tool and sees **instances** (what exists operationally today — Plans attached to people, Permissions granted to roles). When a new one of the same mold is needed, "+ New" is used. When the **molds themselves** need managing (creating a new mold, tweaking an existing one), "Manage types" is opened.

The separation is natural: instances change all the time; templates change rarely.

## Architecture

### Internal sub-routes

The tool has two internal sub-routes (or two views — a modal works equivalently):

- `/admin/{tool}/` — instances listing. Default view.
- `/admin/{tool}/types/` (or `/sets/`) — template manager. Opened via the header sub-action.

Both routes belong to the same tool, the same manifest, the same registry entry. There are no separate tools.

### Schema separates object types

The tool's block family includes at least two distinct blocks:

- Instances block (e.g., `plans`, `permissions`, `profiles`).
- Templates block (e.g., `plan-types`, `permission-sets`, `profile-types`).

Instances carry an FK to the template they derive from. Templates can be edited without affecting already-materialized instances (instances may inherit from the template or apply overrides — decision per tool).

### No template-only tools

Explicit decision: never create `plan-types-tool`, `permission-sets-tool`, or `profile-types-tool` as tools of their own. Template management is the responsibility of the owning tool, exposed via Manage Types/Sets. This keeps the architecture lean and the vocabulary cohesive.

## Operations

### When to apply the pattern

Use the pattern when **all** the conditions below are true:

- ✓ The tool manages entities that have a concept of a **reusable template** (e.g., plan type, permission set, profile type).
- ✓ The tool also manages **attached instances** of those templates (e.g., plans of real people, granted permissions, registered profiles).
- ✓ Templates and instances live in the **same block family** (same owning tool).

### When NOT to apply

- ✗ The tool manages only direct instances, with no template concept (e.g., Contracts — each contract is unique, there is no reusable "contract type").
- ✗ Templates already live in another dedicated tool and this tool only consumes (e.g., tool A consumes templates defined in tool B). In that case, reference the other tool; don't duplicate management.
- ✗ The template-instance relationship is trivial (1:1) and does not justify a separate view.

### Implementation checklist

1. **Identify template and instance** inside the block family.
2. **Decide terminology**: "Manage types" or "Manage sets"? Follow the natural term for the concept.
3. **Implement the header sub-action** in the tool: button/dropdown in the main listing's header.
4. **Implement the sub-route or modal** for the template manager.
5. **Define inheritance**: do instances derive from the template at creation time? Are overrides allowed? Document it.
6. **Validate vocabulary with product/design** before implementing — header terminology is part of the official vocabulary.

### Anti-patterns to avoid

- **Template-only tool**: creating `plan-types-tool` separate from `plans-tool` instead of using Manage Types. Pollutes architecture and vocabulary.
- **Buried header sub-action**: placing "Manage types" in a deep menu (settings, more menu) — the affordance becomes invisible.
- **Templates outside the family**: storing templates in another tool's block. Breaks template/instance cohesion.
- **Forcing the pattern where it doesn't fit**: applying Manage Types to a tool with no real template concept. The pattern is selective.

## Glossary

- **manage-types-pattern**: UX pattern for tools managing templates + instances via the "Manage types" header sub-action.
- **manage-sets-pattern**: variant for tools whose natural terminology is "sets" instead of "types" (e.g., Permissions with "Manage sets").
- **template**: reusable definition of an entity — the mold from which instances are derived.
- **instance**: concrete entity attached to a specific context, derived from a template.
- **header sub-action**: UX affordance in the tool's header (button or dropdown) that opens a secondary view of the same tool.
- **governance pattern**: class of UX patterns whose function is to organize the relationship between rules (templates) and operation (instances).

## Changelog

- **2026-05-04 (v1.0)** — Pattern settled in the R2.5 expanded architectural session (May 2026). Applied canonically in Plans, Permissions, Network > Internal, Network > External. Replaces the creation of template-only tools.
