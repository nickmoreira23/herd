import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";

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
  // NetworkProfileType removed in Sub-etapa 3.6.

  const profileA = await adminClient.networkProfile.create({
    data: {
      firstName: "BreachA",
      lastName: "Owner",
      email: `${TEST_PREFIX}-a@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const profileB = await adminClient.networkProfile.create({
    data: {
      firstName: "BreachB",
      lastName: "Owner",
      email: `${TEST_PREFIX}-b@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const orgA = await adminClient.organization.create({
    data: { slug: `${TEST_PREFIX}-a`, subdomain: `${TEST_PREFIX}-a`, name: "Breach A" },
    select: { id: true },
  });

  const orgB = await adminClient.organization.create({
    data: { slug: `${TEST_PREFIX}-b`, subdomain: `${TEST_PREFIX}-b`, name: "Breach B" },
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
  // NetworkProfileType removed in Sub-etapa 3.6
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

// ──────────────────────────────────────────────────────────────────────────
// Sub-26.2 — Vertical read canaries (THE GATE).
//
// Tree:  GP ─┬─ P ── child
//            └─ uncle
//        sibling (separate root, no ancestry)
//
// Each org owns one IntegrationSyncLog row (Class A strict policy). Canaries
// set `app.tenant_ids` (the array GUC) and read raw, asserting the policy's
// vertical visibility. Until the T3 policy migration flips USING to
// `= ANY(current_app_tenant_ids())`, the policy still reads the singular
// `app.tenant_id` (left unset here) → vertical-read cases (#2, #4) return 0
// and are EXPECTED RED. The safety net (#1 horizontal, #3 anti-ascendant,
// #5 transitive-deny, #6 no-GUC, #7 write-check) must be GREEN throughout.
// ──────────────────────────────────────────────────────────────────────────

const VP = `test-vert-${Date.now()}`;
type Tree = {
  gp: string; p: string; child: string; uncle: string; sibling: string;
  integrationId: string;
  islGp: string; islP: string; islChild: string; islUncle: string; islSibling: string;
};
let tree: Tree;

async function seedTree(): Promise<Tree> {
  const mkOrg = async (slug: string, parentOrgId: string | null) =>
    (await adminClient.organization.create({
      data: { slug: `${VP}-${slug}`, subdomain: `${VP}-${slug}`, name: `${VP} ${slug}`, parentOrgId },
      select: { id: true },
    })).id;

  const gp = await mkOrg("gp", null);
  const p = await mkOrg("p", gp);
  const child = await mkOrg("child", p);
  const uncle = await mkOrg("uncle", gp);
  const sibling = await mkOrg("sibling", null);

  const integration = await adminClient.integration.create({
    data: { name: `${VP}-int`, slug: `${VP}-int`, category: "OTHER" },
    select: { id: true },
  });

  const mkIsl = async (tenantId: string) =>
    (await adminClient.integrationSyncLog.create({
      data: { tenantId, integrationId: integration.id, action: "vert-target", status: "success" },
      select: { id: true },
    })).id;

  return {
    gp, p, child, uncle, sibling,
    integrationId: integration.id,
    islGp: await mkIsl(gp), islP: await mkIsl(p), islChild: await mkIsl(child),
    islUncle: await mkIsl(uncle), islSibling: await mkIsl(sibling),
  };
}

/** Read `islId` under the given `app.tenant_ids` array; returns row count. */
async function readUnderTenantIds(tenantIds: string[], islId: string): Promise<number> {
  const rows = await runtimeClient.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_ids', ${tenantIds.join(",")}, true)`;
    return tx.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM "IntegrationSyncLog" WHERE id = ${islId}::uuid
    `;
  });
  return rows.length;
}

describe("RLS vertical read canaries (Sub-26.2 gate)", () => {
  beforeAll(async () => {
    tree = await seedTree();
  });

  afterAll(async () => {
    await adminClient.integrationSyncLog.deleteMany({ where: { integrationId: tree.integrationId } });
    await adminClient.integration.delete({ where: { id: tree.integrationId } });
    await adminClient.organization.deleteMany({ where: { slug: { startsWith: VP } } });
  });

  it("#1 horizontal: sibling does NOT see GP's data (deny)", async () => {
    expect(await readUnderTenantIds([tree.sibling], tree.islGp)).toBe(0);
  });

  it("#2 vertical read: parent sees child's data (allow) — RED until T3", async () => {
    expect(await readUnderTenantIds([tree.p, tree.child], tree.islChild)).toBe(1);
  });

  it("#3 anti-ascendant: child does NOT see parent's data (deny)", async () => {
    expect(await readUnderTenantIds([tree.child], tree.islP)).toBe(0);
  });

  it("#4 transitive allow: grandparent sees grandchild's data (allow) — RED until T3", async () => {
    expect(await readUnderTenantIds([tree.gp, tree.p, tree.child, tree.uncle], tree.islChild)).toBe(1);
  });

  it("#5 transitive deny: uncle does NOT see nephew's data (deny)", async () => {
    expect(await readUnderTenantIds([tree.uncle], tree.islChild)).toBe(0);
  });

  it("#6 no-GUC deny (defense-in-depth)", async () => {
    const rows = await runtimeClient.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM "IntegrationSyncLog" WHERE id = ${tree.islChild}::uuid
    `;
    expect(rows).toHaveLength(0);
  });

  it("#7 write unchanged: INSERT targeting another tenant is rejected by WITH CHECK", async () => {
    // app.tenant_id = parent (exact write anchor); even with the descendant
    // child visible for READ, writing a row owned by child must be denied.
    await expect(
      runtimeClient.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tree.p}, true)`;
        await tx.$executeRaw`SELECT set_config('app.tenant_ids', ${[tree.p, tree.child].join(",")}, true)`;
        await tx.$executeRaw`
          INSERT INTO "IntegrationSyncLog" ("tenantId", "integrationId", "action", "status")
          VALUES (${tree.child}::uuid, ${tree.integrationId}::uuid, 'vert-write-breach', 'success')
        `;
      })
    ).rejects.toThrow();
  });

  // ── via-Extension (ORM path, project prisma singleton + withTenant) ──
  // These exercise the real Prisma Extension (findUnique → { in: tenantIds }),
  // catching Extension bugs the raw canaries can't. RLS still clamps reads to
  // the exact tenant until T3, so the vertical case is RED until then; the
  // scope-intact cases are GREEN now (proving the {in} filter never loosened
  // to drop the tenant predicate).

  it("via-Extension: own-tenant findUnique returns the row (scope works)", async () => {
    const row = await withTenant(tree.gp, () =>
      prisma.integrationSyncLog.findUnique({ where: { id: tree.islGp } })
    );
    expect(row?.id).toBe(tree.islGp);
  });

  it("via-Extension: scope intact — unrelated tenant's row is null (never loosened)", async () => {
    const row = await withTenant(tree.sibling, () =>
      prisma.integrationSyncLog.findUnique({ where: { id: tree.islGp } })
    );
    expect(row).toBeNull();
  });

  it("via-Extension: vertical findUnique parent→child returns child's row — RED until T3", async () => {
    const row = await withTenant(tree.p, () =>
      prisma.integrationSyncLog.findUnique({ where: { id: tree.islChild } })
    );
    expect(row?.id).toBe(tree.islChild);
  });
});
