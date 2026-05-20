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

## Tools manifest convention (cravada na Sub-etapa 3.8)

**Standalone tools:** declared in their own files at
`src/lib/tools/tools/<name>.tool.ts`, imported in `registry.ts` and
registered in the `standaloneTools` map. Cross-cutting capabilities
(chat, dashboard, handbook, knowledge, ledger, marketplace,
organization, profile) follow this pattern.

**Grouped tools:** declared inline inside
`src/lib/tools/categories/<category>.category.ts` under the
`tools: []` field of the category manifest. Tools tied to a single
business discipline (finances, legal, operations, sales, …) follow
this pattern.

Dual pattern accepted. Do **not** promote inline tools to separate
`.tool.ts` files without a functional driver (cosmetic refactor with no
gain). Conversely, do **not** demote standalone tools into a category
just for organization — standalone signals cross-cutting nature.

## Reserved blocks (cravado na Sub-etapa 3.8)

14 blocks live in `src/lib/blocks/blocks/` with zero references in any
tool or category manifest — preserved as forward investment:

`campaigns`, `community`, `deals`, `events`, `experiences`,
`feedbacks`, `locations`, `meetings`, `messages`, `notes`, `pages`,
`perks` (zero refs após Sub-etapa 3.5.5), `routines`, `voice`.

Trigger to revisit: product scoping crystallizes a tool that consumes
one of these, OR a housekeeping cycle decides to drop unused blocks
deliberately. Until then, the block manifests stay — they cost
nothing and removing them prematurely loses domain modeling work.

## Reserved area: `notification`

The `Area` union in `src/lib/tools/manifest.ts` declares 6 canonical
operational areas: `communication`, `transaction`, `workflow`,
`notification`, `identity`, `infrastructure`. Five are in use; the
sixth — `notification` — is reserved for future tools surfacing
alerts, broadcasts, push notifications. No current tool or category
uses it. Keep it in the union so the first notification tool lands
without a type system change.

## Exception: `dashboard` path = admin root

`dashboard.tool.ts` declares `paths.page: "src/app/admin"` (no
subpath). It is the only tool with a path at the admin root. Accepted
because the dashboard is semantically the admin home page —
`/admin/` itself, not `/admin/dashboard/`. Do **not** refactor into a
dedicated subdirectory without a UX trigger; the special-case is the
correct shape today.

# Tenancy

## requireSuperAdmin helper

Admin routes in `src/app/api/` use `requireSuperAdmin` (at `src/lib/auth/require-super-admin.ts`)
to enforce a valid session with role `super_admin`. Returns a 401/403 Response if invalid.
Pattern: call first, return the Response if it is one, then proceed with the session.

```typescript
const sessionOrResponse = await requireSuperAdmin();
if (sessionOrResponse instanceof Response) return sessionOrResponse;
const session = sessionOrResponse;
// session.user.id is now guaranteed
```

The check is performed at the start of each route handler, before `try {` and before
any Prisma queries. The helper uses `apiError` from `@/lib/api-utils` for consistent
error shape (`{ error: string, details?: unknown }`).

The `org_admin` concept does not exist in Camada 1 (YAGNI — 3 DEV orgs, all yours).
Introduce `org_admin` alongside a `Membership` table and drop of `NetworkProfile.email @unique`
when the product becomes real SaaS multi-tenant (same trigger package).

### Status Camada 1 Sub-etapa 3.5

All 6 admin integration routes use `requireSuperAdmin + withTenant`:
- `src/app/api/integrations/[id]/test/route.ts`
- `src/app/api/integrations/[id]/sync/route.ts`
- `src/app/api/integrations/[id]/connect/route.ts`
- `src/app/api/integrations/[id]/logs/route.ts`
- `src/app/api/integrations/[id]/mappings/route.ts`
- `src/app/api/integrations/airtable/import/route.ts`

`IntegrationTierMapping.tenantId` is NOT NULL (Migration 003).
`IntegrationSyncLog.tenantId` is NOT NULL (Migration 003 — all ISL writers in admin routes were wrapped with withTenant before promotion).
`IntegrationWebhookEvent.tenantId` remains nullable pending webhook tenant resolution (Sub-etapa 5/6).
`oauth/callback` deferred with TODO inline (token exchange does not carry orgId yet).

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

# Financial engine: invariants and meta-rules

The CFO-grade projection engine (`src/lib/financial-engine.ts`) and its
visual consumers under `src/components/financials/` were audited across
ten sub-threads (commits `91f163d` → `5b6c3ec`). The audit eradicated a
recurring bug class and crystallized a small set of rules. Read the
**procedure** in `.agents/skills/practice-financial-engine/SKILL.md`
before changing engine code; read the **technical map** in
`src/lib/financial-engine.README.md` for the per-field semantics. The
principles below are the layer above both.

## Aggregate scalars derive from `cohortProjection`

Every period-total scalar exported in `ScenarioResults` (period MRR,
COGS, commissions, overhead, welcome kit, breakage, …) is the
**average** of the per-month series in `cohortProjection`. Standalone
`Mo1Subs × something` computations multiplied by a UI multiplier are
forbidden — that pattern under-reported up to 5,697% over 36 months in
growth scenarios. UI consumers reading partial-period totals must
`sumOver(key)` (sum the first `m` months from `cohortProjection`)
instead of `scalar × m`.

## Per-month series is the source of truth

If a metric needs to scale with subscriber count, churn, or any
projection-state variable, emit it inside the projection loop using
`currentSubs` and add it to `cohortProjection[i]`. Do not compute it
once pre-loop and multiply. The doc block above
`const operationalOverheadMonthly = ...` in the engine carries the
canonical meta-lesson.

## "Approximation reasonable" comments are red flags

Justifying a `value × period` computation in code with prose like
"reasonable approximation for KPI summaries" usually rationalizes the
same anti-pattern A.2 / A.3.2 / D.2 / D.3.2 fixed. When tempted to
write that comment, aggregate from `cohortProjection` instead.

## Audit pinned reconciliation is single-byte

The audit scenario (50 acquisitions/mo, 5%/mo churn, 36mo) reconciles
to **$879,956** accrual revenue and **$990,498** cash revenue (diff
$110,542 = deferred biannual/annual prepayments). Any change that
moves these numbers is a regression. Asserted by tests in
`financial-engine.aggregate-scalars.test.ts` and
`financial-engine.arr-semantics.test.ts`.

## LTV/CAC is isolated from period aggregates

`results.ltvCac.*` and `results.tierDetails[].ltv` use only
per-subscriber steady-state math (`revenuePerSub`, `cogsPerSub`,
residual delay, churn). Aggregate-scalar refactors must not touch
this surface — if your change moves an LTV/CAC value beyond rounding,
your refactor escaped its boundary.

## Accrual and cash are dual, both correct

`cohortProjection[].revenue` is **accrual** (smoothed across cycle).
`cohortLifecycles[].months[].revenue` is **cash flow** (lumps at
billing months for biannual/annual). Both are emitted; the
`<AccountingBasisBadge>` and `<AccountingBasisReconciliation>`
components surface the reconciliation. Neither is "more correct" than
the other — they answer different CFO questions.

# Skill references

Three SKILL files codify the institutional knowledge accumulated during
Phase 1 and the financial-engine audit:

- `.agents/skills/ledger/SKILL.md` — invariants and conventions for the
  double-entry ledger (accounts, journal_entries, journal_lines).
- `.agents/skills/domain-events/SKILL.md` — invariants and conventions for
  the domain events outbox pattern. Canonical source has migrated to the
  Handbook (`docs/handbook/tools/infrastructure/domain-events/`); the SKILL
  file is preserved as a backward-compat shim.
- `.agents/skills/practice-financial-engine/SKILL.md` — procedure for
  any change touching the projection engine, its `ScenarioResults`
  surface, or the `src/components/financials/` consumers. Companion to
  the principles above and to `src/lib/financial-engine.README.md`.

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

## Tenancy

`Organization` is the tenant boundary. Each `NetworkProfile` owns one
personal Organization (1:1, V1). Four tables are tenant-scoped via
`tenant_id`:

- `MemberConnection`, `IntegrationTierMapping`, `IntegrationSyncLog` —
  `tenant_id NOT NULL` + FK + index. RLS strict policy applied
  (Sub-etapa 4) — see "Row Level Security" below.
- `IntegrationWebhookEvent` — `tenant_id` nullable + FK + index. RLS
  enabled but permissive policy (`USING true`) until webhook tenant
  resolution lands in Sub-etapa 5/6, when the column becomes NOT NULL
  and the policy tightens to strict.

**X1 — `Integration` is single-tenant.** The integration catalog is
plataforma-wide. `Integration.tenantId` stays nullable indefinitely,
and `Integration.slug @unique` global is preserved. Trigger to revisit:
first enterprise customer that needs their own OAuth app.

### Using `withTenant`

`src/lib/tenancy/context.ts` exports an `AsyncLocalStorage`-backed
helper. Wrap business logic in `withTenant(orgId, () => ...)`; queries
on tenant-scoped models inside the callback are auto-filtered by
`tenant_id`.

```typescript
import { withTenant } from "@/lib/tenancy/context";

const session = await auth();
return withTenant(session.user.activeOrgId, async () => {
  return prisma.memberConnection.findMany();
});
```

`requireTenantId()` reads the current context and throws if there is
none — use it at the entry of business-logic helpers that must run
under a tenant.

### ALS gotcha — sync `fn` returning a Promise

`AsyncLocalStorage` loses context if `storage.run(ctx, fn)` is given a
synchronous `fn` that just returns a Promise: the Promise's
continuations resolve after `storage.run` exits its scope and the
async-hook chain breaks. `withTenant` works around this by wrapping
the user `fn` with an internal `async () => fn()`. **Any new helper
that uses `AsyncLocalStorage` must do the same.**

```typescript
// wrong — context leaks before Prisma's continuations run
storage.run(ctx, () => prisma.x.findMany());

// right — internal async forces await inside the scope
storage.run(ctx, async () => fn());
```

### ESLint rule — `herd-tenancy/no-direct-prisma-on-scoped-models`

Bans `prisma.{memberConnection,integrationTierMapping,integrationWebhookEvent,integrationSyncLog}.X`
outside an enclosing `withTenant(...)` call. Static AST walk only — if
the prisma call is inside a helper function called from a `withTenant`
block, the rule cannot prove the chain. To declare an exception, add
an inline disable with a comment explaining the helper's contract:

```typescript
// eslint-disable-next-line herd-tenancy/no-direct-prisma-on-scoped-models
// — caller is always inside withTenant; see resolveTenantFromWebhookPayload.
const conn = await prisma.memberConnection.findFirst({ ... });
```

Legacy admin API routes and webhook handlers that pre-date Camada 1
are downgraded to `warn` in `eslint.config.mjs`. New code is held to
`error`. When you refactor a legacy route to wrap with `withTenant`,
remove its entry from the warn override list.

### Row Level Security (RLS) — Sub-etapa 4

Postgres RLS enforces tenant isolation at the database layer as
defense-in-depth behind the Prisma Extension's ORM-level filter. A
query that bypasses the ORM (raw SQL, missed Extension scope) is still
rejected by the DB.

**Architecture — 3 connection URLs:**

| Env var | Role | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgres` (pooler, port 6543) | Prisma migrations fallback |
| `DIRECT_URL` | `postgres` (session, port 5432) | Prisma migrations DDL — needs owner to `CREATE POLICY` |
| `RUNTIME_DATABASE_URL` | `herd_app` (session, port 5432) | Runtime app singleton — `NOBYPASSRLS` enforces policies |

`herd_app` was created in Sub-etapa 4 with `NOBYPASSRLS` explicitly.
**Do not alter that property.** It is the load-bearing assumption that
makes every RLS policy enforceable. The role has `GRANT ALL ON ALL
TABLES IN SCHEMA public` plus `ALTER DEFAULT PRIVILEGES FOR ROLE
postgres` so migrations creating new tables auto-grant to `herd_app` —
no manual GRANT step per migration.

`src/lib/prisma.ts` reads the URL via the precedence
`RUNTIME_DATABASE_URL ?? DIRECT_URL ?? DATABASE_URL`. Deploy environments
must set `RUNTIME_DATABASE_URL` alongside the others. If only the
fallback is wired, the singleton runs as `postgres` (bypassing RLS) and
the entire defense-in-depth layer is silently disabled.

**GUC mechanism.** Policies reference `current_app_tenant_id()`, a
helper function that returns the `app.tenant_id` GUC (or NULL when
unset, via `NULLIF(..., '')`). The Prisma Extension
(`src/lib/tenancy/prisma-extension.ts`) sets the GUC at the start of
each tenant-scoped operation by opening an implicit `$transaction` and
emitting `SELECT set_config('app.tenant_id', <uuid>, true)` as the
first statement. `SET LOCAL`/`set_config(..., true)` scopes the value
to the transaction only — no leak across pooled connections.

**Caminho B — implementation note.** Inside the Extension's
`$allOperations` handler, the original `query(args)` function does
**not** run inside the Extension's `$transaction` (Caminho A failed
the GUC observability test — Prisma 7 does not propagate transaction
context via AsyncLocalStorage for query-callbacks). The Extension
dispatches the operation on `tx` directly:

```typescript
const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
return await (tx as any)[delegateKey][operation](filteredArgs);
```

Any future Extension that needs `SET LOCAL` to apply to ORM calls
**must use the same pattern**. Trusting AsyncLocalStorage propagation
will silently fail (the GUC won't be visible from the operation's
connection) and policies will deny what they shouldn't.

**Cast + NULLIF.** RLS policies compare a UUID column to a TEXT GUC
return:

```sql
USING ("tenant_id" = current_app_tenant_id()::uuid)
```

The cast is required because `current_setting(...)` returns TEXT.
The helper wraps with `NULLIF(..., '')` so an unset GUC becomes NULL
rather than `''` — `''::uuid` raises `invalid input syntax for type
uuid`, which would surface as a runtime error instead of a clean
"deny by default". Apply the same `::uuid` + NULLIF pattern to any
future RLS policy referencing a UUID column and a GUC.

**`CREATE POLICY` ownership constraint.** Only the table owner (or a
superuser) can `CREATE POLICY`. `herd_app` is intentionally NOT the
owner. Migrations that create or alter RLS policies must run via
`DIRECT_URL` (postgres → owner). This already works because
`prisma.config.ts` uses `DIRECT_URL` and Prisma migrations run
through it. The constraint is invisible day-to-day but matters when:
(a) a migration unexpectedly fails with code 42501 — check whether
DIRECT_URL points at the owner; (b) running policy SQL via psql or
ad-hoc scripts — connect as `postgres`, not `herd_app`.

**Current policies:**

| Table | Policy | Type |
|---|---|---|
| `IntegrationSyncLog` | `isl_tenant_isolation` | Strict — `tenant_id = current_app_tenant_id()::uuid` |
| `IntegrationTierMapping` | `itm_tenant_isolation` | Strict |
| `member_connections` | `mc_tenant_isolation` | Strict |
| `IntegrationWebhookEvent` | `iwe_temp_permissive` | Permissive (`USING true`) — until Sub-etapa 6 makes `tenant_id` NOT NULL |

**Test architecture — two-connection pattern.** Integration tests
that touch tenant-scoped tables open two clients:

```typescript
const adminClient = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(process.env.RUNTIME_DATABASE_URL) });
```

`adminClient` (postgres, bypass) is used only for seed and teardown
that crosses tenant boundaries — analogous to migration-time setup,
not what the app does at runtime. `runtimeClient` (+ the Extension)
mirrors the production singleton and is what the assertions exercise.
Tests that conflate the two will either fail under RLS (using
`adminClient` shape with `runtimeClient` is forbidden cross-tenant) or
leak (using `runtimeClient` for setup may insert rows that pass RLS
under the wrong context). Mirror `isolation.integration.test.ts`.

**Breach test.** `src/lib/tenancy/__tests__/rls-breach.integration.test.ts`
is the canonical end-to-end proof: it runs raw `$queryRaw` outside the
Extension to confirm RLS blocks cross-tenant access even when the ORM
layer is absent. Three assertions — cross-tenant rejected, same-tenant
allowed, no-GUC rejected. **Do not delete or weaken these without
replacement coverage.** They are the only test surface that proves
the DB-layer guarantee.

**Tech debt cravados:**

- `DATABASE_URL` (pooler) still uses `postgres`. Trigger to migrate:
  first runtime client that requires pgbouncer transaction-mode pooling.
- 2 round-trips per tenant-scoped op (SET LOCAL + query). Optimize
  when p99 latency on tenant-scoped operations exceeds ~50ms in prod.
- `RUNTIME_DATABASE_URL` must be set in every deploy environment.
  Missing it silently falls back to `DIRECT_URL` (postgres), which
  bypasses RLS. Verify on each environment promotion.

# Webhooks

Inbound webhooks from external providers are signature-verified before any
business logic runs. The framework lives at `src/lib/webhooks/` and exposes
a single barrel (`src/lib/webhooks/index.ts`):

- `WebhookVerifier` — interface with `verify(rawBody: Buffer, headers): Promise<VerificationResult>`.
- One verifier class per provider:
  - `GorgiasWebhookVerifier` — HMAC-SHA256 hex, header `X-Gorgias-Signature`.
  - `IntercomWebhookVerifier` — HMAC-SHA256 hex with `sha256=` prefix, header `X-Hub-Signature`.
  - `RechargeWebhookVerifier` — **literal** `sha256(client_secret + raw_body)` hex (NOT HMAC), header `X-Recharge-Hmac-Sha256`.
  - `RecallWebhookVerifier` — Svix-style HMAC-SHA256 base64 over `${svix-id}.${svix-timestamp}.${body}`, key derived from `whsec_` secret. Headers: `svix-id`, `svix-timestamp`, `svix-signature`.
- `resolveTenantFromPayload(provider, payload)` — looks up `MemberConnection`
  by `(integration.slug, externalUserId)` to find the owning `tenantId`.
  Uses an admin (postgres, bypass-RLS) Prisma client because the resolver
  must read across tenants. This is the **one documented exception** to the
  "no direct Prisma on tenant-scoped models" rule.

## Recharge signing — DO NOT swap to createHmac

Recharge's wire format is `sha256(client_secret_bytes ++ raw_body_bytes)` —
the secret is hashed alongside the body, not used as an HMAC key. A unit
test in `recharge.verifier.test.ts` is explicitly named to fail loudly
if someone "modernizes" the implementation to `createHmac`:

> `it("uses sha256(secret+body) literal concatenation, NOT HMAC — changing to createHmac must fail this test", ...)`

If this test fails, the fix is to revert the implementation, not the test.

## Fail-closed defaults

Every verifier accepts the secret at construction time and rejects every
webhook with 401 when the secret is empty. Missing `*_WEBHOOK_SECRET` in
the environment is therefore a deny-all, not a bypass. Deploy environments
must wire all four `*_WEBHOOK_SECRET` env vars (Gorgias / Intercom /
Recharge / Recall) — missing any one stops that provider's webhook traffic
at the door.

## Raw body access in handlers

Handlers must read raw bytes via `request.arrayBuffer()` and wrap in
`Buffer.from(...)` — `request.text()` decodes through UTF-8 and re-encoding
the result for the verifier is lossy for non-UTF-8 sequences (rare for
JSON, but the verifier should still compute over original bytes). Parse
JSON only AFTER signature verification has passed.

## Tenant scoping post-verify

Handlers for Gorgias / Intercom / Recharge wrap business logic in
`withTenant(tenant.tenantId, ...)` after `resolveTenantFromPayload`
succeeds. Recall does not — `Meeting` is not in `TENANT_SCOPED_MODELS`.
If `Meeting` becomes tenant-scoped, add the wrap and route tenant
resolution through the meeting owner's organization.

## Async pipeline — dedup + outbox (Sub-etapa 6)

Production webhook delivery is at-least-once. The Gorgias ingress route
(template for the other 3 providers) splits work into two stages so the
ack stays under 500ms and retries never multiply downstream effects:

**Ingress (synchronous, < 500ms target):**
1. HMAC verify (`WebhookVerifier`).
2. Parse + extract provider-native `event_id` (Gorgias = `payload.id`).
   Reject 400 if absent — composite hashes as dedup keys are fragile and
   silently mask collisions.
3. `resolveTenantFromPayload`.
4. Fast-path `webhook_dedup.findUnique({ provider, event_id })` — if hit,
   return 200 `{ status: "duplicate" }` and bail.
5. One transaction: `webhook_dedup.create(...)` + `emitDomainEvent(...)`.
   Both rows commit together; if the provider concurrently retries, the
   second arrival hits the UNIQUE `(provider, event_id)` constraint and
   we catch `P2002` to return the same `{ status: "duplicate" }`.
6. Return 200 `{ status: "accepted" }`.

**Outbox handler (async, via `npm run worker:domain-events`):**
- The `domain-events` outbox stores `(aggregateType="webhook",
  aggregateId=<tenant uuid>, eventType="webhook.<provider>", payload)`.
- A SINGLE entry per provider is registered in `HANDLER_REGISTRY` —
  e.g. `"webhook.gorgias": gorgiasHandler`. The handler dispatches
  internally based on `payload.<provider>_event_type` (no wildcard
  support in the registry; no N-entries-per-event-type sprawl).
- Handler MUST be idempotent — same event may run multiple times.
- Handler wraps tenant-scoped writes in `withTenant(event.aggregateId)`.

**`webhook_dedup` table:**
- Platform-wide (no `tenant_id`, no RLS). Dedup keys are provider-scoped
  and tenants don't share `event_id` namespaces with the same provider.
- 30-day TTL via `expires_at` column default. **No cleanup job today** —
  tech debt. Trigger to add: row count > ~10M OR write contention on the
  unique index.

**Registry pattern — single eventType per provider, dispatch inside:**
- `HANDLER_REGISTRY` is a `Record<exact-string, DomainEventHandler>`.
  No wildcards; `getHandler(eventType)` is a direct map lookup.
- For webhooks, emit `eventType: "webhook.gorgias"` (uniform) and put
  the provider's own event type (e.g. `ticket.created`) in
  `payload.gorgias_event_type`. The handler reads payload and dispatches.
- Keeps the registry small and the table-of-handlers easy to scan.

# IntegrationAdapter

Sub-etapa 7 introduces a horizontal/vertical adapter hierarchy that unifies
the previously fragmented per-provider code (admin routes, webhook routes,
services, verifiers, handlers — up to 5 directories per provider).

## Layout (`src/lib/integrations/`)

| File / dir | Role |
|---|---|
| `adapter.interface.ts` | Horizontal base: `IntegrationAdapter`, `AdapterConfig`, `HealthCheckResult`. Lifecycle hooks (`onConnect`, `onDisconnect`, `onHealthCheck`) are optional. |
| `manifest.schema.ts` | Zod 3 schema for `IntegrationManifest`. Validates at registry load (Decision #4). |
| `capabilities.ts` | `CapabilityFlagsSchema` — coarse-grained flags used by orchestrator routing without `instanceof`. |
| `payment/payment-adapter.interface.ts` | Vertical: `PaymentProviderAdapter extends IntegrationAdapter`, narrows `manifest` to `PaymentProviderManifest`. |
| `payment/payment-manifest.schema.ts` | `PaymentProviderManifestSchema` — extends base with `chargeModel`, `supportedCurrencies`, `supportsBillingPortal`. |
| `integrations/{slug}.integration.ts` | One file per adapter. Each exports a `{slug}Adapter` constant. |
| `registry.ts` | Explicit array → `Map<string, IntegrationAdapter>` lookup. Validates each manifest (base + vertical where applicable) and detects duplicate slugs and slug/manifest mismatch. |
| `index.ts` | Barrel — consumers import only from here. |

## Convention — adding an adapter

1. Create `src/lib/integrations/integrations/{slug}.integration.ts` exporting
   `{slug}Adapter: IntegrationAdapter` (or `PaymentProviderAdapter` for the
   payment vertical). The literal `slug` field must match the file basename
   and must match `manifest.slug`.
2. Add an `import { {slug}Adapter } from "./integrations/{slug}.integration"`
   line to `registry.ts` and append to the `adapters` array. **Do not** use
   side-effect auto-registration — bundler tree-shaking can drop the side
   effect. Explicit array mirrors `blocks/registry.ts` and `tools/registry.ts`.
3. Manifest validation runs at registry build (module load). A malformed
   manifest throws before any request hits a route.

## Zod 3 — no mixing with Zod 4

This module imports from `"zod"` (Zod 3) only. The cross-cutting rule from
the [Tenancy boundaries] section applies: `feature.yml` schema code uses
`"zod/v4"`; everything else, including this module, uses `"zod"`.

## Verticals

`PaymentProviderAdapter` is the only vertical implemented today. Adding a
new vertical (e.g. `SupportProviderAdapter`, `MessagingProviderAdapter`) is
explicitly **deferred until a real caller demands it** (Decision #2). A
vertical justifies its existence by adding typed methods or required
manifest fields that downstream code calls without `instanceof` — never as
"future-proof" speculation.

## Recharge BILLING vs PAYMENT

Decision #9: the `category` literal for Recharge (`BILLING` vs `PAYMENT`)
is set to `BILLING` here as a working choice for Sub-etapa 7 manifest
validation. The final cravamento happens in Sub-etapa 10 when
`RechargeAdapter` is implemented against the real OAuth/HTTP surface and
the orchestrator starts consuming the category-derived UI. The schema
(`PaymentProviderManifestSchema`) accepts both literal values, so changing
the single line in `recharge.integration.ts` later is a non-breaking edit.

## Capability flags — additive

`CapabilityFlagsSchema` starts with the set derived from the 4 guinea-pig
manifests. New capabilities are added as **optional** fields (Zod
`.optional()`) so that existing manifests keep validating without
modification. If a flag becomes universally required, promote it from
optional to required in a dedicated commit and update all manifests in
the same change — never silent-fail a new requirement.

## Tech debt — 32 services not adopted

The `src/lib/services/{provider}.ts` directory holds 36 HTTP-client
wrappers (airtable, asana, attio, slack, zoom, …). Only 4 are adopted by
the adapter hierarchy in Sub-etapa 7: gorgias, intercom, recharge, recall-ai.
The other 32 stay as plain service files. **Trigger to adopt:** the
provider needs structured behavior beyond a wrapper — webhook handling,
OAuth flow, manifest-driven UI, orchestrator routing. Adding an adapter
without a real driver is over-engineering.

# Recall integration — divergência arquitetural consciente

Recall webhooks do **NOT** use the `domain_events` outbox (Sub-etapa 6).
The decision is recorded as Decision B in Sub-etapa 8.5 and applies until
the trigger fires.

**Why no outbox?** The outbox emit requires `aggregateId: <tenant UUID>`
(validated as UUID at emit-time). `Meeting` is not in `TENANT_SCOPED_MODELS`
and has no FK to `Organization` — there is no path `Meeting → tenantId`
that could feed `aggregateId`. Forcing outbox adoption would require a
schema change (new FK + backfill + RLS + adding `Meeting` to
`TENANT_SCOPED_MODELS`) with no proportional benefit:

- The Meeting status state-machine is synchronous by UX requirement — the
  admin UI flips on the same render cycle as the webhook arrival; moving
  the flip behind a worker introduces visible lag.
- Idempotency is achieved differently: the canonical pipeline
  (`src/lib/meetings/process-recording.ts`) skips each step if its output
  already exists. Replays from Recall, cron orphan recovery, or manual
  retries don't re-charge Deepgram or Anthropic.
- Resilience comes from `meetings-sync` cron, which covers both
  `RECORDING` orphans (waiting for `done` from Recall) and `PROCESSING`
  orphans (>15 minutes in PROCESSING — pipeline died mid-flight). Both
  paths delegate to the canonical pipeline.

**Trigger to revisit Decision B:** `Meeting` gains tenant scope (FK
`tenantId` + entry in `TENANT_SCOPED_MODELS`). At that point the outbox
fit is natural and the Recall handler can adopt the Sub-etapa 6 pattern.

## Canonical pipeline — `src/lib/meetings/process-recording.ts`

Single source of truth for Recall post-meeting processing. Three callers
delegate to it (Sub-etapa 8.5):

| Caller | Options |
|---|---|
| Recall webhook route (`POST /api/integrations/recall/webhook`) | defaults (transcribe + summarize, no insights, no knowledge save) |
| Cron with agent (`meetings-sync` → `processCompletedMeeting`) | mapped from `MeetingAgentConfig` (autoTranscribe, autoSummarize, generateNextSteps, generateSuggestions) + `saveToKnowledge: true` |
| Cron fallback (`checkCompletedRecordings`) | `saveToKnowledge: true` (no insights — matches pre-8.5 behavior exactly) |
| Cron orphan recovery (`PROCESSING > 15 min`) | defaults (matches webhook semantics) |

**Idempotency contract.** Skip the expensive step if its output is
already present:

- `meeting.transcript` non-null → skip download + transcribe + Update#1.
- `meeting.summary` non-null → skip summarize + Update#2.
- Both present + `saveToKnowledge: false` → zero external calls.

**Status contract.** The function does NOT set `status: PROCESSING` on
entry — callers do that when they transition the Meeting into the active
pipeline. The function flips to `READY` after Update#1 lands.

**Error contract.**
- `summaryError` (text NULL) — partial failure of the optional summarize
  step. Meeting stays `READY`. Logged via `console.error`.
- `errorMessage` — fatal pipeline failure (transcribe stage or earlier).
  Status flips to `ERROR`.

**Audio URL** is always fetched via `RecallAiService.getBot(externalBotId)`.
No caller passes `audioUrl` as an argument — fonte única eliminates the
"which `audioUrl` is the caller using?" debug class.

## `summaryError` vs `errorMessage` — convention

Codified across the codebase, not just Meeting:

- `errorMessage` — fatal failure that invalidates the row's primary
  purpose. Status field (where present) flips to `ERROR`/equivalent.
- `summaryError` (and similar `<feature>Error` columns) — partial failure
  of an optional sub-step. Row remains valid for its primary use.

When adding a similar feature to another model, follow the same split —
do not conflate "the summary failed" with "the whole thing failed".

# Billing schema (Camada 1, Sub-etapa 9)

11 tabelas tenant-scoped: `payment_providers`, `billing_customers`,
`payment_methods`, `subscriptions`, `charges`, `charge_line_items`,
`invoices`, `refunds`, `dunning_attempts`, `portal_sessions`,
`billing_events`. Todas com `tenant_id NOT NULL` + RLS estrita +
`provider_data JSONB` preservando o payload bruto do provider.

`ChargeStatus` enum canonical (8 estados: QUEUED, PENDING, SUCCESS,
FAILED, REFUNDED, PARTIALLY_REFUNDED, SKIPPED, CANCELLED) normaliza o
status entre providers — Recharge fala `success`, outros providers
falariam `paid`/`completed`, e tudo converge no enum.

`ChargeLineItem` é junction N:N (`charge_id` ↔ `subscription_id`).
Necessário porque providers como Recharge agregam múltiplas
subscriptions num único charge composto; sem junction, ou duplicamos
charges (total errado por cliente) ou perdemos atribuição por tier
(receita errada por tier). Sem `external_id`/`provider_id` próprio:
o line item é split interno, não entidade do provider.

Integração com as primitives de Ledger (`Account` / `JournalEntry` /
`JournalLine`) é **Camada 3**, fora de escopo da Camada 1. O hook
naturalizado será `JournalEntry.sourceKind = 'charge'` com
`sourceId = charges.id`.

Os 11 modelos estão em `TENANT_SCOPED_MODELS` —
`herd-tenancy/no-direct-prisma-on-scoped-models` ESLint rule cobre
desde o seu commit. Tipos ergonômicos em `src/lib/billing/types.ts`
(re-exports do Prisma client).

# Test patterns — práticas operacionais

## Back-dating `updatedAt` em testes

Models Prisma com `@updatedAt` não aceitam `updatedAt` arbitrário via
`prisma.update()` — o `@updatedAt` pin sobrescreve o valor para `now()`
em qualquer write via ORM. Tests que precisam simular "row antiga"
(ex: cron orphan recovery testando threshold `updatedAt < now - 15min`)
devem usar `$executeRaw`:

```typescript
await adminClient.$executeRaw`
  UPDATE "<table>" SET "updatedAt" = ${cutoff} WHERE id = ${id}::uuid
`;
```

Este é o único caminho confiável. Reinventar via timestamps mockados ou
clock injection criaria divergência entre o DB real e a expectativa do test.

# Fase 3 close-out — Network MLM removal (2026-05-18 → 2026-05-20)

Fase 3 removeu o conceito de Network MLM e estruturas associadas. Sumário
do que saiu e do que ficou. Para o histórico transactional, ver tags em
origin com prefixo `archive/sub-etapa-3-*` (PRs #31 a #39).

**Schema:**
- 24 tabelas dropadas: 13 Network*, 7 Commission*, 4 D2D / Partner.
- 6 enums dropados: `OrgRoleType`, `AgreementStatus`, `LedgerEntryType`,
  `LedgerEntrySource`, `OverrideEffect`, `PayoutCadence`.
- `NetworkProfile` cleanup: removidas colunas `parentId`, `profileTypeId`,
  `networkType` — identidade pura (14 campos).
- `NetworkProfileType` + `NetworkCompensationPlan` dropados.
- `PartnerBrand` + `PartnerTierAssignment` dropados (Perk + PerkTierAssignment
  já existiam paralelos; concept consolidado em Perk).
- Reverse rels limpas em `SubscriptionTier` e `RankTier`.

**Code:**
- `src/lib/permissions.ts` (RBAC zumbi) deletado.
- 11 rotas `/api/network/*` + 17 pages `/admin/network/*` deletadas.
- ~16 rotas Commission/Partner/D2D + ~7 components legacy deletadas.
- 12 validators dedicados deletados.
- 8 rotas `/api/partners/*` + 3 pages `/admin/blocks/partners/*` deletadas.
- `networkTool` substituído por `organizationTool` + `profileTool`.
- `area: string` promovido para `Area` union literal (6 áreas canonicais).

**Preservado intencionalmente:**
- `NetworkProfile` model — identidade pura (14 campos, 7 reverse rels para
  preserved models). É o User do HERD; rename para `User` está cravado em
  Tech debt.
- Enum `NetworkType` — `Department` ainda usa.
- Enum `ProfileStatus` — `NetworkProfile.status` usa.
- `Perk` + `PerkTierAssignment` + `PerkStatus` — catálogo canonical de benefícios.
- `wizard-progress.tsx` movido para `src/components/shared/`.

**Aprendizados cravados em skills:**
- `chat-code-handoff` v0.2.0 — 5 lições de discovery patterns (L1-L5).
- `practice-housekeeping-git` v1.2.0 — seção worktree operations.

# Tech debt — rastreado

Débitos com trigger explícito de resolução. Não tocar sem trigger ou
produto decidir.

## Camada 1

- **Multi-tenant Recharge connect** (Sub-etapa 10). Tokens hoje em
  `Integration.credentials` platform-wide. Trigger: primeiro cliente
  enterprise que pedir multi-Recharge.
- **OAuth callback hardening** (Sub-etapa 10.5). HMAC-signed state +
  `requireSuperAdmin` na rota de connect. Trigger: quando Sub-etapa 10
  retomar.

## Fase 3

- **Rename `NetworkProfile` → `User` + `ProfileStatus` → `UserStatus`.**
  `NetworkProfile` é o User do HERD; nome cosmético antigo permanece por
  inércia para evitar churn de imports em ~40 arquivos. Trigger: produto
  requer identidade explícita "User" como conceito (ou primeiro feature
  novo que torna `NetworkProfile` confuso na leitura).
- **`validate-handbook-graph` não valida `source_paths` físicos.** Entry
  stale apontando para arquivo deletado passou CI em 3.7 (entry `network`
  ficou apontando para `network.tool.ts` que foi deletado, descoberto na
  discovery 3.9 e cleaned up nesta sub-etapa). Trigger: próximo refactor
  do validator OU próximo caso de stale entry detectado em discovery.

## Cron auth fail-open quando `CRON_SECRET` unset

`src/app/api/cron/meetings-sync/route.ts` (e demais rotas em
`src/app/api/cron/*`) implementam a auth como:

```typescript
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Quando `CRON_SECRET` está unset, a guarda **skipa** — qualquer request
público alcança o handler. Funciona em DEV/test (intencional), mas se
um deploy externo for feito sem setar `CRON_SECRET`, o cron fica
publicamente acessível sem aviso.

**Trigger para resolver:** primeiro deploy externo, primeira produção
real, ou primeira preocupação concreta com cron acessível. Fix é
trivial:

```typescript
if (!cronSecret) throw new Error("CRON_SECRET required");
if (authHeader !== `Bearer ${cronSecret}`) throw new Error("Unauthorized");
```

## Concerns acumulando em `meetings-sync` cron

A rota cron `src/app/api/cron/meetings-sync/route.ts` hoje executa 4
responsabilidades num único endpoint: (1) calendar sync, (2)
completed-recordings check via agent pipeline, (3) completed-recordings
check fallback, (4) PROCESSING orphan recovery. Não é problema
imediato — funciona — mas o número de mocks que o test de integração
precisa para isolar um caminho específico (mockar 4 módulos para testar
o orphan recovery) revela que o endpoint mistura concerns.

**Observação (não débito formal):** considerar split em sub-rotas se
passar de 5 responsabilidades.

# Camada 1 — Retomada Sub-etapa 10 (API Key path)

Pivot de OAuth Partner App para API Key direta após confirmação do
engenheiro Recharge da Bucked Up: "none of the other client id client
secret stuff made any sense for recharge. it's all based on the api key."

**Setup atual:**
- Admin API key em `RECHARGE_API_KEY` (encriptada em `Integration.credentials`).
- Webhook events registrados manualmente no dashboard Recharge — V1
  single-tenant (Bucked Up storefront).
- Storefront tokens: separados, virão quando produto requerer checkout
  customer-facing.

**Sub-etapas pendentes da Camada 1:**

- ✅ Sub-etapa 10 (revised) — Recharge API Key integration + webhook outbox
- ⏳ Sub-etapa 11 — Mapper raw → canonical billing schema
- ⏳ Sub-etapa 12 — Cutover + observability + done Camada 1

**Tags de marco:**
- `camada-1-pause-pre-recharge` — início da pausa (pré-Fase 3).
- `camada-1-resume-post-fase-3` — retomada (post-Fase 3 close).

**Tech debt rastreado (Camada 1 — Recharge V1 → V2):**
- **Multi-tenant webhook subscription via API.** Atualmente dashboard-
  managed (manual). Trigger: primeiro tenant adicional além de Bucked Up.
- **Backfill histórico Recharge** (customers/subscriptions/charges
  pré-cutover). V1 é forward-flow only. Trigger: produto precisar de
  analytics histórica.
- **Storefront Token integration** (browser-side, customer-facing
  portal). Trigger: HERD UI customer-facing checkout/portal.

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

# Pre-commit hooks

Pre-commit hooks run via [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks),
configured in `package.json`. The hook executes:

```
npm run lint && npm run typecheck && npm test
```

before accepting a commit. It is auto-installed on fresh clones via the
`postinstall` script (chained after `prisma generate`), so `npm install`
in a new checkout sets up `.git/hooks/pre-commit` automatically. The
hook file itself is not versioned.

**Bypass** with `git commit --no-verify` when appropriate:
mid-rebase, intentional WIP, fix-up commits that will be squashed,
emergency hotfixes where the gate would block legitimate work. Not as
a reflex to escape gates — if a gate fails, fix it first.

CI continues to be the canonical gate (`.github/workflows/ci.yml` runs
the same three commands plus `prisma validate` and `check:i18n`). The
local hook is redundancy — it catches problems before push, not as a
substitute for CI.

## Typecheck carve-outs

Three files are currently excluded from `tsc --noEmit` via top-of-file
`// @ts-nocheck` directives. Each carries an inline comment naming the
pending decision and pointing here. Carve-outs exit when the
corresponding decision lands; new files **do not** enter this list
without explicit discussion.

| File | Pending |
|---|---|
| `src/lib/meeting-prep/specialist-templates.ts` | Schema mismatch: 15 object literals miss the `enabled` field on `SpecialistTemplate`. Default value is a product decision (Thread `meeting-prep-templates-enabled`). |
| `src/components/tools/meeting-prep/specialist-template-card.tsx` | Base UI primitive does not support `asChild`; component-composition refactor required (Thread `meeting-prep-card-base-ui`). |
| `src/lib/tools/categories/sales.category.ts` | Uses permission value `"manage"` not in the current enum (`"read" \| "write" \| "read-write"`); enum expansion or value reconciliation needed (Thread `tools-permission-enum`). |

The same precedent rule from the [Lint debt](#lint-debt) section
applies: new code is held to the strict ruleset; carve-outs only
shrink. If your work would add a fourth file to this list, push back —
the carve-out is a signal to fix the underlying issue, not a place to
park it.
