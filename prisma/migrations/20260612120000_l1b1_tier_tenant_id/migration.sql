-- L1b.1 — Detenant SubscriptionTier (Passo 1/3): additive tenant_id + backfill → Bucked Up.
-- Nullable on purpose (writers are wired in L1b.2; NOT NULL + strict RLS + composite
-- slug unique land in L1b.3). Backfill resolves the owner by SLUG ('buckedup') — the
-- org UUID differs between DEV and PROD, the slug is stable in both (confirmed in the
-- L1b preflight). Hardcoding a UUID would break one environment. Mirrors the L1a.1
-- Product molde (UUID column + FK → organizations CASCADE + index), minus NOT NULL/RLS.

-- 1. Additive nullable column.
ALTER TABLE "SubscriptionTier" ADD COLUMN "tenant_id" UUID;

-- 2. Backfill every existing tier to the canonical catalog owner (Bucked Up).
UPDATE "SubscriptionTier"
SET "tenant_id" = (SELECT id FROM organizations WHERE slug = 'buckedup')
WHERE "tenant_id" IS NULL;

-- 3. Index.
CREATE INDEX "SubscriptionTier_tenant_id_idx" ON "SubscriptionTier"("tenant_id");

-- 4. FK → organizations, CASCADE on delete (molde).
ALTER TABLE "SubscriptionTier" ADD CONSTRAINT "SubscriptionTier_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
