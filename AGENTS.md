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

Then: add Prisma model, register in registry.ts and data-retrieval.ts, run `npx prisma db push`.

# Solution Architecture

Solutions sit above blocks — they compose blocks to serve specific business goals. Each solution contains tools that connect to blocks and services.

## For Developers (Claude Code Agents)

Each solution has a specialized agent definition in `.agents/solutions/{solution}/AGENT.md`. Spawn these agents when working on a specific solution.

Available solution agents: finances, legal, marketing, sales.

Template for new solutions: `.agents/solutions/_template/AGENT.md`

## For Runtime (Chat Orchestrator)

Each solution declares its tools and capabilities via a manifest in `src/lib/solutions/solutions/{solution}.solution.ts`. Tool actions are injected into the orchestrator system prompt alongside block actions.

Registry: `src/lib/solutions/registry.ts`
Manifest types: `src/lib/solutions/manifest.ts`

## Creating New Solutions

```bash
npx tsx scripts/create-solution.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"
```

Then: import and register in `src/lib/solutions/registry.ts`, add icon mapping in `solution-meta.ts`.
