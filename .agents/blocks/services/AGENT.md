---
name: services
description: Sub-agent for the Serviços (Services) block in ComeçaAI
version: "1.0.0"
domain: foundation
capabilities: [read, create, update, delete]
models: [Service]
types: [service]
---

# Serviços (Services) Sub-Agent

You are the **Serviços** specialist for ComeçaAI. The services block catalogs offerings the company sells: consulting, training, support, mentoring. It's the third pillar of Comércio alongside Products (goods) and Agents (AI services).

## Domain Knowledge

A `Service` follows the **same structural conventions as Perks/CommunityBenefits** (the two existing tier-referenceable Comércio blocks): it has a unique slug `key`, a `status` enum (`DRAFT | ACTIVE | ARCHIVED`), short `description` + long `contentJson`/`contentText`, an `icon` (lucide name), `sortOrder`, and `tags`. This shape was chosen specifically so Services can be referenced from `SubscriptionTier` in the future via a `ServiceTierAssignment` join table — mirroring [`PerkTierAssignment`](../../../prisma/schema.prisma) — without any refactor of `Service` itself.

Pricing is more expressive than perks: `price` (Decimal nullable) + `pricingType` (`FIXED | HOURLY | DAILY | MONTHLY | CUSTOM`). When `pricingType` is `CUSTOM`, `price` should be null and the UI/orchestrator displays "sob consulta".

`contentJson` holds a TipTap document; `contentText` is the plain-text projection used for search/AI retrieval. Keep them in sync on any content edit (the editor's `onChange` provides both).

## Owned Files

### Components (`src/components/services/`)
- `types.ts` — `ServiceRow`, `PRICING_TYPE_CONFIG`, `STATUS_CONFIG`, `formatPrice` helper
- `service-card.tsx` — grid card
- `service-row.tsx` — table row
- `services-client.tsx` — list page with search + status/pricingType filters + list/grid toggle
- `service-detail-client.tsx` — full edit page with TipTap editor (reuses [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx))
- `create-service-dialog.tsx` — quick-create dialog

### Pages
- `src/app/admin/blocks/services/page.tsx` — list (default grid)
- `src/app/admin/blocks/services/loading.tsx` — skeleton
- `src/app/admin/blocks/services/[id]/page.tsx` — detail

### API Routes
- `src/app/api/services/route.ts` — GET (filters: category, status, pricingType, search) + POST (auto-slugify if `key` omitted)
- `src/app/api/services/[id]/route.ts` — GET + PATCH (validates key uniqueness if changed) + DELETE

### Library
- `src/lib/validators/services.ts` — Zod schemas + `slugify()` helper
- `src/lib/chat/providers/service.provider.ts` — DataProvider (domain: foundation)

### Block Manifest
- `src/lib/blocks/blocks/services.block.ts`

## Database Model

```prisma
enum ServiceStatus { DRAFT ACTIVE ARCHIVED }
enum ServicePricingType { FIXED HOURLY DAILY MONTHLY CUSTOM }

model Service {
  id          String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  key         String             @unique
  description String?
  contentJson Json               @default("{}")
  contentText String             @default("")
  category    String?
  duration    String?
  price       Decimal?           @db.Decimal(10, 2)
  pricingType ServicePricingType @default(FIXED)
  imageUrl    String?
  icon        String             @default("briefcase")
  status      ServiceStatus      @default(DRAFT)
  sortOrder   Int                @default(0)
  tags        String[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([category])
  @@index([status])
  @@map("services")
}
```

## API Contract

### `GET /api/services`
- Query params: `category`, `status`, `pricingType`, `search` (LIKE on name/key/description/contentText/category), `limit` (default 200), `offset`
- Returns: `{ services: Service[], total: number }`, ordered by `sortOrder asc, name asc`

### `POST /api/services`
- Body: `{ name (required), key?, description?, contentJson?, contentText?, category?, duration?, price?, pricingType?, imageUrl?, icon?, status?, sortOrder?, tags? }`
- Auto-slugify: if `key` is omitted, the server runs `slugify(name)` and appends `-N` until unique.
- If `key` is provided and collides, returns 409.
- `price` accepts a plain number; Prisma converts to Decimal.
- Returns: created Service (201)

### `GET /api/services/[id]`
- Returns: single Service. `price` is serialized as a string (Decimal → string).

### `PATCH /api/services/[id]`
- Body: any subset of POST fields
- If `key` changes, must not collide with another service (409 otherwise)
- Returns: updated Service

### `DELETE /api/services/[id]`
- Returns: `{ deleted: true }`

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/services.block.ts](../../../src/lib/blocks/blocks/services.block.ts):

- `list_services`, `get_service`, `create_service`, `update_service`, `delete_service`

Only `ACTIVE` services appear in the catalog (`getCatalogItems`). Search across all services regardless of status.

## Cross-Block Dependencies

- **Depends on:** none.
- **Depended on by:** none yet.
- **Future linking:** to make Services part of a `SubscriptionTier`'s benefit set, create:
  ```prisma
  model ServiceTierAssignment {
    id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    serviceId          String   @db.Uuid
    subscriptionTierId String   @db.Uuid
    isEnabled          Boolean  @default(true)
    configValue        String?
    createdAt          DateTime @default(now())
    updatedAt          DateTime @updatedAt

    service Service          @relation(fields: [serviceId], references: [id], onDelete: Cascade)
    tier    SubscriptionTier @relation(fields: [subscriptionTierId], references: [id], onDelete: Cascade)
    @@unique([serviceId, subscriptionTierId])
  }
  ```
  And add `tierAssignments ServiceTierAssignment[]` to `Service`. No refactor of existing fields needed.

- **Reuses:** [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx) for rich content.

## Conventions

- API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)`
- `key` is unique and **functionally immutable** — changing it breaks future tier/package references. The detail UI shows a warning to that effect.
- `Decimal` price is serialized as a string in JSON; client uses `formatPrice` helper from `types.ts` to render
- `contentText` is the canonical search surface — orchestrator never parses `contentJson`
- Catalog excludes non-`ACTIVE` services; orchestrator can opt in via `status` filter
