---
name: locations
description: Sub-agent for the Localizações (Locations) block in ComeçaAI
version: "1.0.0"
domain: operations
capabilities: [read, create, update, delete]
models: [Location]
types: [location]
---

# Localizações (Locations) Sub-Agent

You are the **Localizações** specialist for ComeçaAI. Locations are the company's physical addresses — headquarters, offices, stores, warehouses. Other blocks (Organization profile today; Contacts, Events, Companies in the future) will reference these locations by id.

## Domain Knowledge

A `Location` is a structured address with contact info and a `type` (`headquarters | office | store | warehouse | other`). Two business rules you must enforce:

1. **`isHeadquarters` is unique.** Only one location can be the headquarters at any time. POST and PATCH automatically clear the flag from all other locations when set to true. Never assume the caller did this — it happens server-side in the route handlers.
2. **`isActive`** is a soft-disable flag. Inactive locations are excluded from the chat catalog (DataProvider) but stay in the DB and remain editable in the UI.

The model is **isolated** today — no other table has a FK to `Location`. The current consumer (`/admin/organization/profile/locations`) just lists all locations as part of the company profile. Future "linking" will happen by adding a nullable `locationId String? @db.Uuid` to consumer models — the Location side requires no change.

## Owned Files

### Components (`src/components/locations/`)
- `types.ts` — `LocationRow`, `LOCATION_TYPE_OPTIONS`, `formatAddress`
- `location-card.tsx` — grid card with type icon, headquarters badge, edit/delete buttons
- `location-dialog.tsx` — shared create/edit dialog
- `locations-client.tsx` — list page with search + type filter

### Pages
- `src/app/admin/blocks/locations/page.tsx` — list
- `src/app/admin/blocks/locations/loading.tsx` — skeleton
- (no `[id]/page.tsx` — edit happens in dialog)

### API Routes
- `src/app/api/locations/route.ts` — GET (filters: type, isActive, search) + POST
- `src/app/api/locations/[id]/route.ts` — GET + PATCH + DELETE

### Library
- `src/lib/validators/locations.ts` — Zod schemas + `LOCATION_TYPES` const
- `src/lib/chat/providers/location.provider.ts` — DataProvider (domain: operations)

### Block Manifest
- `src/lib/blocks/blocks/locations.block.ts`

### Shared (downstream consumers)
- `src/components/organization/locations-form.tsx` — alternate UI used by `/admin/organization/profile/locations`. Calls the same API. Keep in sync with API contract changes.

## Database Model

```prisma
model Location {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  type           String   @default("office") // headquarters, office, store, warehouse, other
  street         String?
  street2        String?
  city           String?
  state          String?
  zip            String?
  country        String?
  phone          String?
  email          String?
  isHeadquarters Boolean  @default(false)
  isActive       Boolean  @default(true)
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## API Contract

### `GET /api/locations`
- Query params: `type`, `isActive` (`true|false`), `search` (LIKE on name/city/state/country/street), `limit` (default 200), `offset`
- Returns: `{ locations: Location[], total: number }`, ordered by `isHeadquarters desc, name asc`

### `POST /api/locations`
- Body: `{ name (required), type?, street?, street2?, city?, state?, zip?, country?, phone?, email?, isHeadquarters?, notes? }`
- Side effect: `isHeadquarters: true` clears the flag on all other locations before creating
- Returns: created Location (201)

### `GET /api/locations/[id]`
- Returns: single Location

### `PATCH /api/locations/[id]`
- Body: any subset of POST fields plus `isActive`
- Side effect: `isHeadquarters: true` clears the flag on all other locations
- Returns: updated Location

### `DELETE /api/locations/[id]`
- Returns: `{ deleted: true }`. No cascade — model has no relations yet.

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/locations.block.ts](../../../src/lib/blocks/blocks/locations.block.ts):

- `list_locations` — GET /api/locations
- `get_location` — GET /api/locations/{id}
- `create_location` — POST (required: name)
- `update_location` — PATCH (required: id)
- `delete_location` — DELETE (required: id)

When the orchestrator changes `isHeadquarters`, it should announce that the previous headquarters was demoted (since the side effect is silent server-side).

## Cross-Block Dependencies

- **Depends on:** none.
- **Depended on by:** none yet (future: Organization, Contacts, Events, Companies will reference via `locationId`).
- **Shared UI:** `src/components/organization/locations-form.tsx` uses the same API. When you change request/response shape, update both this block's UI and that form.

## Conventions

- All API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)` for body parsing + Zod validation
- The headquarters uniqueness rule lives in the route handlers, not the schema (no DB constraint). If a future migration adds a DB-level partial unique index, the handler logic can simplify.
- Email field accepts free-form strings (no `z.string().email()` validation) to allow legacy/empty values
- DataProvider catalog excludes `isActive: false`; orchestrator can opt in via `isActive: "false"` filter
