> Para agentes de IA: esta entrada documenta a mini-spec de R7 (agents as top-level feature). Status: draft (planned). Primeiro caso de drop-dual-surface durante consolidação.

# R7 — Agents as Top-Level Feature (consolidate dual surface)

R7 promove agents de block para top-level feature. Consolida o dual surface existente (admin/agents top-level já existe paralelo a admin/blocks/agents) e dropa o caminho de bloco.

## Business

agents é AI feature com profundidade rica (skills, knowledge, tools, tier-access, settings). Já é top-level no UI — `/admin/agents/` existe com orchestrator + specialists subroutes. Manifest precisa alinhar — hoje é declarado como block. R7 alinha manifest com realidade do código e dropa surface duplicada.

## Product

Nada visível muda — sidebar Agents já aponta para `/admin/agents/`. R7 limpa dual surface (remove `/admin/blocks/agents/`).

## Architecture

- `agents.block.ts` → `agents.feature.ts` (`kind: "top_level_feature"`).
- **Dropar** `src/app/admin/blocks/agents/` inteiro.
- Consolidar tudo sob `src/app/admin/agents/` (já existe).
- Cross-references: `KnowledgeApp` → `AgentKnowledgeItem`; outros blocks/tools podem referenciar agents (ex: `campaigns.agentKeys`, `routines.agentId`, `tier.agentAccess`).
- Components em `src/components/agents/` permanecem (já são paralelos aos do bloco).

### Pré-condição

R2 (top-level features foundation) cravou `featureRegistry`. R7 registra `agents.feature.ts` lá.

## Operations

- Workflow para gerenciar agents permanece igual. Manifest formaliza estrutura existente.
- Cross-references em outros manifests passam a apontar para `featureRegistry.agents` em vez de `blockRegistry.agents`.
- Code paths que importam de `@/lib/blocks/blocks/agents.block` precisam migrar para `@/lib/features/agents.feature` (decisão durante execução).
- i18n keys em `agents.*` permanecem.

## Glossary

- **Agent**: AI assistant configurável. Top-level feature pós-R7.
- **AgentSkill**: capacidade declarada do agent (resolução de problemas específicos).
- **AgentTool**: ferramenta exposta ao agent (tool da plataforma que o agent pode invocar).
- **AgentKnowledgeItem**: item de conhecimento associado ao agent (rename de KnowledgeApp).
- **AgentTierAccess**: matriz de acesso de agents por tier de subscription.
- **AgentRole**: papel funcional do agent (orchestrator, specialist).
- **AgentStatus**: estados (ACTIVE, INACTIVE, ARCHIVED).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R7. Primeiro caso de drop-dual-surface durante consolidação.
