-- L2b.1 — Listing: an org's curated entry referencing ONE block record
-- abstractly via (block_name, source_id), with its own override data + optional
-- price override (Money: cents + currency). Additive: creates a NEW empty table;
-- nothing populates it until the write route is used. Auto-applies in PROD safely.
--
-- No cross-block FK on source_id (it is cross-block by design) — soft-validated
-- at write time, resolves to "unavailable" if the record vanishes. Tenant-scoped
-- via the Sub-26.2 canonical 2-policy molde (same as marketplace_sections /
-- categories). No FORCE, no herd_app_full_access, NOT in enable-rls.sql.

CREATE TABLE "listings" (
  "id"                      UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"               UUID NOT NULL,
  "block_name"              TEXT NOT NULL,
  "source_id"               TEXT NOT NULL,
  "title_override"          TEXT,
  "description_override"    TEXT,
  "image_url_override"      TEXT,
  "price_override_cents"    BIGINT,
  "price_override_currency" TEXT,
  "featured"                BOOLEAN NOT NULL DEFAULT false,
  "sort_order"              INTEGER NOT NULL DEFAULT 0,
  "status"                  "MarketplaceSectionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL,

  CONSTRAINT "listings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listings_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "listings_tenant_id_block_name_source_id_key"
  ON "listings"("tenant_id", "block_name", "source_id");
CREATE INDEX "listings_tenant_id_idx" ON "listings"("tenant_id");
CREATE INDEX "listings_tenant_id_block_name_idx" ON "listings"("tenant_id", "block_name");

-- ─── Row Level Security (Sub-26.2 canonical molde — two policies per table) ──
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_tenant_isolation" ON "listings"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "listings_vertical_read" ON "listings" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));
