---
name: new-feature
description: Scaffolds the 4-artifact Handbook contract for a new HERD entry (feature.yml + bilingual Markdown stubs) at the layer/category/feature hierarchy. Use this skill ALWAYS when the user says "new block", "new tool", "new integration", "new solution", "new network", "new category", "new meta entry", "create handbook entry", or "scaffold feature". Run `npm run gen:feature` to invoke. The script asks interactively which type of entry (feature individual / category overview / meta), then layer/category/id/metadata, validates against the Zod schema, and writes the files. It does NOT run gen:all automatically — you review first.
license: Apache-2.0
metadata:
  herd:
    is_meta: true
    invokes_script: scripts/run.ts
    version: "2.0"
    classification: meta-skill
---

# /new-feature

Scaffolds Handbook entries at the correct path in the 3-level hierarchy
(Layer → Category → Feature) introduced in Sub-etapa 1.5.

## When to use

Triggers (any of these in user input):

- "new block X"
- "new tool Y"
- "new integration W"
- "new solution Z"
- "new network N"
- "new category C in layer L"
- "new meta entry M"
- "scaffold feature"
- "create handbook entry"

Do NOT use for:

- Modifying an existing entry (open it directly).
- Refactoring code without introducing a new named entry.
- Bug fixes.
- Documentation-only updates to existing entries.

## How it works

`npm run gen:feature` invokes `scripts/run.ts`, which uses
`@inquirer/prompts` to ask:

1. **Type of entry**: feature individual, category overview, or meta entry.
2. If **feature**:
   - **Layer**: networks / solutions / tools / blocks / integrations.
   - **Category**: pick existing or create new.
     - If new, optionally scaffold the category overview now.
   - **Feature id** (kebab-case).
   - **Title** (pt-BR + en-US).
   - **Description** (pt-BR + en-US, ≤280 chars each).
   - **Owners** (comma-separated GitHub handles).
   - **Consumes** (comma-separated full UIDs, optional).
3. If **category**: layer + id + bilingual title/description.
4. If **meta**: id + bilingual title/description.

Each `feature.yml` is validated against the Zod schema in
`schemas/feature.zod.ts` before being written to disk.

## Files generated

For a feature at `<layer>/<category>/<id>`:

    docs/handbook/<layer>/<category>/<id>/feature.yml
    docs/handbook/<layer>/<category>/<id>/pt-BR.md
    docs/handbook/<layer>/<category>/<id>/en-US.md

For a category overview:

    docs/handbook/<layer>/<category>/(overview)/feature.yml
    docs/handbook/<layer>/<category>/(overview)/pt-BR.md
    docs/handbook/<layer>/<category>/(overview)/en-US.md

For a meta entry:

    docs/handbook/_meta/<id>/feature.yml
    docs/handbook/_meta/<id>/pt-BR.md
    docs/handbook/_meta/<id>/en-US.md

The 5 fixed layer overviews (`networks/(overview)`, etc.) are NOT
scaffolded by this tool — they are seeded once and edited in place.

## Post-generation

The script prints next steps but does NOT run them automatically:

1. Review the generated files.
2. Fill in TODO markers in the .md files (Business, Product, Architecture,
   Operations, Glossary, Changelog perspectives).
3. Run `npm run gen:all` to regenerate derived artifacts
   (search-index.json, manifest.json, xrefmap.yml).
4. Run `npm run validate:handbook` to verify schema + graph rules.
5. Stage and commit when ready.

## Failure modes

- Duplicate path → script aborts; user picks a different id.
- Schema validation fails on the generated YAML → script prints Zod issues
  and exits without writing.
- Filesystem error → script aborts; user fixes environment.

## See also

- `docs/handbook/_meta/handbook/en-US.md` — what the levels mean,
  the 4-artifact contract, the change-type matrix.
- `schemas/feature.zod.ts` — canonical schema (Zod 4 via `zod/v4`).
- `AGENTS.md` (Handbook section) — UID conventions, filesystem layout,
  semantic distinction between layers.
