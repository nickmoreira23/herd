import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * L2a.1 — MarketplaceSettings per-tenant isolation (two-connection pattern).
 *
 * Proves the strict RLS 2-policy molde on the new MarketplaceSettings table
 * (MarketplaceSettings_tenant_isolation FOR ALL + _vertical_read FOR SELECT):
 *  - a read under withTenant(orgA) sees only org A's settings,
 *  - withTenant(orgB) sees only org B's (no leak),
 *  - a runtime read WITHOUT withTenant sees nothing (RLS deny-by-default),
 *  - vertical_read: a parent org sees its descendant org's settings,
 *  - a cross-tenant write (moving tenant_id to another org) is rejected (WITH CHECK).
 *
 * Twin of tier/product tenant-isolation tests. Excluded from `npm test`
 * (*.integration.test.ts) — runs against a real RLS-enabled DB via
 * `npm run test:integration`.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const scopedPrisma = runtimeClient.$extends(createTenantScopingExtension(["MarketplaceSettings"]));

const PREFIX = `test-mktset-rls-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };
let parentOrg: { id: string };
let childOrg: { id: string };
let aSettingsId: string;

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "MktSet Tenant A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "MktSet Tenant B" },
    select: { id: true },
  });
  parentOrg = await adminClient.organization.create({
    data: { slug: `${PREFIX}-p`, subdomain: `${PREFIX}-p`, name: "MktSet Parent" },
    select: { id: true },
  });
  childOrg = await adminClient.organization.create({
    data: {
      slug: `${PREFIX}-c`,
      subdomain: `${PREFIX}-c`,
      name: "MktSet Child",
      parentOrgId: parentOrg.id,
    },
    select: { id: true },
  });

  const a = await adminClient.marketplaceSettings.create({
    data: { tenantId: orgA.id, storefrontEnabled: true },
  });
  aSettingsId = a.id;
  await adminClient.marketplaceSettings.create({ data: { tenantId: orgB.id } });
  await adminClient.marketplaceSettings.create({ data: { tenantId: parentOrg.id } });
  await adminClient.marketplaceSettings.create({ data: { tenantId: childOrg.id } });
});

afterAll(async () => {
  await adminClient.marketplaceSettings.deleteMany({
    where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
  });
  await adminClient.organization.deleteMany({
    where: { id: { in: [childOrg.id, orgA.id, orgB.id, parentOrg.id] } },
  });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("MarketplaceSettings per-tenant isolation (integration)", () => {
  it("withTenant(orgA) sees only org A's settings", async () => {
    const rows = await withTenant(orgA.id, () => scopedPrisma.marketplaceSettings.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgA.id);
    expect(rows[0].storefrontEnabled).toBe(true);
  });

  it("withTenant(orgB) sees only org B's settings (no leak from A)", async () => {
    const rows = await withTenant(orgB.id, () => scopedPrisma.marketplaceSettings.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgB.id);
    expect(rows[0].storefrontEnabled).toBe(false);
  });

  it("runtime read WITHOUT withTenant sees nothing (RLS deny-by-default)", async () => {
    const rows = await scopedPrisma.marketplaceSettings.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(rows).toHaveLength(0);
  });

  it("vertical_read: parent org sees its own + descendant's settings", async () => {
    const rows = await withTenant(parentOrg.id, () => scopedPrisma.marketplaceSettings.findMany());
    const tenantIds = rows.map((s) => s.tenantId).sort();
    expect(rows).toHaveLength(2);
    expect(tenantIds).toEqual([parentOrg.id, childOrg.id].sort());
  });

  it("vertical_read: child org does NOT see the parent's settings", async () => {
    const rows = await withTenant(childOrg.id, () => scopedPrisma.marketplaceSettings.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(childOrg.id);
  });

  it("cross-tenant write is rejected (WITH CHECK) — cannot move settings to another org", async () => {
    await expect(
      withTenant(orgA.id, () =>
        scopedPrisma.marketplaceSettings.update({
          where: { id: aSettingsId },
          data: { tenantId: orgB.id },
        })
      )
    ).rejects.toThrow();
    const still = await adminClient.marketplaceSettings.findUnique({ where: { id: aSettingsId } });
    expect(still?.tenantId).toBe(orgA.id);
  });

  it("admin connection (bypass RLS) sees all four settings rows", async () => {
    const all = await adminClient.marketplaceSettings.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id, parentOrg.id, childOrg.id] } },
    });
    expect(all).toHaveLength(4);
  });
});
