<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Block Sub-Agent Architecture

ComeçaAI uses a block-based architecture where each feature module ("block") is self-contained and composable.

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

**Sub-etapa 20 — Membership foundation landed.** `OrganizationMember`,
`MembershipRole`, and `OrganizationInvitation` tables exist. `NetworkProfile.isSuperAdmin`
boolean flag added (DB-backed dual-check alongside env check).

**Sub-etapa 20.1 — `Organization.ownerId` dropped.** Column `owner_id` removed from
`organizations` table. Ownership is now exclusively via `OrganizationMember` rows.
`resolveActiveOrgIdForProfile` is primary-only (Membership lookup). Backfill invariant:
every real `NetworkProfile` has at least one active `OrganizationMember`. Pending
Sub-etapa 24: invitation flow UI/API.

**Sub-etapa 21 — Permissions + RBAC foundation landed.** `src/lib/permissions/` module
delivered: `types.ts` (Actor, Permission, ResourceType, ActionType), `role-permissions.ts`
(`ROLE_PERMISSIONS` hardcoded V1 — tech debt: DB-driven RolePermission table post-Fase 4),
`can()` pure function (super_admin bypass, org-scoped, dept-scoped), `getActor()` per-request
DB lookup (no JWT caching), `requireOrgRole()` route guard (same Session|Response shape as
`requireSuperAdmin`). 7 routes migrated: departments (list, tree, [id] CRUD, members),
locations (list, [id] CRUD), org-chart/internal. 6 integration routes intentionally keep
`requireSuperAdmin` (platform-level). 17 unit tests added.

`requireSuperAdmin` dual-check (Sub-etapa 20): session `role === "super_admin"` (primary)
OR `networkProfile.isSuperAdmin === true` DB fallback. Both paths return the session.

`resolveActiveOrgIdForProfile` (Sub-etapa 20.1): primary-only via
`organizationMember.findFirst` by `networkProfileId + status ACTIVE`. ownerId fallback
removed post-validation.

**Hotfix cravado (Sub-etapa 20):** When a migration drops a `@unique` constraint, the
Prisma client is regenerated immediately (shared `node_modules` in worktree setup).
Any `findUnique` using that field anywhere in the codebase — including the MAIN repo —
breaks at runtime even before the PR merges. Apply compatible code changes to main
directly as a hotfix; do not wait for the PR.

**Hotfix pattern extended (Sub-etapa 20.1):** When a column is dropped, the Prisma
client immediately rejects any reference to it — including in seed files, integration
tests, and auth helpers in the MAIN repo. The same hotfix-to-main pattern applies:
update all references in main before the PR merges, or build will fail.

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

# Observability — Camada 1 minimal (cravada na Sub-etapa 12)

**Health endpoint:** `GET /api/health` returns:
- `db.connected` — DB ping status
- `outbox.pending` — events still pickable (attempts < MAX_ATTEMPTS, no `processedAt`)
- `outbox.exhausted` — events with `attempts >= 5` (DLQ proxy)
- `outbox.lastProcessedAt` — timestamp of the most recent successfully-processed event

Returns 200 on success, 503 if the DB is unreachable.

**Worker invocation in production:** `GET /api/cron/domain-events-sync`
invokes `processPendingEvents({ limit: 50 })`.

- Auth: `Authorization: Bearer ${CRON_SECRET}` header.
- Triggered by Railway scheduled job (every 1 min, V1).
- Single-responsibility: pick up to 50 pending events, run handlers, update
  outbox state. Each event in its own tx — partial success across batch.
- Standalone CLI still available: `npm run worker:domain-events`.

**DLQ — eventos exhausted:**

When an event reaches `attempts >= MAX_ATTEMPTS` (5) and still fails,
`processPendingEvents` sets `nextAttemptAt = null` and leaves
`processedAt = null`. The event becomes non-pickable — `findPendingEvents`
filters it out via the `attempts < MAX_ATTEMPTS` predicate. It stays in
`domain_events` permanently with `lastError` populated.

**Query canonical para listar eventos exhausted:**

```sql
SELECT id, "eventType", "aggregateType", "aggregateId",
       attempts, "lastError", "createdAt"
FROM domain_events
WHERE "processedAt" IS NULL
  AND attempts >= 5
ORDER BY "createdAt" DESC;
```

**Reprocessing manual:** after fixing the root cause, reset the event so
the next worker run picks it up again:

```sql
UPDATE domain_events
SET attempts = 0,
    "nextAttemptAt" = NOW(),
    "lastError" = NULL
WHERE id = '<event-uuid>';
```

**Tech debt rastreado (Camada 1 V1 → V2):**
- Structured logging (pino). Trigger: external dashboards/alerting.
- `/api/metrics` Prometheus-style endpoint. Trigger: produto requer dashboards.
- Admin UI for DLQ inspection + one-click reprocess. Trigger: 5+ eventos
  exhausted acumulados, ou primeira ops complaint sobre query SQL manual.
- Cron auth fail-open quando `CRON_SECRET` unset (já cravado em Tech debt).
- Per-handler success/fail stats nas últimas 24h. Trigger: análise de erro pattern.

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

ComeçaAI uses a 4-artifact doc system organized into a 3-level hierarchy. Before
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

The Handbook (`docs/handbook/`) is the source of truth for what ComeçaAI
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
personal Organization (1:1, V1). Tenant-scoped tables use `tenant_id NOT NULL`:

- `MemberConnection`, `IntegrationTierMapping`, `IntegrationSyncLog` —
  `tenant_id NOT NULL` + FK + index. RLS strict policy applied
  (Sub-etapa 4) — see "Row Level Security" below.
- `IntegrationWebhookEvent` — `tenant_id` nullable + FK + index. RLS
  enabled but permissive policy (`USING true`) until webhook tenant
  resolution lands in Sub-etapa 5/6, when the column becomes NOT NULL
  and the policy tightens to strict.
- 11 billing tables (`PaymentProvider`, `BillingCustomer`, `PaymentMethod`,
  `Subscription`, `Charge`, `ChargeLineItem`, `Invoice`, `Refund`,
  `DunningAttempt`, `PortalSession`, `BillingEvent`) — Sub-etapa 9.
- `Department`, `Location` — Sub-etapa 19. Both with `tenant_id NOT NULL` +
  FK + index. RLS strict policy applied. `Department` has composite unique
  `(tenant_id, slug)` replacing the old global slug unique.

**Sub-etapa 20 — Membership tables** (NOT tenant-scoped via `tenant_id`; scoped
via `organization_id` FK instead — these ARE the membership structure, not
tenant-scoped data tables):

- `organization_members` — N:N between `network_profiles` and `organizations`.
  `@@unique([organizationId, networkProfileId])`. RLS permissive `herd_app_full_access`.
- `membership_roles` — roles per membership (OWNER/ADMIN/MEMBER/…, scoped ORG or DEPARTMENT).
  FK to `organization_members` CASCADE. RLS permissive.
- `organization_invitations` — pending invitations with token + status. FK to
  `organizations` CASCADE + `network_profiles` SET NULL (createdBy). RLS permissive.

Enums added (Sub-etapa 20): `MembershipStatus`, `MemberRole`, `RoleScopeType`, `InvitationStatus`.

**Chat orchestrator + location provider (Sub-etapa 19).** `LocationProvider`
is a chat `DataProvider` that queries the now-tenant-scoped `Location` table.
The provider uses `eslint-disable` inline comments. The chat messages route
(`src/app/api/chat/agents/[agentKey]/messages/route.ts`) must establish
`withTenant` context before calling `searchData` for correct tenant isolation.
This is tracked as tech debt until the chat orchestrator is updated.

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
  preserved models). É o User do ComeçaAI; rename para `User` está cravado em
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
  `NetworkProfile` é o User do ComeçaAI; nome cosmético antigo permanece por
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

## Aplicar enable-rls.sql expandido em PROD

Atualmente PROD tem 21 tabelas platform-wide **sem RLS** (enable-rls.sql
nunca foi aplicada). Reaplicar `enable-rls.sql` contra PROD (versão
Sub-etapa 17.0.11.1) vai habilitar RLS + criar policies
`herd_app_full_access` permissive nas 21 tabelas. **Não muda
comportamento de queries herd_app** (policy é permissive), mas adiciona
defense-in-depth contra Supabase PostgREST exposed (anon/authenticated
ficam deny-all).

**Trigger para resolver:** quando PostgREST API for exposta para clients
externos (ex: mobile app consumindo Supabase REST direto), OU durante
hardening de segurança formal (auditoria, certificação).

**Como aplicar (quando o trigger fire):**

```bash
# Railway migration job ou direto via psql contra PROD:
PROD_DIRECT_URL=postgresql://... bash scripts/bootstrap-supabase-project.sh
```

O bootstrap é idempotente — role herd_app já existe em PROD, GRANTs
serão re-aplicados sem efeito, enable-rls.sql vai habilitar RLS +
criar as 21 policies. Zero downtime esperado (DDL é fast).

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
- Webhook events registrados via API (Sub-etapa 10.0.2) — conta
  `bucked_up_herd_hl` é headless e não expõe webhook management UI.
- Storefront tokens: separados, virão quando produto requerer checkout
  customer-facing.

**Webhook registration (Sub-etapa 10.0.2):**
- 3 CLI scripts via npm: `recharge:register-webhooks`, `recharge:list-webhooks`,
  `recharge:delete-webhook`.
- Idempotente: `register-webhooks` lista existentes, faz diff vs manifest,
  cria só os faltantes. Flag `--delete-obsolete` remove os que estão no
  endpoint mas fora do manifest. `--dry-run` mostra plano sem executar.
- Source of truth: `rechargeAdapter.manifest.webhookEvents` (9 topics:
  order/created, charge/{created,paid,failed,refunded}, subscription/
  {created,updated,cancelled,activated}).
- `charge/paid` tem fallback automático para `charge/succeeded` em 422
  (drift entre versões da Recharge API).
- Scripts abortam se URL resolvida for localhost (Recharge requer HTTPS).
- Base URL: `--base-url` arg override, fallback para `NEXTAUTH_URL`.

**Sub-etapas pendentes da Camada 1:**

- ✅ Sub-etapa 10 (revised) — Recharge API Key integration + webhook outbox
- ✅ Sub-etapa 11 — Mapper raw → canonical billing schema
- ✅ Sub-etapa 12 — Cutover + observability + done Camada 1
- 🚫 Sub-etapa 12.0.2 — OBSOLETA (substituída por Sub-etapa 17.0.8
  — smoke validation harness reutilizável cravado preventivamente
  pós-Camada 2; ver tag `camada-1-smoke-validated` e seção
  "Camada 1 smoke-validated").
- ✅ Sub-etapa 17.0.8 — Camada 1 smoke-validated (Plano_Camada_1.md
  + smoke harness + tenant seed enhancement)

## Mapper architecture (cravada na Sub-etapa 11)

Pattern para transformar payloads raw de billing providers em rows
canônicas no schema da Sub-etapa 9.

**Layout:** `src/lib/mappers/<provider>/` com funções puras, uma por
entidade. Primeiro provider implementado: `recharge` (8 arquivos —
types, helpers, e um mapper por entidade canonical).

**Conventions:**

- Cada mapper: `(client, payload, ctx) => Promise<string | void>`.
  Retorna o `id` (UUID) da row canônica para downstream FK refs.
- `client: PrismaClient | Prisma.TransactionClient` — recebe o cliente
  do handler, herda a Prisma Extension de tenancy automaticamente.
- `ctx`: `{ tenantId, providerId, ...resolvedRefs }`. Refs já resolvidas
  upstream (ex: `customerId` quando o mapper de Charge é chamado).
- Idempotência via `prisma.X.upsert` com unique constraint do schema
  (`@@unique([providerId, externalId])` no caso de billing rows).
- Amounts: providers que retornam strings/dollars convertem para cents
  Int via helper canonical. Recharge usa `map-amount-cents.ts`.
- Status enums: providers com vocabulário próprio mapeiam para enums
  canônicos (`ChargeStatus`) via helper. Loud-fail em unknown values.
- `provider_data` JSONB sempre preservado com payload completo do topic
  atual — Sub-etapa 9 cravou isso como source-of-truth para reprocessamento.

**Handler-mapper relationship:**

- Handler (`recharge.handler.ts`) é o dispatcher: parse outbox event →
  upsert `PaymentProvider` → resolve customer → invoca mapper apropriado
  → grava IWE legacy + BillingEvent audit.
- Mappers são **puros** — não decidem topic, não escrevem audit, só
  fazem upsert da entidade canonical.
- Stub helpers (`ensureSubscriptionStub`, `ensureCustomerByExternalId`)
  permitem ordem de chegada não-determinística (charge antes de sub
  cria stub que próximo `subscription/*` enriquece via upsert update).

**Schema deviations preservadas (Sub-etapa 11 Opção A):**

- `BillingCustomer` tem só `email` + `name?` — Recharge `first_name +
  last_name` consolidam em `name`. `phone` e outros campos vivem em
  `provider_data` JSONB.
- `Subscription.customerId` / `Charge.customerId` (não `billingCustomerId`).
- `ChargeLineItem` tem `amountCents` mas não `quantity` — Recharge
  `quantity` per line preservada em `provider_data`.
- `Subscription.status: String` (não enum). Recharge `active/cancelled/
  expired` persistidos verbatim.
- `Charge.status: ChargeStatus` (único enum em billing). Mapping table
  cravado em `map-charge-status.ts`.

**Próximo provider:** Stripe (quando vier) segue o mesmo layout
(`src/lib/mappers/stripe/` com mesma assinatura). Adicionar AGENT.md
para provider quando o segundo entrar — primeiro provider documenta o
pattern; segundo confirma a convenção.

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
  portal). Trigger: ComeçaAI UI customer-facing checkout/portal.

# Camada 2 — Braintree backend integration (cravada na Sub-etapa 13)

Segundo billing provider em paralelo a Recharge. Backend-only nesta camada
(UI checkout vem com Fase 5 Marketplace).

**Auth model:** triplet de API credentials (`merchantId` + `publicKey` +
`privateKey`) + environment indicator (`sandbox` | `production`).
Encrypted em `Integration.credentials` como JSON blob via AES-256-GCM
(mesma pipeline da Camada 1).

**Environment:** sandbox primeiro (Camada 2 V1). Production cutover é
tech debt rastreado — trigger: smoke test sandbox validado + cliente
requerer go-live.

**SDK vs fetch — decisão per-provider:** Camada 2 usa `braintree` npm
SDK (v3.37+). Decisão divergente de Recharge (fetch direto). Razões:
(1) signature verification proprietária com helpers built-in; (2) API
surface maior + GraphQL via SDK; (3) maturidade do SDK. Custo: ~5MB
bundle.

**Convenção cravada:** decisão SDK vs fetch é per-provider, baseada em
(a) complexidade de webhook signing, (b) maturidade da SDK do provedor,
(c) bundle size acceptable em backend. Não há regra única — Recharge
ficou com fetch porque API é simples e webhook signing tinha pegadinha
anti-HMAC que merecia controle direto; Braintree usa SDK porque o
contrário.

**Webhook scope V1 (12 topics):**

- Subscription (6): `subscription_charged_successfully`,
  `subscription_charged_unsuccessfully`, `subscription_canceled`,
  `subscription_trial_ended`, `subscription_went_past_due`,
  `subscription_expired`
- Transaction (3): `transaction_settled`, `transaction_settlement_declined`,
  `transaction_disbursed` (`transaction_settlement_pending` removido em
  Sub-etapa 14 — deprecated no SDK npm v3.37).
- Dispute (3): `dispute_opened`, `dispute_lost`, `dispute_won`

### Webhook pipeline (Sub-etapa 14)

**Format:** `application/x-www-form-urlencoded` com 2 fields:
`bt_signature` + `bt_payload`. Route handler usa
`await request.formData()` (divergente de Recharge/Gorgias/Intercom
que parseiam JSON via `request.arrayBuffer()`).

**Verification:** SDK `gateway.webhookNotification.parse(bt_signature,
bt_payload)` faz verify + parse numa única chamada. **Sem verifier
file dedicado** — Braintree é o primeiro provider sem
`WebhookVerifier` class em `src/lib/webhooks/verifiers/`. Justificativa:
SDK encapsula a assinatura proprietária e expor uma classe verifier
seria wrapper sem valor.

**SDK quirks descobertos em Sub-etapa 14:**

- `gateway.webhookTesting.sampleNotification(kind, id)` é método
  **de instância** do gateway (não `braintree.Test.WebhookTesting`
  static). Retorna `{bt_signature, bt_payload}` sincronamente —
  apesar do typing de `@types/braintree` v3.4 sugerir `Promise`.
- `notification.timestamp` é **string ISO-8601** em runtime, não
  `Date`. Route handler coerce defensivamente via `new Date(...)`.
- Sample notifications **NÃO incluem `customerId`** em nenhuma das 3
  classes (subscription/transaction/dispute). 1-tenant fallback em
  `tenant-resolver.ts` é essencial para testes; produção real envia
  customerId.

**Dedup composite key:** `${kind}:${subjectId}:${timestamp.toISOString()}`.
Braintree não emite event_id estável; composite é resistente a retries
provider-side (24h prod, 3h sandbox). `subjectId` extraído via switch
por kind (`subject.subscription.id` / `subject.transaction.id` /
`subject.dispute.id`).

**Tenant resolution:**
- `extractExternalId("braintree", notification)` em `tenant-resolver.ts`
  faz switch por kind:
  - subscription → `subject.subscription.customerId`
  - transaction → `subject.transaction.customer.id` ou `customerId`
  - dispute → `subject.dispute.transaction.customerId`
- V1 1-tenant fallback: se nenhum customerId extraído E existe
  exatamente 1 `MemberConnection` com `integration.slug = "braintree"`,
  resolve para esse tenant. Trigger para remover: multi-tenant
  Braintree (tech debt em "Camada 2 V1 → V2").

**Handler V1 — raw-IWE-only:**

- Route handler escreve `IntegrationWebhookEvent` atomicamente com
  `webhook_dedup` + `emitDomainEvent("webhook.braintree", ...)`.
- `braintreeHandler` em `src/lib/webhooks/handlers/braintree.handler.ts`
  é um observability shim — confirma o outbox round-trip mas não
  faz mapper dispatch (Sub-etapa 15).
- `HANDLER_REGISTRY` ganhou entry `"webhook.braintree": braintreeHandler`.

**Testing fixtures runtime-generated:** Tests não comitam fixtures
JSON. Geram `{bt_signature, bt_payload}` em runtime via
`gw.webhookTesting.sampleNotification(kind, id)` com credentials
determinísticas no `freshGateway()` helper. Roundtrip parse valida o
contrato SDK.

### Mapper layer (Sub-etapa 15)

**Layout:** `src/lib/mappers/braintree/` (10 arquivos). Paridade arquitetural
com `src/lib/mappers/recharge/` (Sub-etapa 11). Funções puras
`(client, payload, ctx) => Promise<string | null>` com idempotência via
`(providerId, externalId)` unique upserts.

**Escopo V1 (5 entidades canonical):**

- `mapBraintreeCustomer` — BillingCustomer (firstName + lastName → name)
- `mapBraintreeSubscription` + `ensureBraintreeSubscriptionStub`
- `mapBraintreeCharge` — Subscription stub se transaction tem subscriptionId
- `mapBraintreePaymentMethod` — silent skip se sem `paymentMethodToken`
- `upsertBraintreePaymentProvider` — catalog row helper

**Status helpers (loud-fail em unknown):**

- `mapBraintreeChargeStatus`: 13 Transaction.Status → 8 canonical ChargeStatus.
  - settled/settlement_confirmed → SUCCESS
  - settlement_declined/processor_declined/gateway_rejected/failed → FAILED
  - voided/authorization_expired → CANCELLED
  - submitted_for_settlement/settling/settlement_pending/authorizing/authorized → PENDING
- `mapBraintreeSubscriptionStatus`: Title Case + espaço → lowercase + underscore
  (ex: `"Past Due"` → `"past_due"`). `Subscription.status` canonical é `String`.

**`map-amount-cents.ts` duplicado:** copy direto do Recharge mapper (Opção A).
Trigger refactor para `src/lib/mappers/_shared/`: chegada do 3º provider.

**Handler dispatcher (`braintree.handler.ts`, refator Sub-etapa 14 → 15):**

- `subscription_*` → ensureCustomer → mapSubscription + para cada item em
  `subscription.transactions[]` chama mapCharge + mapPaymentMethod.
- `transaction_*` → ensureCustomer → mapCharge + mapPaymentMethod.
- `dispute_*` → audit-only via IWE upstream (V1).

**Customer resolution com synthetic stub fallback:**

- `customer.id`/`customerId` presente → upsert real
- Ausente (sample fixtures) → upsert synthetic
  `externalId = "tenant_${tenantId}_fallback"`, idempotente.
- Stubs convergem cross-replay; produção real sempre tem customer.id.

**Skipped V1 (tech debt abaixo):**

- `BillingEvent` audit row (entityId @db.Uuid incompatível com dispute.id
  string; Subscription/Charge têm UUIDs válidos mas adoption deferido).
- Refund mapping (no manifest topic V1).
- DunningAttempt.
- ChargeLineItem (Braintree não tem split equivalente Recharge).
- Canonical Dispute table.

**Tech debt rastreado (Camada 2):**

- **Production cutover Braintree** (sandbox → production). Trigger:
  smoke test sandbox validado + cliente requerer.
- **Webhook scope expansion** (12 → ~30 disponíveis). Trigger: produto
  requerer events extras (`partner_merchant_*`, `payment_method_*`,
  `disbursement_*`).
- **Marketplace integration** (sub-merchants Braintree). Trigger:
  Bucked Up modelo de negócio expandir para multi-vendor.
- **BillingEvent audit Braintree + canonical Dispute table.** Trigger:
  Sub-etapa 17 smoke real OU produto requerer audit log estruturado.
- **Refund + DunningAttempt mappers Braintree.** Trigger: scope expansion
  webhooks OU produto requerer histórico estruturado.
- **Multi-tenant Braintree** + remoção do 1-tenant fallback em
  `tenant-resolver.ts` + synthetic customer stub em handler. Trigger:
  primeiro tenant Braintree adicional.
- **E2E integration test Braintree (`braintree-e2e.integration.test.ts`).**
  Sub-etapas 14-15 cobriram por unit tests; e2e análogo a
  `gorgias-e2e.integration.test.ts` fica como follow-up. Trigger:
  Sub-etapa 17 smoke real.
- **`_shared/map-amount-cents.ts` factor-out.** Trigger: 3º provider
  precisando da mesma função (hoje duplicada Recharge + Braintree).

**Tag de marco:** `camada-2-start` em main (Sub-etapa 13 entrega).

## Camada 2 closeout (cravada na Sub-etapa 17)

Camada 2 — Braintree backend integration **completa em sandbox**.
Production cutover é tech debt rastreado. Pipeline end-to-end pronto:
adapter + service + webhook handler + mapper + dispatcher + dedup +
outbox + worker + tenant resolver.

**Janela:** 2026-05-21 (sub-etapas 13 → 17 em sequência rápida).

**Sub-etapas entregues:**

- **13** — Adapter manifest + Service + Auth (3-key) + Seed (PR #48,
  archive `archive/sub-etapa-13-braintree-adapter-6cb2f0b`)
- **14** — Webhook handler + outbox + tenant extractor (PR #49,
  archive `archive/sub-etapa-14-braintree-webhook-c3b20a2`)
- **15** — Mapper raw → canonical billing schema (PR #50,
  archive `archive/sub-etapa-15-braintree-mapper-1648c5a`)
- **17** — Closeout: test webhook CLI + handbook + Plano_Camada_2.md + tag

**Sub-etapa 16 removida.** Programmatic webhook registration **não é
possível em Braintree**. SDK npm v3.37 não expõe API de
`webhookEndpoint` (apenas `webhookNotification` + `webhookTesting`).
Control Panel UI é o único caminho de setup. Tech debt cravado:
quando Braintree publicar mutations GraphQL para webhook destinations,
revisitar.

**Decisões arquiteturais cravadas:**

- **SDK vs fetch é per-provider.** Braintree usa SDK (signing complexo
  + maturidade SDK + Bucked Up precedent). Recharge usa fetch (signing
  literal sha256 com pegadinha anti-HMAC merecendo controle direto).
  Não há regra geral.
- **3-key auth:** `merchantId` + `publicKey` + `privateKey` +
  `environment` (sandbox/production). Encrypted como JSON blob em
  `Integration.credentials`. `authType: "api_key"`.
- **Webhook signing via SDK helper:** `gateway.webhookNotification.parse()`.
  Primeiro provider sem verifier file dedicado em
  `src/lib/webhooks/verifiers/`.
- **Form-encoded body:** Braintree usa
  `application/x-www-form-urlencoded`. Route handler usa
  `request.formData()` (divergente dos outros 3 providers).
- **Dedup composite:** `${kind}:${subjectId}:${timestamp.toISOString()}`.
  Braintree não emite event_id estável.
- **Tenant resolver:** switch por kind + 1-tenant fallback para sample
  notifications.
- **Customer fallback:** synthetic stub `tenant_${tenantId}_fallback`
  para payloads sem customer.id. Idempotente.
- **V1 skipped:** Refund mapping, canonical Dispute table (audit-only
  via IWE), DunningAttempt, ChargeLineItem, BillingEvent audit row.
- **Webhook registration:** Control Panel UI manual. Test webhook via
  "Check URL" no painel ou `npm run braintree:test-webhook` (script
  local que bypassa Braintree).
- **SDK quirks documentados:** `gw.webhookTesting.sampleNotification`
  é instance method, `notification.timestamp` é string ISO,
  samples não incluem customerId.

**Lições cravadas:**

- **SDK vs fetch decision é per-provider**, não regra geral. Critério:
  complexidade de signing + maturidade SDK + bundle size.
- **Programmatic registration constraint** — Braintree não tem API.
  Documentar em integrações futuras que aceitam UI-only setup.
- **L7 cravado durante Camada 2:** `npm run build` local obrigatório
  para PRs tocando route handlers (Cache Components quirk).
- **practice-housekeeping-git v1.2.8 → v1.2.11** (4 anchors em Camada 2).
- **practice-housekeeping-git v1.2.27** (Sub-etapa 20.1) — column-drop hotfix pattern: when a column is dropped, the shared Prisma client regenerates immediately and any main-repo file referencing the field breaks at build time. Audit + hotfix main before PR merges.

**Tech debt rastreado pós-Camada 2:**

- **Production cutover Braintree.** Trigger: smoke sandbox validado +
  cliente requerer go-live.
- **Webhook scope expansion** (12 → ~30 topics).
- **Canonical Dispute table.** Trigger: dashboards de chargeback rate.
- **Marketplace integration** (sub-merchants Braintree). Trigger:
  modelo de negócio expandir.
- **Refund + DunningAttempt mappers.** Trigger: histórico estruturado.
- **ChargeLineItem Braintree.** Trigger: split per-item.
- **BillingEvent audit row Braintree.** Trigger: audit log estruturado.
- **Multi-tenant Braintree** + remoção de 1-tenant fallback.
- **E2E integration test Braintree.**
- **`_shared/map-amount-cents`** factor-out. Trigger: 3º provider.
- **Programmatic webhook registration.** Trigger: Braintree publicar
  mutations GraphQL para `webhookDestination`.

**Estado final Camada 2:**

- Pipeline end-to-end pronto em sandbox.
- 12 webhook topics manifesto V1.
- 32 novos unit tests (9 webhook handler + 23 mapper).
- Seed Braintree ativo em DEV.
- Production cutover steps documentados no handbook.
- Sub-etapa 16 cravada como "não-aplicável Braintree".

**Indicador de fechamento:** tag `camada-2-complete` em main (aplicada
pós-merge da Sub-etapa 17).

## Tenant activation flow (cravada na Sub-etapa 17.0.1)

**Conceito:** `Integration` é catalog **platform-wide** (Recharge / Braintree
existem como providers disponíveis). `MemberConnection` é o registro
"tenant X com profile Y ativou integration Z". O webhook tenant resolver
depende dessa row para escopar payload — sem `MemberConnection`, o
webhook retorna 400.

**Gap revelado pós-Camada 2:** `MemberConnection` só era escrita em
integration tests. Nenhum caminho de produção (UI ou seed) existia.
Webhooks reais (Recharge OR Braintree) falhariam 400 "tenant not found"
no ingress — gap silencioso até o smoke da Sub-etapa 17 expor.

**Caminho V1 (cravado):** script seed
`npm run seed:connection -- --slug=<provider>` (aliases:
`seed:braintree-connection`, `seed:recharge-connection`). Idempotent via
`@@unique([profileId, integrationId])`. Auto-detect single org/profile
ou requer `--tenant=<id>` / `--profile=<id>` flags se houver múltiplos.
`externalUserId` lê do `.env` (`BRAINTREE_MERCHANT_ID`,
`RECHARGE_SHOP_ID` / `RECHARGE_MERCHANT_ID`) ou via `--external-id`.

**Tech debt rastreado:** activation flow via UI/CLI customer-facing.
Trigger: Fase 4 (Organization) cravar admin UI para gestão de
integrações OR Fase 5 (Marketplace) precisar onboarding flow.

**Resolver fallback V1 (Recharge + Braintree):** `tenant-resolver.ts`
aplica fallback "1-tenant lookup" em **dois cenários**:
- (a) `externalId` não extraído do payload (samples / minimal payloads).
- (b) `externalId` extraído mas não bate em nenhuma `MemberConnection`
  (drift entre seed e payload — ex: seed usou `merchant_id`, payload
  veio com `customer.id`).

Em ambos, se houver **exatamente 1** `MemberConnection` para o provider,
resolve para esse tenant. **Trigger remover:** primeiro tenant Braintree
ou Recharge adicional (paridade per-provider).

**Convenção `externalUserId` per-provider:**

| Provider | externalUserId semantics |
|---|---|
| Gorgias | `account_id` (conta Gorgias) |
| Intercom | `app_id` (workspace Intercom) |
| Recharge | `customer.id` (primary) ou `shop_id`/`merchant_id` (fallback) |
| Braintree | customer id Braintree (extraído via kind switch) |

**Pattern para novos providers:** novo provider precisa
(1) seed `Integration` row,
(2) seed `MemberConnection` row (via `seed:connection` ou novo alias),
(3) cravar `extractExternalUserId` switch case no resolver,
(4) decidir se entra em `FALLBACK_PROVIDERS` (recomendado V1 sandbox).

## Environment configuration conventions (cravada na Sub-etapa 17.0.3)

**Lição cravada:** `ENCRYPTION_KEY` drift entre `.env` e `.env.local` causou
bug latente. Next.js runtime carrega `.env.local` primeiro (spurious key)
enquanto scripts via `tsx + dotenv/config` carregam apenas `.env`
(canonical). Handler decrypt falhava 500 silenciosamente em runtime,
embora scripts funcionassem. Discovery cirúrgica pegou comparando
fingerprints sha256 das duas keys.

**Convenção cravada:**

- **`.env`** — source of truth da config canonical do dev environment.
  Bate com Railway production em vars críticas (ENCRYPTION_KEY,
  DATABASE_URL, NEXTAUTH_*, CRON_SECRET, integration credentials, ...).
- **`.env.local`** — overrides locais APENAS. Reserve para:
  - Vars dev-only sem equivalente prod (ex.: `DEEPGRAM_API_KEY` quando
    local difere do team, `INTERNAL_TICK_SECRET`).
  - Personal API keys diferentes do team default.

**NÃO colocar em `.env.local`:**
- `ENCRYPTION_KEY` — deve ser única cross-env para decrypt das credentials
  persistidas funcionar (gravadas com uma key, lidas com outra → falha).
- `DATABASE_URL` / `DIRECT_URL` / `RUNTIME_DATABASE_URL` — runtime
  precisa de URL stable.
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` — auth flow precisa stability.
- Qualquer var que afete decrypt de dados persistidos no DB.

**Validação rápida (rodar antes de PRs touching encryption / auth):**

```bash
node -e "
const fs = require('fs');
const crypto = require('crypto');
['ENCRYPTION_KEY', 'DATABASE_URL', 'NEXTAUTH_URL'].forEach(v => {
  ['env', 'env.local'].forEach(f => {
    try {
      const content = fs.readFileSync('.' + f, 'utf8');
      const m = content.match(new RegExp('^' + v + '=(.+)\$', 'm'));
      if (m) {
        const val = m[1].trim().replace(/['\"]/g, '');
        const hash = crypto.createHash('sha256').update(val).digest('hex').slice(0,8);
        console.log(\`.\${f} \${v}: sha256=\${hash}\`);
      }
    } catch {}
  });
});
"
```

Fingerprints devem bater quando uma var existe em ambos. Mismatch =
correção imediata.

**Fix `prisma.ts` URL precedence (Sub-etapa 17.0.3):** o resolver agora
throws explícito quando uma URL env var é setada com **empty string**
(em vez de silent no-op via `??`). Previne entire class of silent prod
failures quando vars são setadas sem valor — antes, `RUNTIME_DATABASE_URL=""`
passava pelo nullish coalescing e quebrava opacamente em `new PrismaPg("")`.

**Smoke validation cravado:** `npm run smoke:camada-2 [-- --base-url=<url>]`
valida 6 checks end-to-end contra um deploy. Cobre env vars,
credentials decrypt, member connection, service ping, webhook delivery,
e outbox processing. Rodar em DEV + Railway production após qualquer
fix em integration path.

## Camada 1 smoke-validated (cravada na Sub-etapa 17.0.8)

Aplicação preventiva das lições Camada 2 a Camada 1 antes do primeiro
evento Recharge natural chegar. Discovery confirmou Camada 1 é
arquiteturalmente OK (cravado canonical desde Sub-etapa 10) — somente
1 gap real (`MemberConnection` Recharge vazio em DEV) + paridade de
ferramentas de smoke/test-webhook com Camada 2.

**Cross-provider learning crystallized:** Camada 1 recebeu **1 hotfix**
(seed enhancement) vs Camada 2 que recebeu **7 hotfixes** (env conventions
+ route withTenant + handler unwrap + dispatch refactor + tenant
resolver fallback + headers() opt-out + smoke harness). A assimetria
não é qualidade — é ordem de chegada: o primeiro provider estabelece
o canonical pattern, o segundo exercita-o e revela gaps que com 1 só
caso não apareciam. **Aplicar lessons preventivamente ao primeiro
provider** (este sub-etapa) é mais barato que reagir em produção.

**Deliverables Sub-etapa 17.0.8:**

- `RechargeService.getShopId()` — public method para query da loja.
  Usado pelo seed para auto-discovery de `externalUserId` quando
  env var ausente. **Endpoint corrigido em Sub-etapa 17.0.8.1:**
  Recharge renomeou `/shop` → `/store` (live probe com API 2021-11
  retorna 404 em `/shop`, 200 em `/store` com payload
  `{ "store": { "id", "name", "email", ... } }`). Método e interface
  preservam nomenclatura `Shop` por backward compatibility.
- `seed-member-connection.ts` enhancement — Recharge branch usa
  `RECHARGE_API_KEY` + `getShopId()` quando
  `RECHARGE_SHOP_ID`/`RECHARGE_MERCHANT_ID` ausentes. Mantém
  precedence: env var → API → throw com hint claro.
- `scripts/test-recharge-webhook.ts` — CLI helper análogo a
  `test-braintree-webhook.ts`. Hardcoded `charge/created` fixture +
  canonical `sha256(secret + body)` signing (anti-HMAC literal).
  `npm run recharge:test-webhook -- --base-url=...`.
- `scripts/validate-camada-1-smoke.ts` — paridade
  `validate-camada-2-smoke.ts`. 6 checks: env vars
  (`RECHARGE_API_KEY`, `RECHARGE_WEBHOOK_SECRET`, etc.) + Integration
  decrypt (apiToken) + MemberConnection Recharge + `RechargeService.testConnection`
  (/shop ping) + Webhook delivery (sha256(secret+body)) + Outbox
  processing autônomo (cron driven internally).
- `docs/discovery/Plano_Camada_1.md` — formalização retroativa em
  paridade com `Plano_Camada_2.md`.
- Tag de marco `camada-1-smoke-validated` (após Nick rodar DEV +
  Railway 6/6).

**Sub-etapa 12.0.2 OBSOLETA.** Plano original previa "smoke real
Recharge" como entrega separada mas 17.0.8 absorveu o escopo num
único pacote reutilizável. Cross-referência preservada em
`Plano_Camada_1.md`.

**Convenção cross-provider cravada — smoke harness é template.**
Próximo billing provider (hipotético "Camada 3") clona
`validate-camada-2-smoke.ts` ou `validate-camada-1-smoke.ts` (mesmo
shape — diferem só em vocabulário) e ajusta env vars + signing
convention + webhook fixture. Não há "framework genérico" planejado
— a duplicação shallow é mais barata que abstração premature, e cada
provider tem peculiaridades de signing que fariam o framework
acumular branches per-provider.

## DB isolation DEV/PROD (cravada na Sub-etapa 17.0.11 + 17.0.11.1)

Sub-etapa 17.0.11 separou DEV de PROD ao nível de Supabase project.
Antes: DEV e PROD compartilhavam o mesmo Supabase project
(`kwhufgbdmqvesfzriolc`) — qualquer write "DEV" batia em PROD silenciosamente.
Hoje: DEV é Supabase project dedicado (`krhkgaghhjudckormcgp`); PROD
permanece intacta.

**Setup novo Supabase project (procedure cravada):**

1. Criar Supabase project + capturar 4 vars (`DATABASE_URL` pooler 6543,
   `DIRECT_URL` pooler 5432, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
2. `DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy` — aplica
   os 21 migrations (schema + RLS policies tenant-scoped via migrations).
3. `DIRECT_URL=... npx tsx scripts/bootstrap-supabase-project.ts`
   (alternativa: `bash scripts/bootstrap-supabase-project.sh`). Cria
   role `herd_app` NOBYPASSRLS + GRANTs + ALTER DEFAULT PRIVILEGES +
   aplica `enable-rls.sql` expandido (ver abaixo).
4. Construir `RUNTIME_DATABASE_URL` com username
   `herd_app.<project_ref>` (formato Supavisor pooler), password
   gerada pelo bootstrap. Anotar password em password manager.
5. Seeds em ordem: `prisma db seed` → `db:seed:ledger` →
   `seed:recharge` → `seed:braintree` → `backfill-organizations` →
   `seed:recharge-connection` + `seed:braintree-connection`.
6. Smoke validation: `smoke:camada-1` + `smoke:camada-2` 6/6 ambos.

**Tooling: bootstrap-supabase-project.{sh,ts} dual:**

- `.sh` — canonical, usa `psql`. Path documentado para CI/humans.
- `.ts` — paridade funcional via `pg`. Para ambientes sem psql instalado
  (agent-driven flows). Os dois aplicam exatamente as mesmas DDLs.

**`enable-rls.sql` expansion (Sub-etapa 17.0.11.1):**

O arquivo original cravou `ENABLE ROW LEVEL SECURITY` em 21 tabelas
platform-wide com docblock errado ("postgres bypassa RLS, all good").
Em PROD a aplicação nunca foi executada — teria deny-all em herd_app
(NOBYPASSRLS) e quebrado o app. Em NEW project (Sub-etapa 17.0.11)
quebrou exatamente como previsto: Camada 1 smoke 2/6 (Integration
findUnique falhou).

Fix (Sub-etapa 17.0.11.1): adicionar policy permissive
`FOR ALL TO herd_app USING (true) WITH CHECK (true)` em cada uma das
21 tabelas. Resultado: defense-in-depth contra anon/authenticated
(Supabase PostgREST exposed) preservada **e** herd_app opera
livremente. Idempotent via `DROP POLICY IF EXISTS` + `CREATE POLICY`.

As 21 tabelas cobertas (todas com policy `herd_app_full_access`):
`Product`, `Agent`, `AgentTierAccess`, `AgentKnowledgeItem`,
`AgentSkill`, `AgentTool`, `SubscriptionTier`,
`SubscriptionRedemptionRule`, `TierPricingSnapshot`,
`FinancialSnapshot`, `OpexCategory`, `OpexMilestoneLevel`, `OpexItem`,
`OpexMilestone`, `Perk`, `PerkTierAssignment`, `CommunityBenefit`,
`CommunityBenefitTierAssignment`, `Document`, `Setting`, `Integration`.

**Gotchas cravadas no caminho:**

- **`.env` quoted values + shell parsing.** `DATABASE_URL="postgres://..."`
  é parseável só via `set -a; source .env; set +a` (ou via `dotenv/config`
  dentro do tsx). Inline `grep + sed` deixa as aspas e quebra. Documentar
  no próximo script de bootstrap.
- **Supavisor pooler username format.** `herd_app` puro retorna
  `ENOIDENTIFIER (no tenant identifier provided)`. O pooler exige
  `<role>.<project_ref>` (ex: `herd_app.krhkgaghhjudckormcgp`).
  Espelha o pattern `postgres.<ref>` já usado em DATABASE_URL.
- **`enable-rls.sql` referenciava tabelas dropadas em Fase 3.** PR
  17.0.11 limpou 13 stale refs (Commission*, Partner*, OrgNode*, D2D*).
  Defensa: validate-handbook-graph não cobre SQL refs; revisitar quando
  validator ganhar AST DB-aware.

**DEV/PROD isolation effect:**

- `npm run seed:*` em DEV não afeta PROD.
- Smokes em DEV não criam events em PROD.
- Schema migrations rodam separadamente em cada project.
- ENCRYPTION_KEY é a mesma (`Integration.credentials` encriptadas em
  PROD precisam decrypt em DEV — mesmo provider key).
- NetworkProfile admin é seed-criado em ambos (não é o "Nick" pessoal
  — é admin@herd.com via prisma db seed).

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

# Next.js 16 Cache Components conventions (cravada na Sub-etapa 12.0.1)

`next.config.ts` ativa `cacheComponents: true`. Implicações:

- **NÃO usar** `export const dynamic = "force-dynamic"` em route handlers —
  incompatível com Cache Components. Build falha com
  `"dynamic" is not compatible with nextConfig.cacheComponents`.
- Route handlers que lêem env (`process.env.X`) ou DB (Prisma queries) são
  auto-detectados como dinâmicos por inferência **na maioria dos casos**.
  Directive explícita é redundante.
- Server components default = cacheable. Adicionar `<Suspense>` ao redor
  de componentes que leem dados não-cacheados quando necessário.

**Exception: cron GET handlers (cravada na Sub-etapa 17.0.6).** Cron
endpoints podem escapar do auto-detect e ser estaticamente cacheados na
edge do Railway (`x-nextjs-cache: HIT`, `cache-control: s-maxage=31536000`).
Sintoma: `/api/cron/*` retorna o mesmo body por horas sem o handler real
executar — confirmou-se via prod smoke onde `picked=0 succeeded=0`
permaneceu por 25 min apesar de eventos pendentes. Provável causa:
`dotenv` reads em module init (fora do request scope) e
`request.headers.get(...)` do param do GET não opt-out do cache de forma
confiável (diferente de `headers()` do `next/headers`).

**Fix canônico (Sub-etapa 17.0.7):** **`headers()` from `next/headers`** —
ler de uma Dynamic API força o handler a ser dinâmico per-request. CDN/edge
não consegue prerender porque os valores reais dos headers só existem em
runtime. Substitui `request.headers.get(...)` (do GET param) por
`(await headers()).get(...)`.

```typescript
import { headers } from "next/headers";

export async function GET(_request: Request) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  // ... rest of handler
}
```

**Não funciona em Next 16 + Cache Components:** `unstable_noStore()` de
`next/cache` — tentado em Sub-etapa 17.0.6, confirmou-se **no-op** em
Railway prod (cache persistiu `x-nextjs-cache: HIT` por horas mesmo após
deploy do código com `noStore()` chamado). Pattern foi substituído em
Sub-etapa 17.0.7 nos 4 cron routes:

- `src/app/api/cron/domain-events-sync/route.ts`
- `src/app/api/cron/events-sync/route.ts`
- `src/app/api/cron/meetings-sync/route.ts`
- `src/app/api/cron/knowledge-apps-sync/route.ts`

Repetir o pattern em qualquer cron novo (ou route handler com risco de
cache estático). `export const dynamic = "force-dynamic"` **continua
proibido** (incompatível com `cacheComponents: true`).

**Gate obrigatório para PRs tocando route handlers ou `next.config.ts`:**
rodar `npm run build` local antes do commit. CI (`tsc + lint + test`) NÃO
pega esses erros — eles só aparecem em `next build`. Rodar no main repo
(não worktree, per `chat-code-handoff` L4 + L7) — Turbopack rejeita symlink
cross-worktree de `node_modules`.

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

## Project rename HERD → ComeçaAI (cravada na Sub-etapa 18)

- Brand atual: **ComeçaAI** (renomeação progressiva iniciada Sub-etapa 18 Fase 4).
- Histórico: projeto começou como "HERD OS", renomeado Sub-etapa 18 (2026-05-25).
- Runtime referências `src/` atualizadas Sub-etapa 18 (50 arquivos cirúrgicos).
- Docs/.agents/scripts cosméticos: Sub-etapa 18.1 (tarefa paralela futura).
- `package.json name`: `comecaai-platform`.
- Admin email canônico: `nick@comecaai.com.br` (era `admin@herd.com`).
- `X-Internal-Agent` header: `comecaai`.
- i18n keys renomeadas: `col_herd_type` → `col_internal_type`, `herd_type` → `internal_type`.

## Organization schema expansion (Sub-etapa 18)

Foundation Fase 4 cravada — Organization agora tem campos:

- **Company profile:** `description`, `industry`, `size` (OrgSize), `foundedYear`, `websiteUrl`, `phone`, `email`, `supportEmail`, `salesEmail`.
- **Regional:** `timezone` (default UTC), `currency` (default USD), `localeDefault` (default en-US), `dateFormat` (default YYYY-MM-DD).
- **Domain dual:** `subdomain` (NOT NULL UNIQUE), `customDomain` (nullable UNIQUE partial index).
- **Hierarchy:** `parentOrgId` (self-ref FK, onDelete SetNull).
- **Lifecycle:** `status` (OrgStatus enum — ACTIVE, SUSPENDED, ARCHIVED, DELETED).
- **Branding:** `brandKit` (JSONB), `businessHours` (JSONB).

**Enums novos:** `OrgSize`, `OrgStatus`, `AssetType`.

**Tabela nova:** `organization_assets` (logos, OG images, etc.) — FK para `organizations` (CASCADE) e `network_profiles` (SET NULL).

**Reserved subdomains** (validation em application code, NÃO DB constraint):
- `app`, `admin`, `api`, `www`, `mail`, `support`, `comecaai`, `auth`.

**Backfill migration (Sub-etapa 18):**
- `admin@herd.com` profile → `nick@comecaai.com.br` (firstName=Nick, lastName=Moreira).
- Org slug `admin` → `comecaai`, name → `ComeçaAI`, subdomain → `app`.

## Domain routing V2 (Sub-etapa 22)

V2 minimal foundation: Node runtime + tenant resolution + header injection.

**Cravamento V2:**
- `src/proxy.ts` (Node runtime — replaces `middleware.ts` Edge runtime; Prisma compatible).
- `src/lib/tenant/org-resolver.ts` — `resolveOrgByHost` with customDomain primary + subdomain fallback. Cache TTL 30s. `isApexDomain` + `extractSubdomain` helpers.
- `src/lib/tenant/get-org-from-request.ts` — `getOrgIdFromRequest`, `isApexRequest`, `getHostFromRequest` helpers reading proxy-injected headers.
- Headers `x-org-id`, `x-host`, `x-is-apex` injected in all matched requests.
- `trustHost: true` + explicit `secret` in Auth.js (resolves MissingSecret error on multi-host).
- Cleanup `/f` dead matcher (was in `PUBLIC_LOCALE_PREFIXES` but absent from config).

**V2 NÃO inclui (rastreado para futuro):**
- Cookie domain config `.comecaai.com.br` cross-subdomain → Sub-etapa 22.1.
- Proxy redirect when subdomain is invalid → Sub-etapa 22.1.
- Apex login `/api/auth/memberships` endpoint + org selector + auto-redirect → Sub-etapa 22.2.

**Lição cravada — V1 rollback (3 smoke bugs):**
- `middleware.ts` runs Edge runtime — Prisma/pg fail silently there. `proxy.ts` runs Node runtime (Prisma OK). Migration mandatory for any proxy that touches DB.
- `secret:` must be explicit when `trustHost: true` — Auth.js v5 raises MissingSecret otherwise. Fallback: `process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET`.
- `npm install` real in worktree, NOT symlink — Turbopack 16 rejects cross-filesystem symlinks.

## Multi-tenant DEV state (Sub-etapa 23)

DEV ambient pós Sub-etapa 23 (host-based tenant resolution):

- 2 orgs cravadas:
  - ComeçaAI (`comecaai` slug, `app` subdomain) — plataforma, 7 departments.
  - Bucked Up (`buckedup` slug, `buckedup` subdomain) — primeira org cliente.
- Owner ambas: nick@comecaai.com.br (isSuperAdmin=true).

Acesso DEV:
- `localhost:3000` — apex (login geral).
- `app.localhost:3000` — ComeçaAI plataforma.
- `buckedup.localhost:3000` — Bucked Up cliente.

Pattern tenant resolution (Sub-etapa 22 V2 + 23 expansion):
1. proxy.ts injeta x-org-id header baseado em host (Sub-etapa 22 V2).
2. requireOrgRole lê x-org-id como primary source, JWT activeOrgId fallback.
3. Valida membership do user na org efetiva.
4. session.user.activeOrgId final reflete host atual.
5. Route handlers consumers usam session.user.activeOrgId (sem mudança).
6. Sidebar usa /api/org/current pra hidratar nome da org por host.

Script `scripts/create-org.ts`:
- Args: `--slug --name --subdomain --owner-email`.
- Cria Organization + OrganizationMember OWNER atomically.
- Usado pra criar Bucked Up DEV. Futuras orgs cliente pattern idem.

Tenant isolation validado end-to-end:
- Routes tenant-scoped (14 routes): respeitam host via x-org-id (Sub-etapa 23 expansion).
- Sidebar mostra nome org correta per-host via /api/org/current.
- RLS database-level (Sub-etapa 19).
- RBAC per-org (Sub-etapa 21).

Próximas sub-etapas:
- 22.2: org selector UI + login branding + switch-org endpoint.
- 24: invitation flow (substitui script direct).

## Cross-subdomain cookies (Sub-etapa 22.1)

DEV: `COOKIE_DOMAIN=.localhost` + `APEX_HOST=localhost`.
PROD: `COOKIE_DOMAIN=.comecaai.com.br` + `APEX_HOST=comecaai.com.br`.

Session cookie via Auth.js v5 `cookies.sessionToken.options.domain` in `src/lib/auth.ts`.
Locale cookie in `proxy.ts` uses same `COOKIE_DOMAIN`. Login at any subdomain shares
session across apex + all subdomains.

Subdomain invalid (não resolve org ativa) → redirect apex com `?error=org_not_found`.
UI banner para esse error fica em Sub-etapa 22.2.

Safari note: `.localhost` cookies may not work in Safari (DEV only). PROD uses
`.comecaai.com.br` (real TLD, Safari OK).

Redirect guard em `proxy.ts`: if `!isApex && !orgId && extractSubdomain(hostname)` →
`302` to `APEX_HOST/?error=org_not_found`. CustomDomain misses (no subdomain extracted)
pass through safely.
