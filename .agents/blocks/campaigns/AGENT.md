---
name: campaigns
description: Sub-agent for the Campanhas (Marketing Campaigns) block in HERD OS
version: "1.0.0"
domain: marketing
capabilities: [read, create, update, delete]
models: [Campaign]
types: [campaign]
---

# Campanhas (Campaigns) Sub-Agent

You are the **Campanhas** specialist for HERD OS. Campaigns are marketing initiatives running across one or more channels — they live under the **Marketing** category in the blocks panel.

## Domain Knowledge

A `Campaign` represents a coordinated marketing effort with a defined start, end, budget, audience, and objective. It's distinct from:

- **Pages** (landing pages used as campaign destinations)
- **Feeds** (organic content streams)
- **Deals** (sales opportunities — though deals can be *attributed* to campaigns)

### Channels (multi-select)

`channels` is `CampaignChannel[]` — a campaign can run in several channels at once. Values: `EMAIL`, `SOCIAL`, `ADS`, `EVENT`, `CONTENT`, `WEBINAR`, `REFERRAL`, `DIRECT_MAIL`, `SMS`, `PARTNER`, `OTHER`.

### Status pipeline

```
DRAFT → SCHEDULED → ACTIVE → PAUSED ↔ ACTIVE
                           → COMPLETED → ARCHIVED
```

There's no enforced state machine — admins can move a campaign to any status. UI orders columns in the kanban as: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, ARCHIVED.

### Objective (optional)

`CampaignObjective` enum: `AWARENESS`, `ACQUISITION`, `ACTIVATION`, `RETENTION`, `REVENUE`, `REFERRAL`, `OTHER`. Used for filtering and reporting (which objectives are we investing the most in?).

### Money

`budget` and `spent` are both `Decimal(12, 2)` — serialized as strings. `currency` defaults to `"BRL"`. The detail UI shows a budget vs. spent bar with % consumption when both are set.

### Metrics (free-form JSON)

`metrics: Json @default("{}")` — intentionally schemaless to fit any channel. Typical keys: `impressions`, `clicks`, `ctr`, `conversions`, `leads`, `cpa`, `roas`. The detail UI renders the JSON as a key/value table; it's the user's responsibility to keep keys consistent across campaigns.

### Attribution to Deals

`Deal.campaignId` is an optional FK with `onDelete: SetNull`. Deleting a campaign **never destroys deals** — it just clears their attribution. The campaign detail page lists attributed deals (`_count.deals` and a sorted list of up to 50). The deal detail page exposes a `CampaignPicker` to (re)attribute the deal.

Future iteration: a "campaign ROI" view — sum of `WON` deal amounts attributed to a campaign vs. its `spent`. Not yet built, but the data is in place.

## Owned Files

- **API:** `src/app/api/campaigns/route.ts`, `src/app/api/campaigns/[id]/route.ts`
- **Validators:** `src/lib/validators/campaigns.ts` (`createCampaignSchema`, `updateCampaignSchema`, `CAMPAIGN_STATUSES`, `CAMPAIGN_CHANNELS`, `CAMPAIGN_OBJECTIVES`)
- **Block manifest:** `src/lib/blocks/blocks/campaigns.block.ts`
- **Provider:** `src/lib/chat/providers/campaign.provider.ts` (`domain = "marketing"`, `types = ["campaign"]`)
- **Pages:** `src/app/admin/blocks/campaigns/{page,loading}.tsx` and `[id]/page.tsx`
- **Components:** `src/components/campaigns/` — `types.ts` (status/channel/objective configs, `formatAmount`), `campaign-card.tsx`, `campaigns-client.tsx` (header + filters + kanban/grid toggle), `campaigns-kanban.tsx`, `campaign-detail-client.tsx`, `create-campaign-dialog.tsx`, `campaign-picker.tsx`

## API contracts

`GET /api/campaigns` — filters `status`, `channel` (matches `channels` array), `objective`, `ownerId`, `tag`, `search`, `limit`, `offset`. Envelope `{ campaigns, total }`. Each campaign includes `_count.deals`.

`GET /api/campaigns/[id]` — includes `_count.deals` and up to 50 attributed deals (`{ id, title, stage, amount, currency }`).

`POST /api/campaigns` — `name` required. Defaults: `status = DRAFT`, `currency = "BRL"`, `channels = []`.

`PATCH /api/campaigns/[id]` — partial update.

`DELETE /api/campaigns/[id]` — hard delete; attributed deals get `campaignId = null`.

## Conventions

- All UI strings are pt-BR ("Campanha", "Rascunho", "Agendada", "Ativa", "Pausada", "Concluída", "Arquivada", etc.)
- Status badge colors live in `STATUS_CONFIG` in `types.ts` — keep them consistent across kanban, card, detail.
- Channel labels are short ("Email", "Social", "Ads", "Evento", "Conteúdo", "Webinar", "Indicação", "Mala direta", "SMS", "Parceiro", "Outro").
- Default view in the list page is **kanban by status** (mirrors deals).
- Date inputs use `<input type="date">` with ISO `YYYY-MM-DD`.
- When showing budget vs. spent, format both with `formatAmount` and the same currency; the bar fills `min(spent / budget, 1) * 100%` and turns red if over budget.
