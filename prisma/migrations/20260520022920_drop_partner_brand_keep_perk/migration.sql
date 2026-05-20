-- Sub-etapa 3.5.5 (Fase 3) — DROP PartnerBrand stack
--
-- Product decision: Perk model already exists with parallel stack (4 routes,
-- 3 admin pages, 11 consumer files). PartnerBrand (external affiliate concept)
-- is being removed entirely; Perk becomes the single benefit concept.
-- External affiliate/partner concept returns later as company profile in
-- network, not as a Block.
--
-- Drops:
--   * 2 tables: PartnerBrand (25 scaffold rows), PartnerTierAssignment (11 rows)
--   * 4 enums: PartnerStatus, PartnerBenefitType, PartnerCommissionType, PartnerTierAccess
--
-- Preserved (Perk stack — single concept now):
--   * Perk + PerkTierAssignment models
--   * PerkStatus enum (3 values: ACTIVE/DRAFT/ARCHIVED)
--   * /api/perks/* (5 routes), /admin/blocks/perks/* (3 pages)

-- =====================================================================
-- DROP TABLES (2)
-- =====================================================================

DROP TABLE IF EXISTS "PartnerTierAssignment" CASCADE;
DROP TABLE IF EXISTS "PartnerBrand" CASCADE;

-- =====================================================================
-- DROP ENUMS (4) — uso 100% nas tabelas dropadas acima
-- =====================================================================

DROP TYPE IF EXISTS "PartnerStatus" CASCADE;
DROP TYPE IF EXISTS "PartnerBenefitType" CASCADE;
DROP TYPE IF EXISTS "PartnerCommissionType" CASCADE;
DROP TYPE IF EXISTS "PartnerTierAccess" CASCADE;
