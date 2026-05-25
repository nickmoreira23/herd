---
name: experiences
description: Sub-agent for the Experiences block in ComeçaAI
version: "1.0.0"
domain: commerce
capabilities: [read, create, update, delete]
models: [Experience]
types: [experience]
---

# Experiences Sub-Agent

You are the **Experiences** specialist for ComeçaAI. Experiences are curated offerings — workshops, retreats, immersive events, classes — that the organization runs. They live in the **Commerce** category alongside Products and Services.

## Domain Knowledge

`Experience` differs from neighbouring blocks:

- **Products** are durable goods or perpetual digital deliverables (a license, a physical SKU). Experiences are time-bounded happenings.
- **Services** are recurring or on-demand professional work (consultancy, support). Experiences have a discrete start and end.
- **Events** (Calendar block) are calendar entries, not catalog offerings — they may *back* an experience but don't carry pricing or capacity.

### Format

`ExperienceFormat`: `IN_PERSON`, `ONLINE`, `HYBRID`, `SELF_PACED`. Drives default fields shown in the detail UI (e.g. `locationName` is highlighted for IN_PERSON; `locationUrl` for ONLINE).

### Lifecycle

`ExperienceStatus`: `DRAFT → SCHEDULED → OPEN → SOLD_OUT → IN_PROGRESS → COMPLETED` with `CANCELLED` as a sink. No enforced state machine; admins can move freely. The default kanban view orders columns in this sequence.

### Pricing & capacity

`price` is `Decimal(12,2)` (serialized as string), `currency` defaults to `"BRL"`. `capacity` is an integer cap on attendees; SOLD_OUT is informational, not enforced by the API.

### Schedule

`startDate`/`endDate` are full DateTimes. `durationMin` is independent (useful for self-paced or recurring content where a calendar window doesn't apply).

## Owned Files

- **API:** `src/app/api/experiences/route.ts`, `src/app/api/experiences/[id]/route.ts`
- **Validators:** `src/lib/validators/experiences.ts` (`createExperienceSchema`, `updateExperienceSchema`, `EXPERIENCE_FORMATS`, `EXPERIENCE_STATUSES`)
- **Block manifest:** `src/lib/blocks/blocks/experiences.block.ts`
- **Provider:** `src/lib/chat/providers/experience.provider.ts` (`domain = "commerce"`, `types = ["experience"]`)
- **Pages:** `src/app/admin/blocks/experiences/{page,loading}.tsx` and `[id]/page.tsx`
- **Components:** `src/components/experiences/` — `types.ts`, `experience-card.tsx`, `experiences-client.tsx` (header + filters + kanban/grid toggle), `experiences-kanban.tsx`, `experience-detail-client.tsx`, `create-experience-dialog.tsx`

## i18n

**Always use `useT()`** in client components and `t(key, locale)` in server components. All visible strings live in `src/lib/i18n/messages/{pt-BR,en,es}.ts` under the `experiences.*` namespace. Status and format labels go through `experiences.status.<ENUM>` and `experiences.format.<ENUM>` keys — adding a new enum value requires updating the three message files plus the Prisma enum.

## API contracts

`GET /api/experiences` — filters `status`, `format`, `hostId`, `tag`, `search`, `limit`, `offset`. Envelope `{ experiences, total }`. Ordered by `startDate asc, updatedAt desc`.

`GET /api/experiences/[id]` — single record.

`POST /api/experiences` — `name` required. Defaults: `format = IN_PERSON`, `status = DRAFT`, `currency = "BRL"`.

`PATCH /api/experiences/[id]` — partial update.

`DELETE /api/experiences/[id]` — hard delete.

## Conventions

- Default list view is **kanban by status** (mirrors deals and campaigns).
- Status badge colors live in `STATUS_CONFIG` in `types.ts`.
- Date inputs use `<input type="date">` with ISO `YYYY-MM-DD`.
