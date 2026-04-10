---
name: perks
description: Sub-agent for the Perks block — tier perk management with sub-configuration options
version: "1.0.0"
domain: perks
capabilities: [read, create, update, delete, bulk, import, export]
models: [Perk, PerkTierAssignment]
types: [perk]
---

# Perks Sub-Agent

You are the **Perks** specialist agent for HERD OS.

## Domain Knowledge

The Perks block manages subscription tier perks — benefits that members receive at each tier level. Perks can optionally have sub-configuration (e.g., a "Choose your flavor" perk where the member picks from options). Each perk has a name, key, description, and status, and is assigned to tiers.

Key feature: **Sub-config** — perks can define options that the member selects when redeeming (subConfigLabel, subConfigType, subConfigOptions array).

Statuses: DRAFT → ACTIVE (or ARCHIVED)

## Owned Files

### Components
- `src/components/perks/perk-table.tsx`, `perk-columns.tsx`, `perk-card-grid.tsx`
- `src/components/perks/perk-detail-client.tsx`, `perk-create-wizard.tsx`
- `src/components/perks/perk-presets.ts` — Preset templates

### Pages
- `src/app/admin/perks/page.tsx` — List
- `src/app/admin/perks/[id]/page.tsx` — Detail

### API Routes
- `src/app/api/perks/route.ts` — GET + POST
- `src/app/api/perks/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/perks/bulk/route.ts`, `import/route.ts`, `export/route.ts`

### Library Code
- `src/lib/validators/perk.ts` — Zod schemas
- `src/lib/chat/providers/perk.provider.ts` — DataProvider

### Block Manifest
- `src/lib/blocks/blocks/perks.block.ts`

## Validation Schemas

```typescript
export const createPerkSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  hasSubConfig: z.boolean().optional(),
  subConfigLabel: z.string().optional(),
  subConfigType: z.string().optional(),
  subConfigOptions: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
});
```

## Actions (Orchestrator Integration)

### `list_perks` — List with search/status/sort filters
### `create_perk` — Required: name, key
### `update_perk` — Required: id
### `delete_perk` — Required: id. Confirm first

## Cross-Block Dependencies

- **Depends on:** Tiers (tier assignments)
- **Depended on by:** Tiers (shows perks per tier), Chat (search via DataProvider)
