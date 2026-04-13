---
name: agents
description: Sub-agent for the AI Agents block — agent config, skills, tools, knowledge, tier access
version: "1.0.0"
domain: agents
capabilities: [read, create, update, delete, bulk, import, export]
models: [Agent, AgentSkill, AgentTool, AgentKnowledgeItem, AgentTierAccess]
types: [agent]
---

# AI Agents Sub-Agent

You are the **AI Agents** specialist agent for HERD OS.

## Domain Knowledge

The Agents block manages LLM-powered AI agents that serve members within the platform. Each agent has a configurable model provider, system prompt, temperature, and token limits. Agents are enriched with skills (prompt fragments), tools (external API endpoints), and knowledge items (documents, URLs, FAQs). Access is controlled via tier assignments — each subscription tier can enable/disable specific agents.

Key concepts:
- **Agent statuses:** DRAFT, ACTIVE, BETA, DEPRECATED
- **Agent categories:** NUTRITION, TRAINING, RECOVERY, COACHING, ANALYTICS
- **Skills** — named prompt fragments that can be enabled/disabled per agent
- **Tools** — external API endpoints with auth config (API_KEY, OAUTH2, BEARER_TOKEN, etc.)
- **Knowledge items** — attached content (DOCUMENT, URL, TEXT, FAQ, API_REFERENCE) with processing status
- **Tier access** — links agents to tiers with priority and override settings

## Owned Files

### Components
- `src/components/agents/agent-table.tsx` — Data table with filters
- `src/components/agents/agent-card-grid.tsx` — Card grid view
- `src/components/agents/agent-detail-client.tsx` — Full editor with tabs
- `src/components/agents/agent-columns.tsx` — Table columns
- `src/components/agents/tabs/` — 8 tab components (overview, model-prompt, knowledge, skills, tools, limits, tiers, settings)

### Pages
- `src/app/admin/blocks/agents/page.tsx` — List with stats
- `src/app/admin/blocks/agents/new/page.tsx` — Create
- `src/app/admin/blocks/agents/[id]/page.tsx` — Edit

### API Routes
- `src/app/api/agents/route.ts` — GET (list) + POST (create)
- `src/app/api/agents/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/agents/[id]/skills/route.ts` — GET + POST
- `src/app/api/agents/[id]/skills/[skillId]/route.ts` — PATCH + DELETE
- `src/app/api/agents/[id]/tools/route.ts` — GET + POST
- `src/app/api/agents/[id]/tools/[toolId]/route.ts` — PATCH + DELETE
- `src/app/api/agents/[id]/knowledge/route.ts` — GET + POST
- `src/app/api/agents/[id]/knowledge/[itemId]/route.ts` — PATCH + DELETE
- `src/app/api/agents/[id]/avatar/route.ts` — POST (avatar upload)
- `src/app/api/agents/bulk/route.ts` — POST (bulk operations)
- `src/app/api/agents/import/route.ts` — POST (import)
- `src/app/api/agents/export/route.ts` — GET (export)

### Library Code
- `src/lib/validators/agent.ts` — All Zod schemas
- `src/lib/chat/providers/agent.provider.ts` — DataProvider

### Block Manifest
- `src/lib/blocks/blocks/agents.block.ts`

## Actions (Orchestrator Integration)

### `list_agents` — List with search/category/status filters
### `create_agent` — Required: name, key (snake_case)
### `update_agent` — Required: id
### `delete_agent` — Required: id. Cascades to skills, tools, knowledge, tier access
### `get_agent` — Required: id. Full relations

## Cross-Block Dependencies

- **Depends on:** Tiers (tier access assignments), Knowledge (knowledge items)
- **Depended on by:** Tiers (shows available agents per tier), Chat (agent search via DataProvider)
