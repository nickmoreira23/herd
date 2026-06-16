import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { seedBlockTaxonomy } from "@/lib/marketplace/seed-taxonomy";

/**
 * L2a.2b — seedBlockTaxonomy materializes the products manifest taxonomy into
 * per-(org,block) Category/Subcategory rows. Idempotent, tenant-isolated, and a
 * no-op for flat blocks. seedBlockTaxonomy uses the runtime singleton prisma
 * (herd_app + tenancy Extension); we run it under withTenant and assert via an
 * admin (bypass) client. Excluded from `npm test` — runs via test:integration.
 */
const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
const admin = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const PREFIX = `test-tax-seed-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };

beforeAll(async () => {
  orgA = await admin.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Tax Seed A" },
    select: { id: true },
  });
  orgB = await admin.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Tax Seed B" },
    select: { id: true },
  });
});

afterAll(async () => {
  // Subcategories cascade from categories; categories cascade from org.
  await admin.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  await admin.$disconnect();
});

describe("seedBlockTaxonomy (integration)", () => {
  it("seeds the products taxonomy (3 categories / 16 subcategories) for the org", async () => {
    await withTenant(orgA.id, () => seedBlockTaxonomy(orgA.id, "products"));

    const cats = await admin.category.findMany({
      where: { tenantId: orgA.id, blockName: "products" },
    });
    expect(cats).toHaveLength(3);
    expect(cats.map((c) => c.sourceKey).sort()).toEqual(["accessory", "apparel", "supplement"]);

    const subs = await admin.subcategory.findMany({ where: { tenantId: orgA.id } });
    expect(subs).toHaveLength(16);
  });

  it("is idempotent — re-running does not duplicate", async () => {
    await withTenant(orgA.id, () => seedBlockTaxonomy(orgA.id, "products"));
    await withTenant(orgA.id, () => seedBlockTaxonomy(orgA.id, "products"));

    const cats = await admin.category.count({
      where: { tenantId: orgA.id, blockName: "products" },
    });
    const subs = await admin.subcategory.count({ where: { tenantId: orgA.id } });
    expect(cats).toBe(3);
    expect(subs).toBe(16);
  });

  it("is tenant-isolated — org B gets its own copy, org A untouched", async () => {
    await withTenant(orgB.id, () => seedBlockTaxonomy(orgB.id, "products"));

    const aCats = await admin.category.count({ where: { tenantId: orgA.id, blockName: "products" } });
    const bCats = await admin.category.count({ where: { tenantId: orgB.id, blockName: "products" } });
    expect(aCats).toBe(3);
    expect(bCats).toBe(3);
  });

  it("flat block (no manifest taxonomy) seeds nothing", async () => {
    await withTenant(orgA.id, () => seedBlockTaxonomy(orgA.id, "notes"));
    const notesCats = await admin.category.count({
      where: { tenantId: orgA.id, blockName: "notes" },
    });
    expect(notesCats).toBe(0);
  });
});
