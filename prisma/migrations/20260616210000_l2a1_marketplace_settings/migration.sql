-- L2a.1 — per-org marketplace config (MarketplaceSettings, 1:1 with Organization).
-- Additive + isolated: creates a NEW empty table; nothing reads/writes it yet
-- (storefront config arrives in L2b). Born minimal — just the storefront toggle.
-- Tenant-scoped via the Sub-26.2 canonical 2-policy molde, same as
-- marketplace_sections (tenant_isolation FOR ALL + vertical_read FOR SELECT).
-- No FORCE; no herd_app_full_access permissive policy; not added to
-- enable-rls.sql (RLS lifecycle owned by migrations — L1a.4/L1b.3 lesson).

CREATE TABLE "marketplace_settings" (
  "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"          UUID NOT NULL,
  "storefront_enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketplace_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_settings_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 1:1 per org.
CREATE UNIQUE INDEX "marketplace_settings_tenant_id_key" ON "marketplace_settings"("tenant_id");

-- ─── Row Level Security (Sub-26.2 canonical molde — two policies per table) ──
-- <base>_tenant_isolation  FOR ALL    : exact (governs INSERT/UPDATE/DELETE)
-- <base>_vertical_read     FOR SELECT : vertical (parent sees descendants)
ALTER TABLE "marketplace_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_settings_tenant_isolation" ON "marketplace_settings"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "marketplace_settings_vertical_read" ON "marketplace_settings" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));
