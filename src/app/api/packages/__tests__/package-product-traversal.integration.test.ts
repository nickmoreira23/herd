import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * L1a.4 addendum — package→product join under strict Product RLS.
 *
 * The Package family is NOT tenant-scoped, so a nested
 * `include: { product: ... }` runs without the tenant GUC and strict RLS
 * denies the joined rows. The mitigation pattern (applied to the 9 traversal
 * sites) is: fetch the PackageTierProduct join rows plain, read the catalog
 * via a direct `prisma.product.findMany({ where: { id: { in } } })` under
 * `withTenant`, and join in memory. This test proves the pattern:
 *  - under withTenant(org) the direct read returns the catalog rows,
 *  - WITHOUT tenant context the same read returns nothing (RLS deny) —
 *    the join degrades to empty instead of leaking.
 *
 * Mirrors src/app/api/products/__tests__/product-tenant-isolation.integration.test.ts.
 * Excluded from `npm test` (*.integration.test.ts) — runs against a real
 * RLS-enabled DB via `npm run test:integration`.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const scopedPrisma = runtimeClient.$extends(createTenantScopingExtension(["Product"]));

const PREFIX = `test-pkg-trav-${Date.now()}`;
let org: { id: string };
let otherOrg: { id: string };
let packageId: string;
let productId: string;
let foreignProductId: string;
let variantId: string;

beforeAll(async () => {
  org = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Pkg Trav Org" },
    select: { id: true },
  });
  otherOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Pkg Trav Other" },
    select: { id: true },
  });

  const product = await adminClient.product.create({
    data: {
      tenantId: org.id,
      sku: `${PREFIX}-p1`,
      name: "Trav Product",
      category: "SUPPLEMENT",
      retailPrice: 10,
      memberPrice: 8,
      costOfGoods: 3,
    },
  });
  productId = product.id;

  const foreign = await adminClient.product.create({
    data: {
      tenantId: otherOrg.id,
      sku: `${PREFIX}-f1`,
      name: "Foreign Product",
      category: "SUPPLEMENT",
      retailPrice: 10,
      memberPrice: 8,
      costOfGoods: 3,
    },
  });
  foreignProductId = foreign.id;

  const tier = await adminClient.subscriptionTier.create({
    data: {
      tenantId: org.id, // L1b.3 — SubscriptionTier.tenant_id is NOT NULL now.
      name: "Trav Tier",
      slug: `${PREFIX}-tier`,
      monthlyPrice: 10,
      biannualPrice: 50,
      annualPrice: 90,
      monthlyCredits: 100,
      partnerDiscountPercent: 0,
      apparelCadence: "NONE",
    },
    select: { id: true },
  });

  const pkg = await adminClient.package.create({
    data: { name: "Trav Pkg", slug: `${PREFIX}-pkg`, fitnessGoal: "GENERAL_WELLNESS" },
    select: { id: true },
  });
  packageId = pkg.id;

  const variant = await adminClient.packageTierVariant.create({
    data: { packageId: pkg.id, subscriptionTierId: tier.id },
    select: { id: true },
  });
  variantId = variant.id;

  // One in-tenant product and one foreign product hang off the same variant —
  // the join must surface only the tenant's own.
  await adminClient.packageTierProduct.createMany({
    data: [
      { variantId: variant.id, productId, quantity: 1, creditCost: 8 },
      { variantId: variant.id, productId: foreignProductId, quantity: 1, creditCost: 8 },
    ],
  });
});

afterAll(async () => {
  await adminClient.packageTierProduct.deleteMany({ where: { variantId } });
  await adminClient.packageTierVariant.deleteMany({ where: { id: variantId } });
  await adminClient.package.deleteMany({ where: { id: packageId } });
  await adminClient.subscriptionTier.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await adminClient.product.deleteMany({ where: { tenantId: { in: [org.id, otherOrg.id] } } });
  await adminClient.organization.deleteMany({ where: { id: { in: [org.id, otherOrg.id] } } });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("package→product join under strict Product RLS (integration)", () => {
  it("withTenant: direct findMany by join-row ids returns the tenant's products", async () => {
    const joinRows = await runtimeClient.packageTierVariant.findUnique({
      where: { id: variantId },
      include: { products: true },
    });
    expect(joinRows?.products).toHaveLength(2);

    const ids = joinRows!.products.map((p) => p.productId);
    const catalog = await withTenant(org.id, () =>
      scopedPrisma.product.findMany({ where: { id: { in: ids } } })
    );
    const productById = new Map(catalog.map((p) => [p.id, p]));

    const joined = joinRows!.products.flatMap((p) => {
      const product = productById.get(p.productId);
      return product ? [{ ...p, product }] : [];
    });

    // Only the tenant's own product survives the join; the foreign one is
    // invisible (no leak through the unscoped Package family).
    expect(joined).toHaveLength(1);
    expect(joined[0].product.id).toBe(productId);
    expect(joined[0].product.name).toBe("Trav Product");
  });

  it("without tenant context the catalog read is empty — join degrades to no products", async () => {
    const catalog = await scopedPrisma.product.findMany({
      where: { id: { in: [productId, foreignProductId] } },
    });
    expect(catalog).toHaveLength(0);
  });

  it("nested include through the unscoped Package family does NOT leak product rows", async () => {
    // Strict RLS denies the joined Product rows even though the join rows
    // themselves are visible — exactly the failure mode the in-memory join
    // pattern replaces. Prisma surfaces a denied required relation either as
    // an inconsistency error or as missing rows depending on version; both
    // prove the deny, neither leaks a product.
    let visibleNames: unknown[] = [];
    let denied = false;
    try {
      const traversed = await runtimeClient.packageTierVariant.findUnique({
        where: { id: variantId },
        include: { products: { include: { product: true } } },
      });
      visibleNames = (traversed?.products ?? [])
        .map((p) => (p as { product?: { name?: string } | null }).product?.name)
        .filter(Boolean);
    } catch {
      denied = true;
    }
    expect(denied || visibleNames.length === 0).toBe(true);
  }, 30000);
});
