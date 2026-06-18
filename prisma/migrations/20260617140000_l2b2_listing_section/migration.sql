-- L2b.2 — unification (Option A, #42): the ITEM-scope is replaced by Listing,
-- and a Listing now BELONGS to a section. Adds listings.section_id (FK→
-- marketplace_sections CASCADE) and re-keys the uniqueness from
-- (tenant, block, source) to (tenant, section, block, source) — a record may be
-- curated, with distinct overrides, in multiple sections.
--
-- Safe: the listings table is empty in DEV+PROD (L2b.1 added no rows), so the
-- NOT NULL column add + the unique swap touch zero rows. Auto-applies in PROD.
-- The MarketplaceScopeType.ITEM enum value is intentionally KEPT (deprecated,
-- not dropped — dropping a Postgres enum value requires a fragile type rebuild;
-- with 0 ITEM scopes anywhere, the wizard simply stops emitting it and the
-- resolver stops treating it).

ALTER TABLE "listings" ADD COLUMN "section_id" UUID NOT NULL;

ALTER TABLE "listings" ADD CONSTRAINT "listings_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "marketplace_sections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-key uniqueness: drop (tenant, block, source) → add (tenant, section, block, source).
DROP INDEX IF EXISTS "listings_tenant_id_block_name_source_id_key";
CREATE UNIQUE INDEX "listings_tenant_id_section_id_block_name_source_id_key"
  ON "listings"("tenant_id", "section_id", "block_name", "source_id");

CREATE INDEX "listings_section_id_idx" ON "listings"("section_id");
