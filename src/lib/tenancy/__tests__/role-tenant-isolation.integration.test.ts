import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";

/**
 * R&P Fase 3 — proves the new `Role` table is tenant-isolated through the
 * Prisma Extension (Role ∈ TENANT_SCOPED_MODELS): reading via the singleton
 * under withTenant(orgA) returns ONLY orgA's roles. Also confirms RolePermission
 * is NOT tenant-scoped — its global rows (tenant_id NULL) stay readable without a
 * tenant context (the loader filters manually).
 *
 * Two-connection pattern (mirror dept-loc-leak): adminClient (bypass) seeds; the
 * singleton + withTenant is the runtime path under assertion.
 */
const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin connection)");
const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const P = `test-role-iso-${Date.now()}`;
let orgA: { id: string };
let orgB: { id: string };

beforeAll(async () => {
  orgA = await adminClient.organization.create({
    data: { slug: `${P}-a`, subdomain: `${P}-a`, name: "Role Iso A" },
    select: { id: true },
  });
  orgB = await adminClient.organization.create({
    data: { slug: `${P}-b`, subdomain: `${P}-b`, name: "Role Iso B" },
    select: { id: true },
  });
  await adminClient.role.create({
    data: { tenantId: orgA.id, name: `${P}-roleA`, key: `${P}-rolea` },
  });
  await adminClient.role.create({
    data: { tenantId: orgB.id, name: `${P}-roleB`, key: `${P}-roleb` },
  });
});

afterAll(async () => {
  await adminClient.role.deleteMany({ where: { name: { startsWith: P } } });
  await adminClient.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await adminClient.$disconnect();
});

describe("Role tenant isolation (integration)", () => {
  it("withTenant(orgA) sees orgA's role, NOT orgB's", async () => {
    const rows = await withTenant(orgA.id, () =>
      prisma.role.findMany({ where: { name: { startsWith: P } } })
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain(`${P}-roleA`);
    expect(names).not.toContain(`${P}-roleB`);
  });

  it("withTenant(orgB) sees orgB's role, NOT orgA's", async () => {
    const rows = await withTenant(orgB.id, () =>
      prisma.role.findMany({ where: { name: { startsWith: P } } })
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain(`${P}-roleB`);
    expect(names).not.toContain(`${P}-roleA`);
  });

  it("RolePermission global rows stay readable without a tenant context", async () => {
    // System rows have tenant_id NULL and RolePermission is NOT in
    // TENANT_SCOPED_MODELS, so no GUC/filter is applied — they read freely.
    // 100 after Fase 4a: + invitations.read (OWNER, ADMIN) + org.restore (OWNER).
    const globals = await prisma.rolePermission.count({ where: { tenantId: null } });
    expect(globals).toBe(100);
  });
});
