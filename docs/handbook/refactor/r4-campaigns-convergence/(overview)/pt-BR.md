> Para agentes de IA: esta entrada documenta a mini-spec de R4 (campaigns convergence). Status: draft (planned). Hoje campaigns dual-existe: block ativo + placeholder coming-soon em marketing.category.ts.

# R4 — Campaigns Convergence (block → tool)

R4 promove campaigns de block ativo para tool em marketing. Convergir paths e deletar o placeholder coming-soon existente. É o primeiro caso real de block → tool migration.

## Business

campaigns hoje existe em duas formas conflitantes:

- **Block ativo**: `campaigns.block.ts` com models (Campaign, CampaignRun), UI completa (kanban, detail, picker), API endpoints.
- **Placeholder coming-soon**: declarado em `marketing.category.ts` com status `coming-soon` sem implementação real.

R4 promove o block real para tool real, deletando o placeholder. Resolução do dual-existence é o ganho conceitual.

## Product

Usuário vê campaigns aparecer em `/admin/tools/marketing/campaigns/` em vez de `/admin/blocks/campaigns/`. UI permanece (Kanban, detail, picker, list) — só o path muda.

## Architecture

- `Campaign` model continua (records de execução).
- `campaigns.block.ts` deletado.
- Adicionar campaigns como tool em `marketing.category.ts` (status: active) com `kind: "tool"` + `BlockConnection[]` explicitando consumes (events, community, agents).
- Mover `src/components/campaigns/` → `src/components/tools/marketing/campaigns/`.
- Mover `src/app/admin/blocks/campaigns/` → `src/app/admin/tools/marketing/campaigns/`.
- `api/campaigns/` permanece ou move (decisão durante execução real).
- Deletar placeholder coming-soon em `marketing.category.ts` (atualmente status: "coming-soon" sem implementação real).

### Pré-condição

R1 (tools foundation) cravou Tool real e ToolCategoryManifest. R4 é primeiro caso de migração de bloco para tool no novo schema.

## Operations

- Paths de chat orchestrator atualizados: BlockAction → ToolAction orchestration.
- Sidebar não muda — Tools sidebar item já existe.
- i18n keys do namespace `campaigns.*` permanecem; ajustar paths admin.
- Block actions `campaigns.create`, `campaigns.update`, etc. viram tool actions sob o tool campaigns em marketing.

## Glossary

- **Campaign**: record de execução (instância de uma campanha de marketing rodando ou agendada).
- **CampaignRun**: instância de execução individual de uma campanha multi-step.
- **CampaignStatus**: estados (DRAFT, SCHEDULED, RUNNING, COMPLETED, PAUSED, CANCELLED).
- **CampaignChannel**: canal de execução (email, whatsapp, sms, etc.) — termo independente de "channel" em Organization.
- **CampaignObjective**: objetivo declarado (awareness, conversion, retention).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R4. Primeiro caso real de block → tool migration.
