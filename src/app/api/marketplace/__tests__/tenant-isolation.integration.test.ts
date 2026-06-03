import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * SE3 — Marketplace per-tenant isolation (two-connection pattern).
 *
 * Proves the RLS + tenancy-Extension boundary on marketplace_sections:
 *  - a read under withTenant(orgA) sees only org A's sections,
 *  - the same read under withTenant(orgB) sees only org B's,
 *  - a runtime read WITHOUT withTenant sees nothing (RLS deny-by-default),
 *  - the per-tenant composite unique lets two orgs reuse the same slug.
 *
 * Mirrors src/lib/tenancy/__tests__/isolation.integration.test.ts. Excluded
 * from `npm test` (*.integration.test.ts) — runs against a real RLS-enabled DB.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin/bypass connection)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const scopedPrisma = runtimeClient.$extends(
  createTenantScopingExtension(["MarketplaceSection", "MarketplaceSectionScope"])
);

const PREFIX = `test-mkt-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${PREFIX}-a`, subdomain: `${PREFIX}-a`, name: "Mkt Tenant A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${PREFIX}-b`, subdomain: `${PREFIX}-b`, name: "Mkt Tenant B" },
    select: { id: true },
  });
  // Same slug "deals" in BOTH orgs — only possible because slug is unique
  // per-tenant (@@unique([tenantId, slug])), not globally.
  await adminClient.marketplaceSection.createMany({
    data: [
      { tenantId: orgA.id, slug: "deals", name: "A Deals", status: "PUBLISHED" },
      { tenantId: orgA.id, slug: "gear", name: "A Gear", status: "PUBLISHED" },
      { tenantId: orgB.id, slug: "deals", name: "B Deals", status: "PUBLISHED" },
    ],
  });
});

afterAll(async () => {
  await adminClient.marketplaceSection.deleteMany({
    where: { tenantId: { in: [orgA.id, orgB.id] } },
  });
  await adminClient.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  await adminClient.$disconnect();
  await runtimeClient.$disconnect();
});

describe("Marketplace per-tenant isolation (integration)", () => {
  it("withTenant(orgA) sees only org A's sections", async () => {
    const rows = await withTenant(orgA.id, () => scopedPrisma.marketplaceSection.findMany());
    expect(rows).toHaveLength(2);
    expect(rows.every((s) => s.tenantId === orgA.id)).toBe(true);
  });

  it("withTenant(orgB) sees only org B's sections (no leak from A)", async () => {
    const rows = await withTenant(orgB.id, () => scopedPrisma.marketplaceSection.findMany());
    expect(rows).toHaveLength(1);
    expect(rows[0].tenantId).toBe(orgB.id);
    expect(rows[0].name).toBe("B Deals");
  });

  it("the same slug resolves to a different section per tenant", async () => {
    const a = await withTenant(orgA.id, () =>
      scopedPrisma.marketplaceSection.findFirst({ where: { slug: "deals" } })
    );
    const b = await withTenant(orgB.id, () =>
      scopedPrisma.marketplaceSection.findFirst({ where: { slug: "deals" } })
    );
    expect(a?.name).toBe("A Deals");
    expect(b?.name).toBe("B Deals");
    expect(a?.id).not.toBe(b?.id);
  });

  it("runtime read WITHOUT withTenant sees nothing (RLS deny-by-default)", async () => {
    const rows = await scopedPrisma.marketplaceSection.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(rows).toHaveLength(0);
  });

  it("admin connection (bypass RLS) sees all three rows", async () => {
    const all = await adminClient.marketplaceSection.findMany({
      where: { tenantId: { in: [orgA.id, orgB.id] } },
    });
    expect(all).toHaveLength(3);
  });
});
