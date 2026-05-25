-- Sub-etapa 19: Tenant scope Department + Location
-- Adds tenant_id FK to both tables (matching existing convention: all tenant-scoped models use tenant_id).
-- Drops global slug unique on departments, adds composite unique (tenant_id, slug).
-- Enables RLS with tenant isolation policies + permissive herd_app policy.

-- ========================
-- Department
-- ========================

-- Add tenant_id column (nullable first for backfill)
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Backfill: assign the single existing org to all rows
UPDATE "departments"
SET "tenant_id" = (SELECT "id" FROM "organizations" LIMIT 1)
WHERE "tenant_id" IS NULL;

-- Make NOT NULL
ALTER TABLE "departments" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_tenant_id_fkey";
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS "departments_tenant_id_idx" ON "departments"("tenant_id");

-- Drop global unique on slug, add composite unique
DROP INDEX IF EXISTS "departments_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenantId_slug_key"
  ON "departments"("tenant_id", "slug");

-- RLS
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_tenant_isolation" ON "departments";
CREATE POLICY "departments_tenant_isolation" ON "departments"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "departments_herd_app_full_access" ON "departments";
CREATE POLICY "departments_herd_app_full_access" ON "departments"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- ========================
-- Location
-- ========================

-- Add tenant_id column (nullable first for backfill)
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Backfill: assign the single existing org to all rows
UPDATE "Location"
SET "tenant_id" = (SELECT "id" FROM "organizations" LIMIT 1)
WHERE "tenant_id" IS NULL;

-- Make NOT NULL
ALTER TABLE "Location" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_tenant_id_fkey";
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS "Location_tenant_id_idx" ON "Location"("tenant_id");

-- RLS
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Location_tenant_isolation" ON "Location";
CREATE POLICY "Location_tenant_isolation" ON "Location"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "Location_herd_app_full_access" ON "Location";
CREATE POLICY "Location_herd_app_full_access" ON "Location"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);
