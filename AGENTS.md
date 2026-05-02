<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Block Sub-Agent Architecture

HERD uses a block-based architecture where each feature module ("block") is self-contained and composable.

## For Developers (Claude Code Agents)

Each block has a specialized agent definition in `.agents/blocks/{block}/AGENT.md` with deep domain knowledge, file paths, API contracts, and conventions. Spawn these agents when working on a specific block.

Available block agents: events, products, meetings, knowledge, agents, community, perks, partners.

Template for new blocks: `.agents/blocks/_template/AGENT.md`

## For Runtime (Chat Orchestrator)

Each block declares its capabilities via a manifest in `src/lib/blocks/blocks/{block}.block.ts`. The orchestrator uses two tools:
- `search_data` — read data from any block via DataProviders
- `execute_action` — write data (create, update, delete) by routing to existing API endpoints

Registry: `src/lib/blocks/registry.ts`
Action engine: `src/lib/chat/action-execution.ts`

## Creating New Blocks

```bash
npx tsx scripts/create-block.ts --name "rewards" --display "Rewards" --model "Reward"
```

Then: add Prisma model, register in registry.ts and data-retrieval.ts, run `npm run db:migrate` (see "Database migrations" below).

# Tools Architecture

Tools sit above blocks — they compose blocks into focused, goal-oriented capabilities. Tools are grouped by **Category** (business area, e.g. Finances, Legal, Marketing, Sales, Operations). Tools are exposed to both users (UI) and agents (orchestrator). The "Solution" concept — a higher-level composition of tools toward a specific outcome — will return as a separate layer once that design lands; it is intentionally not modeled today.

## For Developers (Claude Code Agents)

Each tool category has a specialized agent definition in `.agents/tools/{category}/AGENT.md`. Spawn these agents when working on tools inside a specific category.

Available tool category agents: finances, legal, marketing, sales.

Template for new categories: `.agents/tools/_template/AGENT.md`

## For Runtime (Chat Orchestrator)

Each category declares its tools and capabilities via a manifest in `src/lib/tools/categories/{category}.category.ts`. Tool actions are injected into the orchestrator system prompt alongside block actions and called via `execute_action`.

Registry: `src/lib/tools/registry.ts`
Manifest types: `src/lib/tools/manifest.ts`

## Creating New Tool Categories

```bash
npx tsx scripts/create-tool-category.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"
```

Then: import and register in `src/lib/tools/registry.ts`, add icon mapping in `category-meta.ts`.

# Database migrations

This project uses `prisma migrate`, not `db push`.

- Local development: `npm run db:migrate` (creates and applies a new migration).
- Production/CI: `npm run db:deploy` (applies pending migrations without prompting).
- Never run `prisma db push` — it bypasses the migration history.

# Account seeding

The platform's chart of accounts (the structural ledger accounts referenced by
the rest of the system) is declared in `src/lib/ledger/platform-accounts-spec.ts`
and seeded via `npm run db:seed:ledger`.

The seed is **idempotent**: running it 1, 5, or 100 times produces the same end
state. Run it at least once after `npm run db:migrate` on any new environment.

- **Adding** an account: edit `PLATFORM_ACCOUNT_TEMPLATES` and re-run the seed.
- **Renaming** an account (just the display name): edit and re-run.
- **Changing accountType or currency** of an existing code: NOT allowed via
  seed. Create a new code; archive the old one.
- **Per-profile accounts** (`profile:{uuid}:...`): not seeded — created on-demand
  by services that handle profile registration.

# Lint debt

This project carries pre-existing lint debt in legacy paths
(`src/app/admin/**`, `src/components/**`, `src/lib/services/**`,
and others — see `eslint.config.mjs` for the full list). Those rules
are downgraded to `warn` only for those paths.

**New code is held to the strict ruleset.** If your work adds a path
to the override list to make lint pass, push back — that's a sign
the code has the same problem the legacy has, and we should fix it
properly instead.

The cleanup of legacy lint debt is tracked as a future task
(planned: "Etapa 1.1.5 — Lint cleanup"). It is not blocking for
Phase 1 of the marketplace+opportunities work.

# Domain events outbox

Cross-context communication uses an outbox pattern in the `domain_events` table.

- **Emitting**: services that produce a state change in their own bounded context
  call `emitDomainEvent(...)` within the same transaction. Event existence is
  transactionally tied to the change.
- **Processing**: a CLI worker (`npm run worker:domain-events`) picks pending
  events, looks up the handler in the static registry, runs it, and updates the
  event's status. Concurrent workers are safe via `SELECT FOR UPDATE SKIP LOCKED`.
- **Adding a handler**: implement the handler function, then add it to
  `src/lib/domain-events/handler-registry.ts` keyed by event type.
- **Retry policy**: 5 attempts with exponential backoff (1m, 5m, 30m, 2h, then exhaust).
  Exhausted events stop auto-retrying; manual intervention via SQL is the path forward.
- **Convention**: event types are `{aggregate}.{verb}` in lowercase, e.g.
  `transaction.paid`, `commission.computed`. Verbs may include hyphens.

The Phase 1 etapa 1.8 establishes the infrastructure but leaves the registry
empty — actual events start being emitted in Phase 2.

# Skill references

Two SKILL files codify the institutional knowledge accumulated during
Phase 1:

- `.agents/skills/ledger/SKILL.md` — invariants and conventions for the
  double-entry ledger (accounts, journal_entries, journal_lines).
- `.agents/skills/domain-events/SKILL.md` — invariants and conventions for
  the domain events outbox pattern. Canonical source has migrated to the
  Handbook (`docs/handbook/tools/infrastructure/domain-events/`); the SKILL
  file is preserved as a backward-compat shim.

Read the relevant SKILL (or its Handbook equivalent) before making any
change that touches the corresponding subsystem. The SKILLs are versioned
(semver) and have a "how to update" section explaining the procedure.

# Invariant audit

`npm run check:invariants` runs three database-level checks:
1. Every journal entry balances per currency.
2. Every account code matches the naming regex.
3. Every journal line currency matches its account currency.

Use as operational audit (post-restore, periodic, after major schema
changes). Not wired into CI because CI does not provision a database.
The constraints from Etapas 1.2 and 1.6 should make violations impossible —
the script is defense-in-depth.

## Handbook (doc-first)

HERD uses a 4-artifact doc system organized into a 3-level hierarchy. Before
writing code that creates, modifies, or deprecates a feature, check the
change-type matrix in `docs/handbook/_meta/handbook/en-US.md` (Operations
perspective) for required artifacts.

The hierarchy:

1. **Layers** (5 fixed): `networks`, `solutions`, `tools`, `blocks`, `integrations`.
2. **Categories**: introduced per layer as needed (e.g., `marketing` under `tools`).
3. **Features individuais**: concrete features inside a category.

### Category naming convention

Category titles **never repeat the layer's name**. The layer is already
established by the URL, breadcrumb, and sub-panel — repeating it on every
category bloats the breadcrumb and reads as noise.

| Layer | ✓ Use | ✗ Avoid |
|---|---|---|
| `tools` | "Financial", "Marketing", "Infrastructure" | "Financial Tools", "Marketing Tools" |
| `blocks` | "Financial", "Miscellaneous" | "Financial Blocks" |
| `integrations` | "Payment", "Communication", "Calendar" | "Payment Integrations" |
| `solutions` | "Healthcare", "Sales Department" | "Healthcare Solutions" |
| `networks` | (categories TBD) | — |

This applies to both `pt-BR` and `en-US` titles in `feature.yml` and the
`(overview)/{pt-BR,en-US}.md` H1/frontmatter.

Plus a separate `_meta` namespace for documentation about the documentation
system itself (e.g., `herd.meta.handbook`).

### Semantic distinction between layers

- **Networks** organize relational contexts (Corporate, Market, Multi-Market).
- **Solutions** are organized by *business value* — by market, by department,
  by segment. ("Healthcare Solutions", "Sales Department Solutions".)
- **Tools** are organized by *functional nature* — what kind of tool it is.
  ("Marketing Tools", "Finance Tools", "Legal Tools".)
- **Blocks** are organized by *data nature*. ("Identity", "Media", "Time".)
- **Integrations** are organized by *purpose*. ("Payment", "Calendar",
  "Communication".)

The same Tool may participate in multiple Solutions; the same Solution may
compose Tools across multiple categories.

### UID structure

- Layer: `herd.layer.{layer-name}` (parent: `null`)
- Category: `herd.category.{layer-name}.{category-id}` (parent: `herd.layer.{layer-name}`)
- Feature individual: `herd.{level}.{category-id}.{feature-id}` where
  `level` ∈ {`network`, `solution`, `tool`, `block`, `integration`}
  (parent: `herd.category.{layer-name}.{category-id}`)
- Meta: `herd.meta.{id}` (parent: `null`)

Cross-references in `consumes`/`consumed_by`/`children`/`related`/`parent` use
**full UIDs** (with dots), not short ids — disambiguates across categories.

### Filesystem layout

| Level | Path |
|---|---|
| Layer | `docs/handbook/{layer-name}/(overview)/` |
| Category | `docs/handbook/{layer-name}/{category-id}/(overview)/` |
| Feature | `docs/handbook/{layer-name}/{category-id}/{feature-id}/` |
| Meta | `docs/handbook/_meta/{id}/` |

The `(overview)` folder name (literal, with parentheses) holds the entry that
documents a layer or category as a whole. Sibling folders inside the same
parent are individual features.

### Code mapping for feature levels

| Level | Code root | Manifest |
|---|---|---|
| `block` | `src/components/{name}/`, `src/app/admin/blocks/{name}/` | `src/lib/blocks/blocks/{name}.block.ts` |
| `tool` | `src/components/tools/{name}/` (planned), `src/app/admin/tools/{name}/` | `src/lib/tools/tools/{name}.tool.ts` (planned) |
| `integration` | `src/lib/integrations/{name}/` | varies |
| `solution` | composition only — no code root | n/a |
| `network` | composition only — no code root | n/a |

Note: tool runtime categories (Finances, Legal, Marketing, Sales, Operations)
in `.agents/tools/{category}/AGENT.md` and `src/lib/tools/categories/` are a
runtime grouping concept distinct from the Handbook `category` level — though
the two often align by name.

Note: `block-group` is intra-block (e.g., packages inside products). Documented
inside the parent block's `feature.yml` under `block_groups`, not as a separate
entry.

The 4 artifacts per feature:

1. Handbook entry — `{path}/{pt-BR.md, en-US.md}`. Bilingual.
2. `feature.yml` — canonical metadata. Same directory.
3. `SKILL.md` — `.agents/skills/feature-{level}-{id}/SKILL.md`. Optional.
4. MCP tool — registered in `mcp/generated/manifest.json`. Optional.

The schema source-of-truth lives in `schemas/feature.zod.ts` (Zod 4 via the
`zod/v4` subpath). JSON Schema is generated and committed at
`schemas/feature.schema.json`. Run `npm run gen:schemas` after schema changes.

To scaffold a new feature's 4 artifacts, run:

    npm run gen:feature

This invokes the `/new-feature` meta-skill at `.agents/skills/new-feature/`
(introduced in a separate sub-etapa).

CI gates that will fail your PR (full enforcement lands in a later sub-etapa):

1. `feature.yml` schema validation (Zod 4 → JSON Schema → Ajv).
2. Folder path must match the layout for the declared `level` (see table above).
3. `feature.yml.uid` must follow the UID structure for its level.
4. `feature.yml.parent` must point to a feature at the correct upstream level
   (category for features, layer for categories, `null` for layers and meta).
5. Cross-references in `consumes`/`consumed_by`/`children`/`related` must
   resolve to a known UID, or be allowlisted in
   `docs/handbook/_meta/.legacy-allowlist.txt`.
6. Generated artifacts (`mcp/generated/`, `docs/handbook/_meta/xrefmap.yml`,
   `schemas/feature.schema.json`) must be regenerated and committed when source
   changes (CI runs `npm run gen:all` and fails on diff).

CI soft warnings (Danger.js, comments only):

6. Bilingual co-change: `pt-BR.md` edited without `en-US.md` (or vice versa).
7. Doc-first nudge: source code under `src/` changed without `docs/handbook/`
   change.
8. Perspective coverage: H2 headers in `.md` don't match
   `feature.yml.perspectives`.

Skills layout convention:

- Feature-bound: `.agents/skills/feature-{level}-{id}/SKILL.md`.
- Practice (cross-cutting engineering, no specific feature): `.agents/skills/practice-{name}/SKILL.md`.

Existing skills awaiting full layout migration (mechanical work, deferred):

- `.agents/skills/domain-events/` → migrated to Handbook (`docs/handbook/tools/infrastructure/domain-events/`); SKILL retained as shim
- `.agents/skills/ledger/` → unclassified; final layout decided in backfill
- `.agents/skills/supabase-postgres-best-practices/` → eventually `practice-supabase-postgres`

The migration is mechanical and tracked as a future backfill etapa. The
sub-etapa that introduces CI gates also adds `name`/`description` fields to
the two non-conformant frontmatters and renames the supabase-postgres folder.

## House vocabulary

When writing the `## Glossary` section of any Handbook entry, define
terms as a bullet list, one per line:

    ## Glossary

    - **MQL**: Marketing Qualified Lead. A contact who has shown intent…
    - **Lifecycle stage**: The current state of a contact in the funnel…

The format is parsed by `npm run gen:glossary` to build the global
glossary at `herd.meta.glossary` (rendered at
`/admin/handbook/meta/glossary`). The regex is
`/^-\s+\*\*(.+?)\*\*\s*:\s*(.+)$/gm` — multi-line definitions are not
supported; keep each definition to a single line.

Terms are case-insensitive when grouping across entries. If the same
term is defined in multiple entries (e.g., "Network" in the Networks
layer overview AND in a feature), all definitions appear in the global
glossary, ordered by hierarchy (layer → category → feature). Terms
defined in only one locale appear in the other locale with a
"Translation pending" note.

`npm run gen:glossary` is part of `npm run gen:all` and produces a
deterministic output (the "Last updated" line is derived from the
`updated:` field of contributing entries, never from `Date.now()`).

## Documentation discipline

The Handbook (`docs/handbook/`) is the source of truth for what HERD
is, how it works, and how to operate it. It complements (not replaces)
inline code comments and READMEs.

### When to update the Handbook

If your PR modifies code in `src/lib/[feature]/`, `src/services/[feature]/`,
or an equivalent product path, check whether a corresponding Handbook
entry exists (search `docs/handbook/**/feature.yml` for matching
`source_paths`):

- **Entry exists, behavior changed:** update the relevant perspective(s)
  in `pt-BR.md` and `en-US.md`, bump `updated:` in `feature.yml`. Run
  `npm run gen:all` and `npm run validate:handbook`.
- **Entry exists, only refactor (no behavior change):** no Handbook
  update needed.
- **Entry doesn't exist, feature is substantive:** create the entry
  via `npm run gen:feature` and fill at least Business + Architecture
  perspectives now; the other perspectives can mature with the feature.
- **Entry doesn't exist, feature is internal/experimental:** add the
  path to a future backfill backlog (not blocking).

### `source_paths` vs `admin_paths`

Two related but distinct fields in `feature.yml`:

- **`source_paths`** — filesystem paths (e.g. `src/lib/ledger`,
  `src/components/contacts/`). Used by Danger.js for the doc-first
  nudge ("you touched `src/lib/X` but didn't touch the matching
  Handbook entry"), and by humans/agents grep'ing for "where in code
  does this feature live?".

- **`admin_paths`** — URL paths under `/admin` (e.g.
  `/admin/blocks/contacts`). Used by the "View Handbook" button
  auto-lookup: when the user is on a page covered by the entry's
  admin_paths, the button auto-resolves and links to the Handbook
  entry. When populating a feature, prefer including the parent
  admin path (e.g. `/admin/blocks/contacts`) over individual
  sub-paths — `pathname.startsWith(adminPath + "/")` matches all
  descendants.

A feature can have both, only one, or neither. Filling both is
ideal for substantive admin-facing features.

### Specs that include substantive work

Specs produced via the chat-code-handoff protocol that crave
substantive changes (new feature, refactor of existing feature) should
include an explicit **"Update Handbook"** task before the commit task.
Trivial changes (typos, formatting, lint debt cleanup, CI housekeeping,
import migrations without behavior change) skip this task. Changes to
the Handbook schema or to its tooling (scripts under `scripts/build-*.ts`,
`schemas/feature.zod.ts`) always include it (self-reference).

### Cross-references and allowlist

If your feature consumes another feature, declare it in `consumes:` of
`feature.yml` using the full UID. If the target doesn't exist yet, add
it to `docs/handbook/_meta/.legacy-allowlist.txt` (strangler-fig
pattern). The allowlist must only shrink — Danger.js warns on growth.

### Bilingual parity

`pt-BR.md` and `en-US.md` should be content-equivalent (not literal
translation — same coverage, idiomatic prose in each locale). Danger.js
warns if you only update one locale.

### Why this matters

Without doc discipline, the Handbook drifts from reality. A drifted
Handbook is worse than no Handbook — it lies confidently. The
5-minute cost of updating docs alongside code is small; the cost of
debugging based on stale docs is enormous.

## Boundaries

- Never edit `mcp/generated/`, `schemas/feature.schema.json`,
  `docs/handbook/_meta/xrefmap.yml`, or `public/llms.txt` by hand. They are
  generated. Run the corresponding `npm run gen:*` script, or `npm run gen:all`
  to regenerate everything at once.

- Never bypass the bilingual co-change rule by editing one locale only. If
  the translation isn't ready, add a `<!-- TRANSLATION_PENDING -->` block in
  the missing-locale file and tag the PR `i18n-followup`.

- Never add a new path to the legacy lint debt overrides in
  `eslint.config.mjs`. New code is held to the strict ruleset.

- Never invent a new `level` value. The levels are defined in
  `schemas/feature.zod.ts` and described in
  `docs/handbook/_meta/handbook/en-US.md`. To add or change a level,
  open a discussion before touching the schema.

- Never edit a Handbook entry's `uid` after creation. UIDs are stable
  identifiers; renames go through deprecation (set `status: deprecated`,
  add a successor entry, link via `related`).

- Never mix Zod 3 and Zod 4 imports in the same file. Code under `schemas/`,
  `scripts/build-*.ts`, and any new code that consumes the feature.yml schema
  imports from `"zod/v4"`. Existing code under `src/lib/validators/`,
  `src/lib/validations/`, `src/app/api/`, etc. continues to import from `"zod"`
  (which is Zod 3). Migration of the existing 75 files to Zod 4 is a separate,
  future etapa with its own scope.

# Internationalization (i18n)

The system supports `pt-BR` (default) and `en-US` as production locales.
`es-ES` is preserved as a template but not in production rotation.

## Adding a new locale

1. Add the tag to `SUPPORTED_LOCALES` in `src/lib/i18n/locales.ts`.
2. Create `src/lib/i18n/messages/{tag}.ts` mirroring `pt-BR.ts`.
3. Create a Prisma migration that drops and recreates the
   `chk_network_profile_locale_supported` constraint with the new locale.
4. Update `normalizeLocale()` if input mapping needs adjustment.
5. Add formatter tests for the new locale.

## Translation keys

All user-facing strings must use `useT()` (in client components) or `t()`
(in server code). Literal strings in JSX are flagged by ESLint in strict
paths (`src/lib/i18n/**`, `src/lib/ledger/**` today; more added per etapa).
Key naming convention: `{domain}.{feature}.{context}.{snake_case}`. The
`pt-BR.ts` dictionary is the source of truth for the `MessageKey` type.

## Localized formatting helpers

For locale-aware values, use the helpers in `src/lib/i18n/`:

- `formatDate(date, locale, preset)` — short, long, dateTime, time
- `formatNumber(value, locale, preset)` — integer, decimal, percent, compact
- `formatRelativeTime(date, locale, now?)` — "2 hours ago" / "há 2 horas"
- `pluralize(count, locale, forms)` — picks the right plural form
- `compareCollation(locale, options?)` — sort comparator respecting locale
- `formatMoney(money, locale)` — currency display in user's locale

Never use `Intl.*` APIs or `toLocaleString` directly. Always go through
the helpers — they centralize locale handling and avoid drift.

## Locale persistence

User locale choice is persisted twice:

- Cookie `locale` for immediate effect (1-year expiry).
- `NetworkProfile.locale` for cross-device stickiness (when authenticated).

The server action `setLocaleCookie(locale)` writes both. The hook
`useSetLocale()` invokes it from client components and refreshes the
route to apply the change.

## CI gate

`npm run check:i18n` validates that every translation key used in the
codebase via `t()` or derivative calls exists in `pt-BR.ts`. Running this
in CI prevents regressions where a key is referenced but forgotten in the
dictionary.


## i18n implementation pattern

When internationalizing UI strings of a feature, follow the canonical pattern
documented in `docs/discovery/I18N_PATTERN.md`. Key points:

- Server Components read locale via `getLocale()` and pass as prop.
- Client Components use `useT()` for translation keys; receive `locale` as
  prop for formatters.
- Utility components (`<Money>`, `<DateLabel>`, etc.) accept `locale` as prop.
- Error classes carry a `code: string`; UI consumes via `translateError` /
  `translateErrorWithT` from `src/lib/i18n/translate-error.ts`.
- Enum-to-key mapping uses `as const satisfies Record<Enum, MessageKey>`.

The Ledger (Phase 1.5.4) is the reference implementation. Mirror its structure.

### Common namespace

Strings reused across ≥3 features live in `common.*` (subnamespaces:
`actions`, `states`, `placeholders`, `confirmations`, `feedback`, `time`,
`units`). Strings used in 1-2 features stay in the feature's namespace.

The structure was established in Etapa 1.5.5 (Admin Shell) and should be
extended only when new shared concepts emerge across multiple features.

### Toast notifications

Use the helpers in `src/lib/i18n/notify.ts` instead of `toast.*` directly:

- `notifySuccess(key, t, params?)` — green success toast.
- `notifyError(errorOrKey, t, params?)` — red error toast. Accepts either
  an Error object (looks up by error code) or a translation key (string).
- `notifyInfo(key, t, params?)` — neutral info toast.
- `notifyWarning(key, t, params?)` — yellow warning toast.

These are required for all user-facing notifications in migrated features.
They centralize translation handling and make the i18n contract explicit.
