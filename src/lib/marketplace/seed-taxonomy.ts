import { prisma } from "@/lib/prisma";
import { getBlockTaxonomy } from "@/lib/blocks/taxonomy";

/**
 * L2a.2b — idempotently materialize a block's manifest taxonomy into per-(org,
 * block) Category/Subcategory rows for the given tenant.
 *
 * MUST run inside withTenant(orgId) (the sections write-path already does). A
 * flat block (no manifest taxonomy) seeds nothing. Idempotent: keyed on
 * (tenantId, blockName, sourceKey) — re-saving a section never duplicates.
 * Does NOT overwrite an edited `name` and does NOT delete orphan rows (another
 * section may use them; cleanup is a future decision).
 *
 * `sourceKey` is the manifest taxonomy `key` verbatim (already a validated
 * slug in L2a.2a) — the same value marketplace scopeValue stores.
 */
export async function seedBlockTaxonomy(orgId: string, blockName: string): Promise<void> {
  const taxonomy = getBlockTaxonomy(blockName);
  if (!taxonomy) return;

  for (const [ci, cat] of taxonomy.categories.entries()) {
    let category = await prisma.category.findFirst({
      where: { blockName, sourceKey: cat.key },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { tenantId: orgId, blockName, sourceKey: cat.key, name: cat.label, sortOrder: ci },
      });
    }

    for (const [si, sub] of (cat.subcategories ?? []).entries()) {
      const existing = await prisma.subcategory.findFirst({
        where: { categoryId: category.id, sourceKey: sub.key },
      });
      if (!existing) {
        await prisma.subcategory.create({
          data: { tenantId: orgId, categoryId: category.id, sourceKey: sub.key, name: sub.label, sortOrder: si },
        });
      }
    }
  }
}

/** Seed every (deduped) block's taxonomy for the tenant. No-op for flat blocks. */
export async function seedBlocksTaxonomy(orgId: string, blockNames: string[]): Promise<void> {
  for (const name of [...new Set(blockNames)]) {
    await seedBlockTaxonomy(orgId, name);
  }
}
