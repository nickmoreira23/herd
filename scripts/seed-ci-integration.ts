import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Minimal fixture set for the CI integration job (CI-1): two orgs in a
 * parent/child hierarchy, products under each tenant, and one
 * SubscriptionTier (required by tenancy/isolation.integration.test.ts).
 *
 * Most integration suites self-seed with test prefixes; this covers only the
 * cross-suite baseline. Connects as the admin role (DATABASE_URL) because the
 * seed crosses tenant boundaries — mirrors the two-connection test pattern.
 * Idempotent via upsert on unique keys (slug / sku).
 */
async function main() {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) throw new Error("No database URL in env (DATABASE_URL or DIRECT_URL)");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  const parent = await prisma.organization.upsert({
    where: { slug: "ci-parent" },
    update: {},
    create: { slug: "ci-parent", subdomain: "ci-parent", name: "CI Parent Org" },
  });

  const child = await prisma.organization.upsert({
    where: { slug: "ci-child" },
    update: { parentOrgId: parent.id },
    create: {
      slug: "ci-child",
      subdomain: "ci-child",
      name: "CI Child Org",
      parentOrgId: parent.id,
    },
  });

  const tier = await prisma.subscriptionTier.upsert({
    where: { slug: "ci-tier" },
    update: {},
    create: {
      slug: "ci-tier",
      name: "CI Tier",
      monthlyPrice: "29.90",
      biannualPrice: "149.90",
      annualPrice: "299.90",
      monthlyCredits: "100.00",
      partnerDiscountPercent: "10.00",
      apparelCadence: "NONE",
    },
  });

  const products = [
    { sku: "CI-PARENT-001", name: "CI Parent Product A", tenantId: parent.id },
    { sku: "CI-PARENT-002", name: "CI Parent Product B", tenantId: parent.id },
    { sku: "CI-CHILD-001", name: "CI Child Product A", tenantId: child.id },
    { sku: "CI-CHILD-002", name: "CI Child Product B", tenantId: child.id },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { tenantId: p.tenantId },
      create: {
        ...p,
        category: "SUPPLEMENT",
        retailPrice: "49.90",
        memberPrice: "39.90",
        costOfGoods: "15.00",
      },
    });
  }

  console.log(
    `[seed:ci-integration] orgs: ${parent.slug} ← parent of → ${child.slug}; ` +
      `tier: ${tier.slug}; products: ${products.length} upserted.`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed:ci-integration] FAILED:", err);
  process.exit(1);
});
