-- Sub-etapa 3.6 (Fase 3) — ALTER NetworkProfile + DROP NetworkProfileType + NCP
--
-- Final MLM/Network schema cleanup. After this:
--   * NetworkProfile = identidade pura (14 campos, sem hierarquia, sem
--     profileType, sem networkType)
--   * NetworkProfileType (12 scaffold rows) dropped
--   * NetworkCompensationPlan (1 scaffold row) dropped
--
-- Preserved:
--   * enum NetworkType — Department.networkType still uses
--   * enum ProfileStatus — NetworkProfile.status still uses (all 7 rows ACTIVE)
--   * All 14 remaining NetworkProfile fields
--   * 7 reverse rels: departmentMemberships, headOfDepartments,
--     conversations, memberConnections, messageThreadsAsContact,
--     messageThreadsAsAssignee, ownedOrganization

-- =====================================================================
-- 1. Drop FK + self-ref constraints on network_profiles
-- =====================================================================

ALTER TABLE "network_profiles"
  DROP CONSTRAINT IF EXISTS "network_profiles_profileTypeId_fkey",
  DROP CONSTRAINT IF EXISTS "network_profiles_parentId_fkey";

-- =====================================================================
-- 2. Drop 3 columns from network_profiles
-- =====================================================================

ALTER TABLE "network_profiles"
  DROP COLUMN IF EXISTS "profileTypeId",
  DROP COLUMN IF EXISTS "parentId",
  DROP COLUMN IF EXISTS "networkType";

-- =====================================================================
-- 3. Drop tables
-- =====================================================================

DROP TABLE IF EXISTS "network_profile_types" CASCADE;
DROP TABLE IF EXISTS "network_compensation_plans" CASCADE;

-- =====================================================================
-- NOT dropping:
--   * enum NetworkType (Department uses)
--   * enum ProfileStatus (NetworkProfile.status uses)
-- =====================================================================
