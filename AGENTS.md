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
