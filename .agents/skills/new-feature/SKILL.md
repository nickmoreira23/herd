---
name: new-feature
description: Scaffolds the 4-artifact Handbook contract for a new HERD feature (feature.yml + bilingual Markdown stubs + optional SKILL.md). Use this skill ALWAYS when the user says "new block", "new tool", "new integration", "new solution", "new network", "create handbook entry", "scaffold feature", or implies starting any new named feature at one of HERD's feature levels (network, solution, tool, block, integration). Do NOT use for editing existing features (open the existing entry directly), code-only changes that don't introduce a new feature, or refactors of existing code without an associated new entry. Run `npm run gen:feature` to invoke. NOTE: the scaffolder is being redesigned for the layer/category/feature hierarchy introduced in Sub-etapa 1.5; until that redesign ships, prefer creating new feature.yml + markdown files manually following the conventions in AGENTS.md.
license: Apache-2.0
metadata:
  herd:
    is_meta: true
    invokes_script: scripts/run.ts
    version: "1.0"
    classification: meta-skill
---

# /new-feature

Scaffolds the 4-artifact Handbook contract for a new HERD feature. This is a
meta-skill: it creates the artifacts that other skills, blocks, tools, and
features at any level will be documented through.

> **Note (2026-05-02):** Sub-etapa 1.5 introduced a 3-level hierarchy
> (Layer → Category → Feature) and renamed levels (`foundation` removed,
> `layer`, `category`, `meta`, `network` added). The scaffolder script
> (`scripts/run.ts`) is currently aligned with the old flat layout and
> will be redesigned in a follow-up etapa. In the interim, create new
> feature.yml + bilingual markdown files manually, following the
> conventions in `AGENTS.md` and the patterns in
> `docs/handbook/blocks/miscellaneous/contacts/`.

## When to use

Triggers (any of these in user input):

- "new block X"
- "new tool Y"
- "new network Z"
- "new integration W"
- "create handbook entry"
- "scaffold feature"
- "let's add a new <anything-named> to HERD"

Do NOT use for:

- Modifying an existing feature (open the existing entry directly).
- Refactoring code without introducing a new named feature.
- Bug fixes.
- Documentation-only updates to existing entries.

## How it works

The skill invokes `npm run gen:feature` which runs `scripts/run.ts`. The script
asks the user a sequence of questions via `@inquirer/prompts`, validates the
answers against the Zod schema in `schemas/feature.zod.ts` (same schema CI
uses, same source of truth), generates the four artifacts, and prints next
steps.

## Files generated

For a feature `<id>` at level `<level>`:

    docs/handbook/<level>/<id>/feature.yml          # canonical metadata
    docs/handbook/<level>/<id>/pt-BR.md             # stub with selected perspectives
    docs/handbook/<level>/<id>/en-US.md             # mirror of pt-BR (structure)
    .agents/skills/feature-<level>-<id>/SKILL.md    # iff artifacts.skill = true

## Post-generation

The script prints next steps but does NOT run them automatically:

1. Edit `docs/handbook/<level>/<id>/{pt-BR,en-US}.md` to fill in TODO markers.
2. Run `npm run validate:handbook` to verify schema + graph.
3. Run `npm run gen:all` to regenerate derived artifacts.
4. Stage and commit when ready.

## Failure modes

- Duplicate id → script aborts; user picks a different id.
- Schema validation fails → script prints Zod issues; user corrects input.
- File system error (permission, disk full) → script aborts; user fixes
  environment.

## See also

- `docs/handbook/_meta/handbook/en-US.md` — what the levels mean,
  how the 4 artifacts fit together, the change-type matrix.
- `schemas/feature.zod.ts` — the canonical schema (Zod 4 via `zod/v4` subpath).
