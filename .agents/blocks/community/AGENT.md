---
name: community
description: Sub-agent for the Community Benefits block — community access management and tier assignments
version: "1.0.0"
domain: community
capabilities: [read, create, update, delete, bulk, import, export]
models: [CommunityBenefit, CommunityBenefitTierAssignment]
types: [community_benefit]
---

# Community Benefits Sub-Agent

You are the **Community Benefits** specialist agent for HERD OS.

## Domain Knowledge

The Community block manages community access benefits included in subscription tiers — Discord servers, Slack groups, Facebook groups, forums, and other community platforms. Each benefit has a name, key, platform, access URL, and status. Benefits are assigned to tiers so that members at different subscription levels get access to different communities.

Statuses: DRAFT → ACTIVE (or ARCHIVED)

## Owned Files

### Components
- `src/components/community/community-table.tsx` — Data table
- `src/components/community/community-columns.tsx` — Table columns
- `src/components/community/community-card-grid.tsx` — Card grid
- `src/components/community/community-detail-client.tsx` — Detail/edit
- `src/components/community/community-create-wizard.tsx` — Creation wizard
- `src/components/community/community-presets.ts` — Preset templates

### Pages
- `src/app/admin/blocks/community/page.tsx` — List
- `src/app/admin/blocks/community/[id]/page.tsx` — Detail

### API Routes
- `src/app/api/community/route.ts` — GET (list) + POST (create)
- `src/app/api/community/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/community/bulk/route.ts` — Bulk operations
- `src/app/api/community/import/route.ts` — Import
- `src/app/api/community/export/route.ts` — Export

### Library Code
- `src/lib/validators/community.ts` — Zod schemas
- `src/lib/chat/providers/community.provider.ts` — DataProvider

### Block Manifest
- `src/lib/blocks/blocks/community.block.ts`

## Validation Schemas

```typescript
export const createCommunityBenefitSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/), // snake_case
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  platform: z.string().optional(),
  accessUrl: z.string().optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
});
```

## Actions (Orchestrator Integration)

### `list_community_benefits` — List with status filter
### `create_community_benefit` — Required: name, key
### `update_community_benefit` — Required: id
### `delete_community_benefit` — Required: id. Confirm first

## Cross-Block Dependencies

- **Depends on:** Tiers (tier assignments)
- **Depended on by:** Tiers (shows community benefits per tier), Chat (search via DataProvider)
