import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * L2b.1 — Listing per-tenant isolation (two-connection pattern, RLS 2-policy
 * molde). Mirrors the tier/settings/category isolation tests. Excluded from
 * `npm test` — runs via test:integration against a real RLS-enabled DB.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const scopedPrisma = runtimeClient.$extends(createTenantScopingExtension(["Listing"]));

const PREFIX = `test-listing-rls-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };
let parentOrg: { id: string };
let childOrg: { id: string };
let aListingId: string;

function listingData(tenantId: string, sourceId: string) {
  return { tenantId, blockName: "products", sourceId: `${PREFIX}-${sourceId}` };
}

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Listing A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Listing B" },
    select: { id: true },
  });
  parentOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-p`, subdomain: `${PREFIX}-p`, name: "Listing Parent" },
    select: { id: true },
  });
  childOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-c`, subdomain: `${PREFIX}-c`, name: "Listing Child", parentOrgId: parentOrg.id },
    select: { id: true },
  });

  const a = await adminClient.listing.create({ data: listingData(orgA.id, "a1") });
  aListingId = a.id;
  await adminClient.listing.create({ data: listingData(orgB.id, "b1") });
  await adminClient.listing.create({ data: listingData(parentOrg.id, "p1") });
  await adminClient.listing.create({ data: listingData(childOrg.id, "c1") });
});

afterAll(async () => {
  await adminClient.listing.deleteMany({
    where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
  });
  await adminClient.organization.deleteMany({
    where: { id: { in: [childOrg.id, orgA.id, orgB.id, parentOrg.id] } },
  });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("Listing per-tenant isolation (integration)", () => {
  it("withTenant(orgA) sees only org A's listing", async () => {
    const rows = await withTenant(orgA.id, () => scopedPrisma.listing.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgA.id);
  });

  it("withTenant(orgB) sees only org B's (no leak)", async () => {
    const rows = await withTenant(orgB.id, () => scopedPrisma.listing.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgB.id);
  });

  it("runtime read WITHOUT withTenant sees nothing (RLS deny-by-default)", async () => {
    const rows = await scopedPrisma.listing.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(rows).toHaveLength(0);
  });

  it("vertical_read: parent sees its own + descendant's listings", async () => {
    const rows = await withTenant(parentOrg.id, () => scopedPrisma.listing.findMany());
    expect(rows.map((r) => r.tenantId).sort()).toEqual([parentOrg.id, childOrg.id].sort());
  });

  it("cross-tenant write rejected (WITH CHECK)", async () => {
    await expect(
      withTenant(orgA.id, () =>
        scopedPrisma.listing.update({ where: { id: aListingId }, data: { tenantId: orgB.id } }),
      ),
    ).rejects.toThrow();
    const still = await adminClient.listing.findUnique({ where: { id: aListingId } });
    expect(still?.tenantId).toBe(orgA.id);
  });

  it("admin connection (bypass RLS) sees all four", async () => {
    const all = await adminClient.listing.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
    });
    expect(all).toHaveLength(4);
  });
});
