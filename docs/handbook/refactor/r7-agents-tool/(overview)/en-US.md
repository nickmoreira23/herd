> For AI agents: this entry documents the R7 mini-spec (agents as tool). Status: draft (planned). First drop-dual-surface case during consolidation.

# R7 — Agents as Tool (consolidate dual surface)

R7 promotes agents from a block to a tool. Consolidates the existing dual surface (admin/agents top-level already exists alongside admin/blocks/agents) and drops the block-shaped path.

## Business

agents is an AI feature with rich depth (skills, knowledge, tools, tier-access, settings). It's already top-level in the UI — `/admin/agents/` exists with orchestrator + specialists subroutes. The manifest needs to align — today it's declared as a block. R7 aligns the manifest with code reality and drops the duplicated surface.

## Product

Nothing visible changes — the Agents sidebar already points to `/admin/agents/`. R7 cleans up the dual surface (removes `/admin/blocks/agents/`).

## Architecture

- `agents.block.ts` → `agents.tool.ts` (`kind: "top_level_feature"`).
- **Drop** `src/app/admin/blocks/agents/` entirely.
- Consolidate everything under `src/app/admin/agents/` (already exists).
- Cross-references: `KnowledgeApp` → `AgentKnowledgeItem`; other blocks/tools can reference agents (e.g. `campaigns.agentKeys`, `routines.agentId`, `tier.agentAccess`).
- Components in `src/components/agents/` stay (already parallel to the block's).

### Pre-condition

R2 (tools foundation) establishes the `toolRegistry`. R7 registers `agents.tool.ts` there.

## Operations

- Workflow to manage agents stays identical. The manifest formalizes existing structure.
- Cross-references in other manifests start pointing at `toolRegistry.agents` instead of `blockRegistry.agents`.
- Code paths importing from `@/lib/blocks/blocks/agents.block` must migrate to `@/lib/features/agents.feature` (decision during execution).
- i18n keys in `agents.*` stay.

## Glossary

- **Agent**: configurable AI assistant. Top-level feature post-R7.
- **AgentSkill**: declared capability of the agent (resolves specific problems).
- **AgentTool**: tool exposed to the agent (platform tool the agent can invoke).
- **AgentKnowledgeItem**: knowledge item associated with the agent (rename of KnowledgeApp).
- **AgentTierAccess**: agent access matrix by subscription tier.
- **AgentRole**: agent's functional role (orchestrator, specialist).
- **AgentStatus**: states (ACTIVE, INACTIVE, ARCHIVED).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R7. First drop-dual-surface case during consolidation.
