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
  the domain events outbox pattern.

Read the relevant SKILL before making any change that touches the
corresponding subsystem. The SKILLs are versioned (semver) and have a
"how to update" section explaining the procedure.

# Invariant audit

`npm run check:invariants` runs three database-level checks:
1. Every journal entry balances per currency.
2. Every account code matches the naming regex.
3. Every journal line currency matches its account currency.

Use as operational audit (post-restore, periodic, after major schema
changes). Not wired into CI because CI does not provision a database.
The constraints from Etapas 1.2 and 1.6 should make violations impossible —
the script is defense-in-depth.

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
