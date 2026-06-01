-- ADR-002 Fatia 1a — Locations data layer: RecordSource + OrganizationLocation (curated-consumption junction).
-- Aditivo. Não toca o isolamento existente de Location. Backfill: 1 vínculo por Location (organizationId = tenantId), source = MANUAL.

-- 1. enum RecordSource (idempotente)
DO $$ BEGIN
  CREATE TYPE "record_source" AS ENUM ('MANUAL', 'ORGANIZATION', 'INTEGRATION', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Location.source — ADD COLUMN NOT NULL DEFAULT já preenche as linhas existentes com MANUAL.
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "source" "record_source" NOT NULL DEFAULT 'MANUAL';

-- 3. junction table
CREATE TABLE IF NOT EXISTS "organization_location" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"       UUID         NOT NULL,
  "organization_id" UUID         NOT NULL,
  "location_id"     UUID         NOT NULL,
  "is_enabled"      BOOLEAN      NOT NULL DEFAULT true,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_location_organization_id_location_id_key"
  ON "organization_location"("organization_id", "location_id");
CREATE INDEX IF NOT EXISTS "organization_location_tenant_id_idx" ON "organization_location"("tenant_id");
CREATE INDEX IF NOT EXISTS "organization_location_location_id_idx" ON "organization_location"("location_id");

-- FKs — Cascade nas três (D6: mestre/consumidor caem → vínculo cai). tenant_id FK existe só aqui (escalar no Prisma).
ALTER TABLE "organization_location" DROP CONSTRAINT IF EXISTS "organization_location_organization_id_fkey";
ALTER TABLE "organization_location" ADD CONSTRAINT "organization_location_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_location" DROP CONSTRAINT IF EXISTS "organization_location_location_id_fkey";
ALTER TABLE "organization_location" ADD CONSTRAINT "organization_location_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_location" DROP CONSTRAINT IF EXISTS "organization_location_tenant_id_fkey";
ALTER TABLE "organization_location" ADD CONSTRAINT "organization_location_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. RLS — 2-policy molde (espelha Location pós-26.2): isolamento exato (FOR ALL) + leitura vertical (FOR SELECT).
ALTER TABLE "organization_location" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organization_location_tenant_isolation" ON "organization_location";
CREATE POLICY "organization_location_tenant_isolation" ON "organization_location"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "organization_location_vertical_read" ON "organization_location";
CREATE POLICY "organization_location_vertical_read" ON "organization_location" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- 5. backfill — 1 vínculo por Location existente (organizationId = tenantId). source já = MANUAL via default.
INSERT INTO "organization_location" ("organization_id", "location_id", "tenant_id", "is_enabled", "updated_at")
SELECT l."tenant_id", l."id", l."tenant_id", true, CURRENT_TIMESTAMP
FROM "Location" l
WHERE NOT EXISTS (
  SELECT 1 FROM "organization_location" ol
  WHERE ol."organization_id" = l."tenant_id" AND ol."location_id" = l."id"
);
