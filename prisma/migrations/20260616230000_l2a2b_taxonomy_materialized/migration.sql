-- L2a.2b — materialize block taxonomy into per-(org,block) entities.
-- Additive: creates two NEW empty tables (categories + subcategories); nothing
-- consumes them until a section is saved with a taxonomy-bearing block (the seed
-- runs in the sections write-path under withTenant). Auto-applies in PROD safely.
--
-- Tenant-scoped via the Sub-26.2 canonical 2-policy molde (tenant_isolation
-- FOR ALL + vertical_read FOR SELECT), same as marketplace_sections. No FORCE,
-- no herd_app_full_access, NOT added to enable-rls.sql (RLS lifecycle owned by
-- migrations — L1a.4/L1b.3 lesson).
--
-- source_key = stable slug (mirrors the manifest taxonomy key); name = editable
-- display (seeded from the manifest label). Uniqueness gives integrity by
-- construction so marketplace scopeValue can store the slug without an FK.

CREATE TABLE "categories" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"  UUID NOT NULL,
  "block_name" TEXT NOT NULL,
  "source_key" TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "categories_tenant_id_block_name_source_key_key"
  ON "categories"("tenant_id", "block_name", "source_key");
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");
CREATE INDEX "categories_tenant_id_block_name_idx" ON "categories"("tenant_id", "block_name");

CREATE TABLE "subcategories" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"   UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "source_key"  TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subcategories_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "subcategories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "subcategories_tenant_id_category_id_source_key_key"
  ON "subcategories"("tenant_id", "category_id", "source_key");
CREATE INDEX "subcategories_tenant_id_idx" ON "subcategories"("tenant_id");
CREATE INDEX "subcategories_category_id_idx" ON "subcategories"("category_id");

-- ─── Row Level Security (Sub-26.2 canonical molde — two policies per table) ──
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_tenant_isolation" ON "categories"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "categories_vertical_read" ON "categories" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

ALTER TABLE "subcategories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories_tenant_isolation" ON "subcategories"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "subcategories_vertical_read" ON "subcategories" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));
