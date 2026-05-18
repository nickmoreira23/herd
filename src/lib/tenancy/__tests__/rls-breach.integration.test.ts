import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Sub-etapa 4, Tarefa F — RLS breach prevention test.
 *
 * End-to-end proof that Postgres RLS rejects cross-tenant access at the
 * database layer, behind the Prisma Extension's ORM-level filter. This is
 * the canonical "did the canary work?" test for the Camada 1 RLS rollout.
 *
 * Strategy (two-connection pattern):
 *  - adminClient (postgres, bypass RLS) — seed orgA/orgB + ISL row for orgA.
 *  - runtimeClient (herd_app, NOBYPASSRLS) — raw `$transaction` that sets
 *    `app.tenant_id` to either orgB (breach attempt) or orgA (legit access),
 *    then executes a raw SELECT. RLS policy `isl_tenant_isolation` evaluates
 *    `tenant_id = current_app_tenant_id()::uuid`. Cross-tenant filters out.
 *
 * The breach test deliberately uses `$queryRaw` to bypass the Prisma Extension
 * — proving the DB layer enforces isolation even when the ORM filter is
 * absent (defense-in-depth).
 */

const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin connection)");
if (!runtimeUrl)
  throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });

const TEST_PREFIX = `test-breach-${Date.now()}`;

type Seeded = {
  profileTypeId: string;
  profileA: { id: string };
  profileB: { id: string };
  orgA: { id: string };
  orgB: { id: string };
  integration: { id: string };
  islA: { id: string };
  iweA: { id: string };
};

let seeded: Seeded;

async function seed(): Promise<Seeded> {
  const existing = await adminClient.networkProfileType.findFirst({
    select: { id: true },
  });
  const profileTypeId =
    existing?.id ??
    (
      await adminClient.networkProfileType.create({
        data: {
          slug: `${TEST_PREFIX}-type`,
          displayName: "Test Type",
          networkType: "INTERNAL",
        },
        select: { id: true },
      })
    ).id;

  const profileA = await adminClient.networkProfile.create({
    data: {
      firstName: "BreachA",
      lastName: "Owner",
      email: `${TEST_PREFIX}-a@example.com`,
      networkType: "INTERNAL",
      profileTypeId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const profileB = await adminClient.networkProfile.create({
    data: {
      firstName: "BreachB",
      lastName: "Owner",
      email: `${TEST_PREFIX}-b@example.com`,
      networkType: "INTERNAL",
      profileTypeId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const orgA = await adminClient.organization.create({
    data: { ownerId: profileA.id, slug: `${TEST_PREFIX}-a`, name: "Breach A" },
    select: { id: true },
  });

  const orgB = await adminClient.organization.create({
    data: { ownerId: profileB.id, slug: `${TEST_PREFIX}-b`, name: "Breach B" },
    select: { id: true },
  });

  const integration = await adminClient.integration.create({
    data: {
      name: `${TEST_PREFIX}-int`,
      slug: `${TEST_PREFIX}-int`,
      category: "OTHER",
    },
    select: { id: true },
  });

  const islA = await adminClient.integrationSyncLog.create({
    data: {
      tenantId: orgA.id,
      integrationId: integration.id,
      action: "breach-target",
      status: "success",
    },
    select: { id: true },
  });

  // IWE row owned by tenant A — mirrors ISL coverage for the IWE strict
  // policy added in Sub-etapa 6 (`iwe_tenant_isolation`).
  const iweA = await adminClient.integrationWebhookEvent.create({
    data: {
      tenantId: orgA.id,
      integrationId: integration.id,
      eventType: `${TEST_PREFIX}-evt`,
      payload: "{}",
    },
    select: { id: true },
  });

  return {
    profileTypeId,
    profileA,
    profileB,
    orgA,
    orgB,
    integration,
    islA,
    iweA,
  };
}

async function cleanup() {
  await adminClient.integrationWebhookEvent.deleteMany({
    where: { integrationId: seeded.integration.id },
  });
  await adminClient.integrationSyncLog.deleteMany({
    where: { integrationId: seeded.integration.id },
  });
  await adminClient.integration.delete({ where: { id: seeded.integration.id } });
  await adminClient.organization.deleteMany({
    where: { id: { in: [seeded.orgA.id, seeded.orgB.id] } },
  });
  await adminClient.networkProfile.deleteMany({
    where: { id: { in: [seeded.profileA.id, seeded.profileB.id] } },
  });
  await adminClient.networkProfileType.deleteMany({
    where: { id: seeded.profileTypeId, slug: { startsWith: TEST_PREFIX } },
  });
}

describe("RLS breach prevention (integration)", () => {
  beforeAll(async () => {
    seeded = await seed();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClient.$disconnect();
  });

  it("rejects cross-tenant raw SQL on IntegrationSyncLog", async () => {
    // Pretend to be tenant B. Try to read tenant A's row via raw SQL.
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgB.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "IntegrationSyncLog" WHERE id = ${seeded.islA.id}::uuid
      `;
    });

    expect(rows).toHaveLength(0);
  });

  it("allows same-tenant access on IntegrationSyncLog", async () => {
    // Same row, this time as tenant A. RLS allows.
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgA.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "IntegrationSyncLog" WHERE id = ${seeded.islA.id}::uuid
      `;
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(seeded.islA.id);
  });

  it("rejects raw SQL without any GUC set (defense-in-depth)", async () => {
    // No SET LOCAL — GUC is empty → current_app_tenant_id() returns NULL →
    // policy `tenant_id = NULL::uuid` is always false → 0 rows.
    const rows = await runtimeClient.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM "IntegrationSyncLog" WHERE id = ${seeded.islA.id}::uuid
    `;
    expect(rows).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────────────────
  // IntegrationWebhookEvent — strict policy added in Sub-etapa 6
  // (replacing the permissive `iwe_temp_permissive` from Sub-etapa 4).
  // Same shape of assertions as ISL above; if these three pass, the
  // tightening did not regress any other surface.
  // ──────────────────────────────────────────────────────────────────────

  it("rejects cross-tenant raw SQL on IntegrationWebhookEvent", async () => {
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgB.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "IntegrationWebhookEvent" WHERE id = ${seeded.iweA.id}::uuid
      `;
    });

    expect(rows).toHaveLength(0);
  });

  it("allows same-tenant access on IntegrationWebhookEvent", async () => {
    const rows = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${seeded.orgA.id}, true)`;
      return await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM "IntegrationWebhookEvent" WHERE id = ${seeded.iweA.id}::uuid
      `;
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(seeded.iweA.id);
  });

  it("rejects raw SQL on IntegrationWebhookEvent without any GUC set", async () => {
    const rows = await runtimeClient.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM "IntegrationWebhookEvent" WHERE id = ${seeded.iweA.id}::uuid
    `;
    expect(rows).toHaveLength(0);
  });
});
