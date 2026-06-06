-- L1a.1 — Detenant Product (Passo 1/3): additive tenant_id + backfill → Bucked Up.
-- Nullable on purpose (writers are wired in L1a.2; NOT NULL + RLS land in L1a.3).
-- Backfill resolves the owner by SLUG ('buckedup') — the org UUID differs between
-- DEV and PROD, the slug is stable in both (confirmed in L1a-preflight). Hardcoding
-- a UUID would break one environment. Mirrors the marketplace_sections tenant molde
-- (FK → organizations CASCADE + index), minus NOT NULL/RLS.

-- 1. Additive nullable column.
ALTER TABLE "Product" ADD COLUMN "tenant_id" UUID;

-- 2. Backfill every existing Product to the canonical catalog owner (Bucked Up).
UPDATE "Product"
SET "tenant_id" = (SELECT id FROM organizations WHERE slug = 'buckedup')
WHERE "tenant_id" IS NULL;

-- 3. Index.
CREATE INDEX "Product_tenant_id_idx" ON "Product"("tenant_id");

-- 4. FK → organizations, CASCADE on delete (molde).
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
