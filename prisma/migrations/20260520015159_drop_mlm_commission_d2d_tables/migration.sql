-- Sub-etapa 3.5 (Fase 3) — DROP MLM Network + Commission + D2D
--
-- 24 tables + 6 enums. CASCADE on DROP TABLE cleans dependent FKs from
-- preserved tables (network_profiles, network_compensation_plans, rank_tiers,
-- SubscriptionTier) without explicit ALTER TABLE statements.
--
-- Discovery confirmed: zero FK from preserved → target before this migration.
-- All target tables have count = 0 (Sub-etapa 3.2 data cleanup).
--
-- Preserved (NOT dropped):
--   * network_profiles, PartnerBrand, PartnerTierAssignment, member_connections
--   * NetworkProfileType, NetworkCompensationPlan (HOLD — drop in 3.6)
--   * Enums: NetworkType, ProfileStatus (HOLD — drop in 3.6)

-- =====================================================================
-- DROP TABLES (24)
-- =====================================================================

-- Network junction tables (8 — leaf-most)
DROP TABLE IF EXISTS "network_profile_attributes" CASCADE;
DROP TABLE IF EXISTS "network_profile_hierarchy_paths" CASCADE;
DROP TABLE IF EXISTS "network_profile_roles" CASCADE;
DROP TABLE IF EXISTS "network_profile_permission_overrides" CASCADE;
DROP TABLE IF EXISTS "network_profile_compensations" CASCADE;
DROP TABLE IF EXISTS "network_profile_ranks" CASCADE;
DROP TABLE IF EXISTS "network_points_ledger" CASCADE;
DROP TABLE IF EXISTS "network_monthly_performances" CASCADE;
DROP TABLE IF EXISTS "network_team_members" CASCADE;
DROP TABLE IF EXISTS "network_role_permissions" CASCADE;

-- Network detail (2)
DROP TABLE IF EXISTS "network_teams" CASCADE;

-- Network catalog (2)
DROP TABLE IF EXISTS "network_roles" CASCADE;
DROP TABLE IF EXISTS "network_permissions" CASCADE;

-- Commission junctions/rates (4)
DROP TABLE IF EXISTS "CommissionTierRate" CASCADE;
DROP TABLE IF EXISTS "CommissionPlanRate" CASCADE;
DROP TABLE IF EXISTS "OverrideRule" CASCADE;
DROP TABLE IF EXISTS "PerformanceTier" CASCADE;

-- Commission detail
DROP TABLE IF EXISTS "CommissionLedgerEntry" CASCADE;

-- D2D + Partner agreements (4)
DROP TABLE IF EXISTS "ClawbackRule" CASCADE;
DROP TABLE IF EXISTS "PartnerAgreement" CASCADE;

-- Commission plans (2) — referenced by above
DROP TABLE IF EXISTS "CommissionPlan" CASCADE;
DROP TABLE IF EXISTS "CommissionStructure" CASCADE;

-- D2D org-tree
DROP TABLE IF EXISTS "OrgNode" CASCADE;
DROP TABLE IF EXISTS "D2DPartner" CASCADE;

-- =====================================================================
-- DROP ENUMS (6) — uso 100% nas tabelas dropadas acima
-- =====================================================================

DROP TYPE IF EXISTS "OrgRoleType" CASCADE;
DROP TYPE IF EXISTS "AgreementStatus" CASCADE;
DROP TYPE IF EXISTS "LedgerEntryType" CASCADE;
DROP TYPE IF EXISTS "LedgerEntrySource" CASCADE;
DROP TYPE IF EXISTS "OverrideEffect" CASCADE;
DROP TYPE IF EXISTS "PayoutCadence" CASCADE;
