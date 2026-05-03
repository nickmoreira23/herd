> For AI agents: this entry documents the R4 mini-spec (campaigns convergence). Status: draft (planned). Today campaigns coexists in two forms: an active block + a coming-soon placeholder in marketing.category.ts.

# R4 — Campaigns Convergence (block → tool)

R4 promotes campaigns from an active block to a tool in marketing. Converges paths and deletes the existing coming-soon placeholder. First real case of block → tool migration.

## Business

campaigns today exists in two conflicting forms:

- **Active block**: `campaigns.block.ts` with models (Campaign, CampaignRun), full UI (kanban, detail, picker), API endpoints.
- **Coming-soon placeholder**: declared in `marketing.category.ts` with status `coming-soon` and no real implementation.

R4 promotes the real block to a real tool, deleting the placeholder. Resolving the dual-existence is the conceptual win.

## Product

Users see campaigns appear at `/admin/tools/marketing/campaigns/` instead of `/admin/blocks/campaigns/`. UI stays (Kanban, detail, picker, list) — only the path changes.

## Architecture

- `Campaign` model continues (execution records).
- `campaigns.block.ts` deleted.
- Add campaigns as a tool in `marketing.category.ts` (status: active) with `kind: "tool"` + `BlockConnection[]` explicitly listing consumes (events, community, agents).
- Move `src/components/campaigns/` → `src/components/tools/marketing/campaigns/`.
- Move `src/app/admin/blocks/campaigns/` → `src/app/admin/tools/marketing/campaigns/`.
- `api/campaigns/` stays or moves (decision during actual execution).
- Delete the coming-soon placeholder in `marketing.category.ts` (currently status: "coming-soon" with no real implementation).

### Pre-condition

R1 (tools foundation) established the real Tool and ToolCategoryManifest. R4 is the first block-to-tool migration case under the new schema.

## Operations

- Chat orchestrator paths updated: BlockAction → ToolAction orchestration.
- Sidebar unchanged — Tools sidebar item already exists.
- i18n keys in the `campaigns.*` namespace stay; adjust admin paths.
- Block actions `campaigns.create`, `campaigns.update`, etc. become tool actions under the campaigns tool in marketing.

## Glossary

- **Campaign**: execution record (instance of a marketing campaign running or scheduled).
- **CampaignRun**: individual execution instance of a multi-step campaign.
- **CampaignStatus**: states (DRAFT, SCHEDULED, RUNNING, COMPLETED, PAUSED, CANCELLED).
- **CampaignChannel**: execution channel (email, whatsapp, sms, etc.) — term independent of "channel" in Organization.
- **CampaignObjective**: declared objective (awareness, conversion, retention).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R4. First real case of block → tool migration.
