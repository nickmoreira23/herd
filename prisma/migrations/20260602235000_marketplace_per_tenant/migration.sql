-- Fase 0 SE3 — Marketplace per-tenant.
-- marketplace_sections + marketplace_section_scopes become tenant-scoped:
-- tenant_id NOT NULL + FK(organizations) CASCADE + index, RLS (Sub-26.2 molde),
-- and the global slug unique is replaced by a per-tenant composite unique
-- (Department molde, Sub-19). Tables are empty (no marketplace seed; demo
-- discarded per Fase 0 v5 decision #9), so ADD COLUMN ... NOT NULL is safe.

-- DropIndex — global slug unique (replaced by per-tenant composite below).
DROP INDEX "marketplace_sections_slug_key";

-- AlterTable
ALTER TABLE "marketplace_section_scopes" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "marketplace_sections" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "marketplace_section_scopes_tenant_id_idx" ON "marketplace_section_scopes"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_sections_tenant_id_idx" ON "marketplace_sections"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_sections_tenant_id_slug_key" ON "marketplace_sections"("tenant_id", "slug");

-- AddForeignKey
ALTER TABLE "marketplace_sections" ADD CONSTRAINT "marketplace_sections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_section_scopes" ADD CONSTRAINT "marketplace_section_scopes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Row Level Security (Sub-26.2 canonical molde — two policies per table) ──
-- <base>_tenant_isolation  FOR ALL    : exact (governs INSERT/UPDATE/DELETE)
-- <base>_vertical_read     FOR SELECT : vertical (parent sees descendants)
ALTER TABLE "marketplace_sections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_sections_tenant_isolation" ON "marketplace_sections"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "marketplace_sections_vertical_read" ON "marketplace_sections" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

ALTER TABLE "marketplace_section_scopes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_section_scopes_tenant_isolation" ON "marketplace_section_scopes"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
CREATE POLICY "marketplace_section_scopes_vertical_read" ON "marketplace_section_scopes" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));
