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
