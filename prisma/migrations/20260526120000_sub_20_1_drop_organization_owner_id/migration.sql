-- Sub-etapa 20.1: Drop Organization.ownerId column post-validation
--
-- Pré-condição: todos os orgs têm OrganizationMember ACTIVE (backfill feito em Sub-etapa 20).
-- Dual-read fallback em resolveActiveOrgIdForProfile removido junto.
-- ownerId em outros modelos (Contact, Deal, Company, Campaign, Routine) NÃO tocado.

-- 1. Drop FK constraint (se existir)
ALTER TABLE "organizations"
  DROP CONSTRAINT IF EXISTS "organizations_owner_id_fkey";

-- 2. Drop index
DROP INDEX IF EXISTS "organizations_owner_id_idx";

-- 3. Drop column
ALTER TABLE "organizations"
  DROP COLUMN IF EXISTS "owner_id";
