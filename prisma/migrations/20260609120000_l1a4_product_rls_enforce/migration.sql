-- L1a.4 — Enforce tenancy on Product (final step of the catalog detenanting).
-- Turns the L1a.2/L1a.3 wiring into real isolation: strict RLS (Sub-26.2 canonical
-- 2-policy molde, same as marketplace_sections) + tenant_id NOT NULL.
--
-- IDEMPOTENT across the two divergent starting states (no per-environment branch):
--   DEV : RLS already ON + permissive policy `herd_app_full_access` (USING true).
--   PROD: RLS OFF + zero policies (herd_app_full_access never applied there).
-- `ENABLE` is a no-op when already on; `DROP POLICY IF EXISTS` is a no-op when absent.
--
-- No FORCE ROW LEVEL SECURITY (matches the other tenant tables; runtime role
-- herd_app is NOBYPASSRLS so policies apply). Backfill is complete (0 null
-- tenant_id in DEV and PROD), so SET NOT NULL is safe.

-- 1. Enable RLS (no-op in DEV, turns it on in PROD).
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- 2. Drop the permissive bootstrap policy (DEV only; no-op in PROD). A permissive
--    `USING (true)` would OR with the strict policies below and nullify isolation.
DROP POLICY IF EXISTS "herd_app_full_access" ON "Product";

-- 3. tenant_isolation FOR ALL — exact match (governs INSERT/UPDATE/DELETE + reads).
DROP POLICY IF EXISTS "Product_tenant_isolation" ON "Product";
CREATE POLICY "Product_tenant_isolation" ON "Product"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);

-- 4. vertical_read FOR SELECT — parent org sees descendant rows (org-tree).
DROP POLICY IF EXISTS "Product_vertical_read" ON "Product";
CREATE POLICY "Product_vertical_read" ON "Product" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- 5. Promote tenant_id to NOT NULL (backfill complete: 0 nulls in DEV + PROD).
ALTER TABLE "Product" ALTER COLUMN "tenant_id" SET NOT NULL;
