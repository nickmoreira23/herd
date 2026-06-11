import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * L1a.4 — Product per-tenant isolation (two-connection pattern).
 *
 * Proves the strict RLS + tenancy-Extension boundary on Product now that the
 * permissive herd_app_full_access is dropped and the Sub-26.2 2-policy molde is
 * in force (Product_tenant_isolation FOR ALL + Product_vertical_read FOR SELECT):
 *  - a read under withTenant(orgA) sees only org A's catalog (tenant_isolation),
 *  - withTenant(orgB) sees only org B's (no leak),
 *  - a runtime read WITHOUT withTenant sees nothing (RLS deny-by-default),
 *  - vertical_read: a parent org sees its descendant org's Products,
 *  - a cross-tenant write (moving tenant_id to another org) is rejected (WITH CHECK).
 *
 * Mirrors src/app/api/marketplace/__tests__/tenant-isolation.integration.test.ts.
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

const PREFIX = `test-prod-rls-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };
let parentOrg: { id: string };
let childOrg: { id: string };
let aProductId: string;

function productData(tenantId: string, sku: string, name: string) {
  return {
    tenantId,
    sku: `${PREFIX}-${sku}`,
    name,
    category: "SUPPLEMENT",
    retailPrice: 10,
    memberPrice: 8,
    costOfGoods: 3,
  };
}

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Prod Tenant A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Prod Tenant B" },
    select: { id: true },
  });
  parentOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-p`, subdomain: `${PREFIX}-p`, name: "Prod Parent" },
    select: { id: true },
  });
  childOrg = await adminClient.organization.create({
    data: {
      slug: `${PREFIX}-c`,
      subdomain: `${PREFIX}-c`,
      name: "Prod Child",
      parentOrgId: parentOrg.id,
    },
    select: { id: true },
  });

  const a1 = await adminClient.product.create({ data: productData(orgA.id, "a1", "A One") });
  aProductId = a1.id;
  await adminClient.product.create({ data: productData(orgA.id, "a2", "A Two") });
  await adminClient.product.create({ data: productData(orgB.id, "b1", "B One") });
  await adminClient.product.create({ data: productData(parentOrg.id, "p1", "Parent One") });
  await adminClient.product.create({ data: productData(childOrg.id, "c1", "Child One") });
});

afterAll(async () => {
  await adminClient.product.deleteMany({
    where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
  });
  await adminClient.organization.deleteMany({
    where: { id: { in: [childOrg.id, orgA.id, orgB.id, parentOrg.id] } },
  });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("Product per-tenant isolation (integration)", () => {
  it("withTenant(orgA) sees only org A's products", async () => {
    const rows = await withTenant(orgA.id, () => scopedPrisma.product.findMany());
    expect(rows).toHaveLength(2);
    expect(rows.every((p) => p.tenantId === orgA.id)).toBe(true);
  });

  it("withTenant(orgB) sees only org B's product (no leak from A)", async () => {
    const rows = await withTenant(orgB.id, () => scopedPrisma.product.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgB.id);
    expect(rows[0].name).toBe("B One");
  });

  it("runtime read WITHOUT withTenant sees nothing (RLS deny-by-default)", async () => {
    const rows = await scopedPrisma.product.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(rows).toHaveLength(0);
  });

  it("vertical_read: parent org sees its own + descendant's products", async () => {
    const rows = await withTenant(parentOrg.id, () => scopedPrisma.product.findMany());
    const tenantIds = rows.map((p) => p.tenantId).sort();
    expect(rows).toHaveLength(2);
    expect(tenantIds).toEqual([parentOrg.id, childOrg.id].sort());
  });

  it("vertical_read: child org does NOT see the parent's products", async () => {
    const rows = await withTenant(childOrg.id, () => scopedPrisma.product.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(childOrg.id);
  });

  it("cross-tenant write is rejected (WITH CHECK) — cannot move a product to another org", async () => {
    await expect(
      withTenant(orgA.id, () =>
        scopedPrisma.product.update({
          where: { id: aProductId },
          data: { tenantId: orgB.id },
        })
      )
    ).rejects.toThrow();
    // The row stayed in org A (verified via admin bypass).
    const still = await adminClient.product.findUnique({ where: { id: aProductId } });
    expect(still?.tenantId).toBe(orgA.id);
  });

  it("admin connection (bypass RLS) sees all five rows", async () => {
    const all = await adminClient.product.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
    });
    expect(all).toHaveLength(5);
  });
});
