-- L1a.4 addendum — per-tenant SKU uniqueness.
-- Swap the global sku unique for a (tenant_id, sku) composite. 0 collisions
-- verified in DEV and PROD before this migration. IF EXISTS keeps it
-- idempotent across environments where the global index was already dropped.

DROP INDEX IF EXISTS "Product_sku_key";

CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "Product"("tenant_id", "sku");
