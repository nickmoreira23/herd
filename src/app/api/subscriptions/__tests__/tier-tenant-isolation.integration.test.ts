import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * L1b.3 — SubscriptionTier per-tenant isolation (two-connection pattern).
 *
 * Proves the strict RLS + tenancy-Extension boundary on SubscriptionTier now
 * that the permissive herd_app_full_access is gone and the Sub-26.2 2-policy
 * molde is in force (SubscriptionTier_tenant_isolation FOR ALL +
 * SubscriptionTier_vertical_read FOR SELECT), plus the per-tenant slug unique:
 *  - a read under withTenant(orgA) sees only org A's tiers (tenant_isolation),
 *  - withTenant(orgB) sees only org B's (no leak),
 *  - a runtime read WITHOUT withTenant sees nothing (RLS deny-by-default),
 *  - vertical_read: a parent org sees its descendant org's tiers,
 *  - a cross-tenant write (moving tenant_id to another org) is rejected (WITH CHECK),
 *  - slug is unique per tenant: same slug allowed across distinct tenants,
 *    rejected within the same tenant (composite @@unique([tenantId, slug])).
 *
 * Twin of product-tenant-isolation.integration.test.ts. Excluded from
 * `npm test` (*.integration.test.ts) — runs against a real RLS-enabled DB via
 * `npm run test:integration`.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const scopedPrisma = runtimeClient.$extends(createTenantScopingExtension(["SubscriptionTier"]));

const PREFIX = `test-tier-rls-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };
let parentOrg: { id: string };
let childOrg: { id: string };
let aTierId: string;

function tierData(tenantId: string, slug: string, name: string) {
  return {
    tenantId,
    slug: `${PREFIX}-${slug}`,
    name,
    monthlyPrice: 10,
    biannualPrice: 50,
    annualPrice: 90,
    monthlyCredits: 100,
    partnerDiscountPercent: 0,
    apparelCadence: "NONE",
  };
}

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Tier Tenant A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Tier Tenant B" },
    select: { id: true },
  });
  parentOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-p`, subdomain: `${PREFIX}-p`, name: "Tier Parent" },
    select: { id: true },
  });
  childOrg = await adminClient.organization.create({
    data: {
      slug: `${PREFIX}-c`,
      subdomain: `${PREFIX}-c`,
      name: "Tier Child",
      parentOrgId: parentOrg.id,
    },
    select: { id: true },
  });

  const a1 = await adminClient.subscriptionTier.create({ data: tierData(orgA.id, "a1", "A One") });
  aTierId = a1.id;
  await adminClient.subscriptionTier.create({ data: tierData(orgA.id, "a2", "A Two") });
  await adminClient.subscriptionTier.create({ data: tierData(orgB.id, "b1", "B One") });
  await adminClient.subscriptionTier.create({ data: tierData(parentOrg.id, "p1", "Parent One") });
  await adminClient.subscriptionTier.create({ data: tierData(childOrg.id, "c1", "Child One") });
});

afterAll(async () => {
  await adminClient.subscriptionTier.deleteMany({
    where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
  });
  await adminClient.organization.deleteMany({
    where: { id: { in: [childOrg.id, orgA.id, orgB.id, parentOrg.id] } },
  });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("SubscriptionTier per-tenant isolation (integration)", () => {
  it("withTenant(orgA) sees only org A's tiers", async () => {
    const rows = await withTenant(orgA.id, () => scopedPrisma.subscriptionTier.findMany());
    expect(rows).toHaveLength(2);
    expect(rows.every((t) => t.tenantId === orgA.id)).toBe(true);
  });

  it("withTenant(orgB) sees only org B's tier (no leak from A)", async () => {
    const rows = await withTenant(orgB.id, () => scopedPrisma.subscriptionTier.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgB.id);
    expect(rows[0].name).toBe("B One");
  });

  it("runtime read WITHOUT withTenant sees nothing (RLS deny-by-default)", async () => {
    const rows = await scopedPrisma.subscriptionTier.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(rows).toHaveLength(0);
  });

  it("vertical_read: parent org sees its own + descendant's tiers", async () => {
    const rows = await withTenant(parentOrg.id, () => scopedPrisma.subscriptionTier.findMany());
    const tenantIds = rows.map((t) => t.tenantId).sort();
    expect(rows).toHaveLength(2);
    expect(tenantIds).toEqual([parentOrg.id, childOrg.id].sort());
  });

  it("vertical_read: child org does NOT see the parent's tiers", async () => {
    const rows = await withTenant(childOrg.id, () => scopedPrisma.subscriptionTier.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(childOrg.id);
  });

  it("cross-tenant write is rejected (WITH CHECK) — cannot move a tier to another org", async () => {
    await expect(
      withTenant(orgA.id, () =>
        scopedPrisma.subscriptionTier.update({
          where: { id: aTierId },
          data: { tenantId: orgB.id },
        })
      )
    ).rejects.toThrow();
    const still = await adminClient.subscriptionTier.findUnique({ where: { id: aTierId } });
    expect(still?.tenantId).toBe(orgA.id);
  });

  it("admin connection (bypass RLS) sees all five tiers", async () => {
    const all = await adminClient.subscriptionTier.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
    });
    expect(all).toHaveLength(5);
  });
});

describe("SubscriptionTier per-tenant slug uniqueness (integration)", () => {
  const SLUG = `${PREFIX}-shared-slug`;

  it("allows the same slug across distinct tenants", async () => {
    const a = await adminClient.subscriptionTier.create({
      data: { ...tierData(orgA.id, "x", "Dup A"), slug: SLUG },
    });
    const b = await adminClient.subscriptionTier.create({
      data: { ...tierData(orgB.id, "x", "Dup B"), slug: SLUG },
    });
    expect(a.slug).toBe(SLUG);
    expect(b.slug).toBe(SLUG);
    // cleanup these two extra rows
    await adminClient.subscriptionTier.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  });

  it("rejects a duplicate slug within the same tenant (composite unique)", async () => {
    const first = await adminClient.subscriptionTier.create({
      data: { ...tierData(orgA.id, "y", "Dup Same 1"), slug: `${SLUG}-same` },
    });
    await expect(
      adminClient.subscriptionTier.create({
        data: { ...tierData(orgA.id, "z", "Dup Same 2"), slug: `${SLUG}-same` },
      })
    ).rejects.toThrow();
    await adminClient.subscriptionTier.deleteMany({ where: { id: first.id } });
  });
});
