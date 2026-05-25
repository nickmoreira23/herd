-- Sub-etapa 18: Organization schema expansion + assets table + enums
-- Cravado: Fase 4 foundation — rename HERD → ComeçaAI + Organization foundation

-- 1. Create enums (idempotent)
DO $$ BEGIN
  CREATE TYPE "org_size" AS ENUM ('SOLO', 'SMALL', 'MID', 'LARGE', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "org_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "asset_type" AS ENUM ('LOGO_LIGHT', 'LOGO_DARK', 'LOGO_SQUARE', 'FAVICON', 'OG_IMAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add nullable columns to organizations (idempotent via IF NOT EXISTS)
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "description"    TEXT,
  ADD COLUMN IF NOT EXISTS "industry"       TEXT,
  ADD COLUMN IF NOT EXISTS "size"           "org_size",
  ADD COLUMN IF NOT EXISTS "founded_year"   INTEGER,
  ADD COLUMN IF NOT EXISTS "website_url"    TEXT,
  ADD COLUMN IF NOT EXISTS "phone"          TEXT,
  ADD COLUMN IF NOT EXISTS "email"          TEXT,
  ADD COLUMN IF NOT EXISTS "support_email"  TEXT,
  ADD COLUMN IF NOT EXISTS "sales_email"    TEXT,
  ADD COLUMN IF NOT EXISTS "timezone"       TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "currency"       TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "locale_default" TEXT DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS "date_format"    TEXT DEFAULT 'YYYY-MM-DD',
  ADD COLUMN IF NOT EXISTS "subdomain"      TEXT,
  ADD COLUMN IF NOT EXISTS "custom_domain"  TEXT,
  ADD COLUMN IF NOT EXISTS "parent_org_id"  UUID,
  ADD COLUMN IF NOT EXISTS "status"         "org_status" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "brand_kit"      JSONB,
  ADD COLUMN IF NOT EXISTS "business_hours" JSONB;

-- 3. Backfill: rename admin profile + org to ComeçaAI canonical identity
-- Note: network_profiles uses camelCase column names (no @map on these fields)
UPDATE "network_profiles"
SET "firstName" = 'Nick',
    "lastName"  = 'Moreira',
    email       = 'nick@comecaai.com.br'
WHERE email = 'admin@herd.com';

UPDATE "organizations"
SET slug      = 'comecaai',
    name      = 'ComeçaAI',
    subdomain = 'app'
WHERE slug = 'admin';

-- 4. Backfill subdomain for any remaining orgs without one (safety net)
UPDATE "organizations"
SET subdomain = slug
WHERE subdomain IS NULL;

-- 5. Make subdomain NOT NULL + UNIQUE (all rows have value after backfill)
ALTER TABLE "organizations" ALTER COLUMN "subdomain" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_subdomain_key" ON "organizations"("subdomain");

-- 6. customDomain partial unique index (nullable — only unique when not null)
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_custom_domain_key"
  ON "organizations"("custom_domain")
  WHERE "custom_domain" IS NOT NULL;

-- 7. Self-ref FK for org hierarchy
ALTER TABLE "organizations"
  DROP CONSTRAINT IF EXISTS "organizations_parent_org_id_fkey";

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_parent_org_id_fkey"
  FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "organizations_parent_org_id_idx" ON "organizations"("parent_org_id");

-- 8. Create organization_assets table
CREATE TABLE IF NOT EXISTS "organization_assets" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID         NOT NULL,
  "type"            "asset_type" NOT NULL,
  "url"             TEXT         NOT NULL,
  "metadata"        JSONB,
  "uploaded_by_id"  UUID,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_assets_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "organization_assets_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "organization_assets_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "network_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "organization_assets_organization_id_idx"
  ON "organization_assets"("organization_id");
