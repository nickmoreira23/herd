# Fase 3 — Sub-etapa 3.2: data cleanup runbook

**Date:** 2026-05-19
**Branch:** `feat/sub-3.2-cleanup-data`
**Backup tag (origin):** `pre-sub-3.2-cleanup-data` (anchored at PR #30 merge)
**Discovery references:** Sub-etapa 3.1 + 3.1.1

## Scope

Empty MLM/Commission/D2D row data in DEV before any DROP migration
(Sub-etapa 3.6) or code refactor (3.3–3.5). Schema untouched. Code
untouched. Reversible by re-seeding from `prisma/seed.ts` until the DROP
lands.

## Counts before/after

| Table                                       | Before | After | Action     |
|---------------------------------------------|--------|-------|------------|
| network_role_permissions                    | 44     | 0     | Batch 1    |
| network_profile_permission_overrides        | 0      | 0     | Batch 1    |
| network_profile_roles                       | 3      | 0     | Batch 1    |
| network_profile_attributes                  | 0      | 0     | Batch 1    |
| network_profile_hierarchy_paths             | 0      | 0     | Batch 1    |
| network_profile_compensations               | 0      | 0     | Batch 1    |
| network_profile_ranks                       | 0      | 0     | Batch 1    |
| network_team_members                        | 0      | 0     | Batch 1    |
| network_points_ledger                       | 0      | 0     | Batch 2    |
| network_monthly_performances                | 0      | 0     | Batch 2    |
| network_teams                               | 0      | 0     | Batch 2    |
| network_roles                               | 9      | 0     | Batch 3    |
| network_permissions                         | 27     | 0     | Batch 3    |
| CommissionTierRate                          | 4      | 0     | Batch 4    |
| CommissionPlanRate                          | 24     | 0     | Batch 4    |
| OverrideRule                                | 4      | 0     | Batch 4    |
| PerformanceTier                             | 4      | 0     | Batch 4    |
| CommissionLedgerEntry                       | 16     | 0     | Batch 4    |
| CommissionPlan                              | 2      | 0     | Batch 4    |
| CommissionStructure                         | 1      | 0     | Batch 4    |
| ClawbackRule                                | 6      | 0     | Batch 5    |
| PartnerAgreement                            | 3      | 0     | Batch 5    |
| OrgNode                                     | 34     | 0     | Batch 5    |
| D2DPartner                                  | 3      | 0     | Batch 5    |

**Total rows deleted:** 184.

## Tables preserved (no DELETE issued)

| Table                       | Count | Reason                                            |
|-----------------------------|-------|---------------------------------------------------|
| network_profiles            | 7     | Identidade — refactor to a User model in 3.7      |
| network_profile_types       | 12    | FK Restrict from network_profiles — drops in 3.7  |
| network_compensation_plans  | 1     | FK from network_profile_types — drops in 3.7      |
| PartnerBrand                | 25    | Catálogo de marcas — rename → Perk in 3.6.5       |
| PartnerTierAssignment       | 11    | Catálogo junction — rename → PerkTierAssignment   |
| member_connections          | 0     | Camada 1 (tenant-scoped) — out of Fase 3 scope    |

## Batch execution order (FK-safe)

1. **Batch 1 — Network junctions:** `network_role_permissions`,
   `network_profile_permission_overrides`, `network_profile_roles`,
   `network_profile_attributes`, `network_profile_hierarchy_paths`,
   `network_profile_compensations`, `network_profile_ranks`,
   `network_team_members`. Leaves first; no incoming FK from non-target
   models.
2. **Batch 2 — Network detail:** `network_points_ledger`,
   `network_monthly_performances`, `network_teams`. Removes `teams`
   after `team_members` (Cascade would do it anyway, but explicit).
3. **Batch 3 — Network catalog parcial:** `network_roles` (self-ref
   `parent_role_id` is SetNull, safe), `network_permissions`. Skips
   `network_profile_types` and `network_compensation_plans` — kept
   because `network_profiles.profileTypeId` is NOT NULL + FK Restrict.
4. **Batch 4 — Commission:** rates and junctions first
   (`CommissionTierRate`, `CommissionPlanRate`, `OverrideRule`,
   `PerformanceTier`), then `CommissionLedgerEntry` (FKs to OrgNode
   Cascade + PartnerAgreement SetNull), then `CommissionPlan` and
   `CommissionStructure`.
5. **Batch 5 — D2D/Partner:** `ClawbackRule` (FK to PartnerAgreement
   Cascade), `PartnerAgreement`, `OrgNode` (self-ref SetNull),
   `D2DPartner`. `PartnerBrand` + `PartnerTierAssignment` NOT touched.

Each batch was wrapped in `BEGIN/COMMIT` for atomicity.

## Decisions cravadas

1. **Only DELETE rows.** No DROP, no ALTER, no migration in this
   sub-etapa.
2. **`network_profile_types` + `network_compensation_plans` preserved**
   because `network_profiles.profileTypeId` is NOT NULL + FK Restrict.
   Deleting the parent would violate the constraint. Both will drop in
   Sub-etapa 3.7 alongside the schema ALTER that removes
   `profileTypeId`.
3. **`PartnerBrand` + `PartnerTierAssignment` preserved** — they become
   `Perk` + `PerkTierAssignment` in Sub-etapa 3.6.5 (rename + light
   reshape, not destructive).
4. **No code touched.** Consumer cleanup is Sub-etapas 3.3–3.5. Tests
   in this PR all pass against the empty tables because no test
   depended on seeded MLM/Commission/D2D data at unit OR integration
   layer (verified: 308/308 unit, 140/140 integration green).

## Rollback procedure (if needed before 3.6 lands)

Re-run the legacy seeding pipeline:

```bash
npm run db:seed         # restores most network_* fixtures
npm run db:seed:ledger  # restores ledger account scaffolding (unaffected)
```

For Commission/D2D data specifically, no idempotent seed exists —
recovery from those 184 rows would require either:

- Restore from a Supabase point-in-time snapshot, or
- Re-create manually (low value: DEV-only data, no test depends on
  exact rows).

Production data is NOT touched by this PR — production cleanup happens
later under explicit go-ahead from Nick (and via a different mechanism:
SQL Editor with backups).

## Verification gates run

| Gate                       | Result   |
|----------------------------|----------|
| `npx prisma validate`      | valid 🚀 |
| `npx tsc --noEmit`         | 0 errors |
| `npm run lint`             | 0 errors (353 legacy warnings) |
| `npm test` (unit)          | 308/308 passing |
| `npm run test:integration` | 140/140 passing |

## Next sub-etapas

- **3.3** — Remove code consumers in `src/lib/permissions.ts` and the
  `/api/network/*` admin routes (RBAC zumbi — see discovery 3.1.1 §D).
- **3.4** — Remove UI under `src/app/admin/network/` (16 pages from
  discovery 3.1.1 §5).
- **3.5** — Remove Commission + D2D code consumers (`src/app/admin/{commissions,partners}`,
  `/api/{commission*,d2d-partners,partner-agreements}`).
- **3.6** — DROP migrations (24 tables in same FK-safe order as this
  cleanup).
- **3.6.5** — Rename `PartnerBrand` → `Perk` + `PartnerTierAssignment`
  → `PerkTierAssignment`.
- **3.7** — Schema ALTER on `network_profiles` (drop `profileTypeId`,
  `parentId`, `networkType`), drop `network_profile_types` +
  `network_compensation_plans`, rename model `NetworkProfile` → `User`
  (decision pending Nick).
