-- L1b.3 — Enforce tenancy on SubscriptionTier (final step of the L1 catalog
-- detenanting; twin of l1a4_product_rls_enforce). Turns the L1b.2a/L1b.2b wiring
-- into real isolation: strict RLS (Sub-26.2 canonical 2-policy molde, same as
-- Product / marketplace_sections) + per-tenant slug unique + tenant_id NOT NULL.
--
-- IDEMPOTENT across the two divergent starting states (no per-environment branch):
--   DEV : may already have RLS ON + permissive `herd_app_full_access` (USING true).
--   PROD: RLS OFF + zero policies (pre-check 5/5: herd_app_full_access never applied).
-- `ENABLE` is a no-op when already on; `DROP POLICY IF EXISTS` / `DROP INDEX IF
-- EXISTS` are no-ops when absent.
--
-- No FORCE ROW LEVEL SECURITY (matches the other tenant tables; runtime role
-- herd_app is NOBYPASSRLS so policies apply). Pre-check confirmed 0 null tenant_id
-- and 0 per-tenant slug collisions in DEV and PROD, so SET NOT NULL + the composite
-- unique are safe.

-- 1. Enable RLS (no-op in DEV if already on, turns it on in PROD).
ALTER TABLE "SubscriptionTier" ENABLE ROW LEVEL SECURITY;

-- 2. Drop the permissive bootstrap policy (DEV only; no-op in PROD). A permissive
--    `USING (true)` would OR with the strict policies below and nullify isolation.
DROP POLICY IF EXISTS "herd_app_full_access" ON "SubscriptionTier";

-- 3. tenant_isolation FOR ALL — exact match (governs INSERT/UPDATE/DELETE + reads).
DROP POLICY IF EXISTS "SubscriptionTier_tenant_isolation" ON "SubscriptionTier";
CREATE POLICY "SubscriptionTier_tenant_isolation" ON "SubscriptionTier"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);

-- 4. vertical_read FOR SELECT — parent org sees descendant rows (org-tree).
DROP POLICY IF EXISTS "SubscriptionTier_vertical_read" ON "SubscriptionTier";
CREATE POLICY "SubscriptionTier_vertical_read" ON "SubscriptionTier" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- 5. Per-tenant slug uniqueness: swap the global slug unique for (tenant_id, slug).
--    0 collisions confirmed in DEV + PROD. IF EXISTS keeps it idempotent.
DROP INDEX IF EXISTS "SubscriptionTier_slug_key";
CREATE UNIQUE INDEX "SubscriptionTier_tenantId_slug_key" ON "SubscriptionTier"("tenant_id", "slug");

-- 6. Promote tenant_id to NOT NULL (backfill complete: 0 nulls in DEV + PROD).
ALTER TABLE "SubscriptionTier" ALTER COLUMN "tenant_id" SET NOT NULL;
