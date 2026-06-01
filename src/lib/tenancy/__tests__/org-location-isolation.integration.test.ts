import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * ADR-002 Fatia 1a — RLS canary for the curated-consumption junction
 * `organization_location` (tenant-scoped via the redundant `tenant_id`).
 *
 * Mirrors `rls-breach.integration.test.ts` (two-connection pattern):
 *  - adminClient (postgres, bypass RLS) — seed orgA/orgB + a Location and an
 *    OrganizationLocation link both owned by orgA.
 *  - runtimeClient (herd_app, NOBYPASSRLS) — raw `$transaction` that sets
 *    `app.tenant_id` to orgB (breach) or orgA (legit), then a raw SELECT.
 *    Policy `organization_location_tenant_isolation` clamps to the exact tenant.
 *
 * Proves horizontal isolation: under tenant B, the link of tenant A is invisible.
 */

const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin connection)");
if (!runtimeUrl)
  throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });

const TEST_PREFIX = `test-orgloc-${Date.now()}`;

type Seeded = {
  orgA: { id: string };
  orgB: { id: string };
  locationA: { id: string };
  linkA: { id: string };
};

let seeded: Seeded;

async function seed(): Promise<Seeded> {
  const orgA = await adminClient.organization.create({
    data: { slug: `${TEST_PREFIX}-a`, subdomain: `${TEST_PREFIX}-a`, name: "OrgLoc A" },
    select: { id: true },
  });
  const orgB = await adminClient.organization.create({
    data: { slug: `${TEST_PREFIX}-b`, subdomain: `${TEST_PREFIX}-b`, name: "OrgLoc B" },
    select: { id: true },
  });

  const locationA = await adminClient.location.create({
    data: { tenantId: orgA.id, name: `${TEST_PREFIX}-loc`, type: "office" },
    select: { id: true },
  });

  const linkA = await adminClient.organizationLocation.create({
    data: { organizationId: orgA.id, locationId: locationA.id, tenantId: orgA.id },
    select: { id: true },
  });

  return { orgA, orgB, locationA, linkA };
}

async function cleanup() {
  // Org delete cascades to Location + organization_location via FK; explicit
  // deleteMany first for determinism.
  await adminClient.organizationLocation.deleteMany({ where: { id: seeded.linkA.id } });
  await adminClient.location.deleteMany({ where: { id: seeded.locationA.id } });
  await adminClient.organization.deleteMany({
    where: { id: { in: [seeded.orgA.id, seeded.orgB.id] } },
  });
}

describe("organization_location RLS isolation (integration)", () => {
  beforeAll(async () => {
    seeded = await seed();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClient.$disconnect();
  });

  it("rejects cross-tenant raw SQL on organization_location (org B cannot see org A's link)", async () => {
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgB.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "organization_location" WHERE id = ${seeded.linkA.id}::uuid
      `;
    });
    expect(rows).toHaveLength(0);
  });

  it("allows same-tenant access on organization_location (org A sees its link)", async () => {
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgA.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "organization_location" WHERE id = ${seeded.linkA.id}::uuid
      `;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(seeded.linkA.id);
  });

  it("rejects raw SQL without any GUC set (defense-in-depth)", async () => {
    const rows = await runtimeClient.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM "organization_location" WHERE id = ${seeded.linkA.id}::uuid
    `;
    expect(rows).toHaveLength(0);
  });
});
