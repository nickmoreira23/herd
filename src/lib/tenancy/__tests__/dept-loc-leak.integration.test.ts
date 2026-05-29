import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Regression test for the dept/loc cross-tenant leak (fix/dept-loc-tenant-leak).
 *
 * Proves that reading Department/Location through the project `prisma` singleton
 * (which carries the tenant-scoping Extension) under `withTenant(orgA)` returns
 * ONLY orgA's rows — even though the `herd_app_full_access` RLS policy still
 * lets herd_app see everything at the DB layer (removed in Sub-26.2). The ORM
 * filter (defense-in-depth layer 1) closes the leak on its own.
 *
 * Two-connection pattern (mirror rls-breach): adminClient (bypass) seeds both
 * orgs; the singleton + withTenant is the runtime path under assertion.
 */
const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin connection)");
const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const P = `test-leak-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${P}-a`, subdomain: `${P}-a`, name: "Leak A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${P}-b`, subdomain: `${P}-b`, name: "Leak B" },
    select: { id: true },
  });
  await adminClient.department.create({
    data: { tenantId: orgA.id, name: `${P}-deptA`, slug: `${P}-depta`, networkType: "INTERNAL" },
  });
  await adminClient.department.create({
    data: { tenantId: orgB.id, name: `${P}-deptB`, slug: `${P}-deptb`, networkType: "INTERNAL" },
  });
  await adminClient.location.create({
    data: { tenantId: orgA.id, name: `${P}-locA`, type: "office" },
  });
  await adminClient.location.create({
    data: { tenantId: orgB.id, name: `${P}-locB`, type: "office" },
  });
});

afterAll(async () => {
  await adminClient.department.deleteMany({ where: { name: { startsWith: P } } });
  await adminClient.location.deleteMany({ where: { name: { startsWith: P } } });
  await adminClient.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await adminClient.$disconnect();
});

describe("dept/loc cross-tenant leak (integration)", () => {
  it("withTenant(orgA) sees orgA departments, NOT orgB's", async () => {
    const rows = await withTenant(orgA.id, () =>
      prisma.department.findMany({ where: { name: { startsWith: P } } })
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain(`${P}-deptA`);
    expect(names).not.toContain(`${P}-deptB`);
  });

  it("withTenant(orgB) sees orgB departments, NOT orgA's", async () => {
    const rows = await withTenant(orgB.id, () =>
      prisma.department.findMany({ where: { name: { startsWith: P } } })
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain(`${P}-deptB`);
    expect(names).not.toContain(`${P}-deptA`);
  });

  it("withTenant(orgA) sees orgA locations, NOT orgB's", async () => {
    const rows = await withTenant(orgA.id, () =>
      prisma.location.findMany({ where: { name: { startsWith: P } } })
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain(`${P}-locA`);
    expect(names).not.toContain(`${P}-locB`);
  });
});
