import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "../context";
import { createTenantScopingExtension } from "../prisma-extension";

/**
 * Sub-etapa 4 — Two-connection test pattern.
 *
 * After the herd_app rollout (Tarefa A–D of the adendo), the runtime DB role
 * (`herd_app`) is `NOBYPASSRLS`. RLS policies on tenant-scoped tables are now
 * enforced for every query made via `DIRECT_URL`.
 *
 * Integration tests therefore need two connections:
 *
 *  - `adminClient` — uses `DATABASE_URL` (postgres role, `rolbypassrls=true`).
 *    Represents what a migration / setup script would do: privileged seed and
 *    teardown that crosses tenant boundaries. NOT what the app does in prod.
 *
 *  - `runtimeClient` (+ `scopedPrisma`) — uses `DIRECT_URL` (herd_app).
 *    Mirrors the production singleton: RLS-enforced, Extension applied. This
 *    is what the actual test assertions exercise.
 *
 * Tests that depend on an RLS policy not yet applied are marked with `it.skip`
 * and an explicit TODO pointing to the canary migration that re-enables them.
 */

// Sub-etapa 4 (3-URL split):
//  - adminClient uses DATABASE_URL (postgres pooler, bypass RLS) for seed/teardown.
//  - runtimeClient uses RUNTIME_DATABASE_URL (herd_app, NOBYPASSRLS) to exercise
//    the production singleton's RLS-enforced path. Fallback to DIRECT_URL keeps
//    older local envs working — but those envs see RLS bypassed if DIRECT_URL is
//    pointed at postgres, masking failures. Prefer RUNTIME_DATABASE_URL.
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl)
  throw new Error("DATABASE_URL required (admin/bypass connection for seed)");
if (!runtimeUrl)
  throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required (runtime/herd_app connection)");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });

// Mirror production TENANT_SCOPED_MODELS but stay isolated to this suite so
// changes to the prod list don't bleed into existing seed/cleanup expectations.
const scopedPrisma = runtimeClient.$extends(
  createTenantScopingExtension([
    "MemberConnection",
    "IntegrationTierMapping",
    "IntegrationWebhookEvent",
    "IntegrationSyncLog",
  ]),
);

const TEST_PREFIX = `test-tenancy-${Date.now()}`;

type Seeded = {
  profileA: { id: string };
  profileB: { id: string };
  orgA: { id: string };
  orgB: { id: string };
  integration: { id: string };
};

let seeded: Seeded;

async function seedTwoTenants(): Promise<Seeded> {
  // NetworkProfileType removed in Sub-etapa 3.6.

  const profileA = await adminClient.networkProfile.create({
    data: {
      firstName: "TenantA",
      lastName: "Owner",
      email: `${TEST_PREFIX}-a@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const profileB = await adminClient.networkProfile.create({
    data: {
      firstName: "TenantB",
      lastName: "Owner",
      email: `${TEST_PREFIX}-b@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const orgA = await adminClient.organization.create({
    data: { ownerId: profileA.id, slug: `${TEST_PREFIX}-a`, subdomain: `${TEST_PREFIX}-a`, name: "Tenant A" },
    select: { id: true },
  });

  const orgB = await adminClient.organization.create({
    data: { ownerId: profileB.id, slug: `${TEST_PREFIX}-b`, subdomain: `${TEST_PREFIX}-b`, name: "Tenant B" },
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

  // 3 logs for tenant A, 2 for tenant B — written via adminClient (postgres,
  // bypass RLS) so we can set tenantId explicitly across two tenants in seed.
  for (let i = 0; i < 3; i++) {
    await adminClient.integrationSyncLog.create({
      data: {
        tenantId: orgA.id,
        integrationId: integration.id,
        action: "seed",
        status: "success",
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    await adminClient.integrationSyncLog.create({
      data: {
        tenantId: orgB.id,
        integrationId: integration.id,
        action: "seed",
        status: "success",
      },
    });
  }

  return { profileA, profileB, orgA, orgB, integration };
}

async function cleanup() {
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

describe("Tenant scoping isolation (integration)", () => {
  beforeAll(async () => {
    seeded = await seedTwoTenants();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClient.$disconnect();
  });

  it("read sees only own tenant's rows when in withTenant context", async () => {
    const logs = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.integrationSyncLog.findMany({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(logs).toHaveLength(3);
    expect(logs.every((l) => l.tenantId === seeded.orgA.id)).toBe(true);
  });

  it("read in different tenant context returns different set", async () => {
    const logs = await withTenant(seeded.orgB.id, () =>
      scopedPrisma.integrationSyncLog.findMany({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.tenantId === seeded.orgB.id)).toBe(true);
  });

  it("runtime without withTenant cannot see RLS-protected rows", async () => {
    // Defense-in-depth post-herd_app: scopedPrisma without withTenant is an
    // Extension no-op (no tenantId injected, no GUC set). With RLS enabled on
    // IntegrationSyncLog (rls_setup) and a strict policy in place
    // (rls_isl_canary), `current_app_tenant_id()` returns NULL → no rows match.
    // Before the canary policy, RLS without policy is deny-all → also 0 rows.
    // Either way, runtime cannot bypass tenant isolation at the DB level.
    const logs = await scopedPrisma.integrationSyncLog.findMany({
      where: { integrationId: seeded.integration.id },
    });
    expect(logs).toHaveLength(0);
  });

  it("admin connection (postgres, bypass RLS) sees all rows", async () => {
    // Sanity check: the seed wrote 5 rows via adminClient. Verify they're
    // there regardless of RLS — confirms the two-connection split works as
    // intended (admin role bypasses, runtime role enforces).
    const all = await adminClient.integrationSyncLog.findMany({
      where: { integrationId: seeded.integration.id },
    });
    expect(all).toHaveLength(5);
  });

  it("create injects tenantId from context", async () => {
    const created = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.integrationSyncLog.create(
        {
          data: {
            integrationId: seeded.integration.id,
            action: "via-context",
            status: "success",
          },
        } as unknown as Parameters<typeof scopedPrisma.integrationSyncLog.create>[0],
      ),
    );
    expect(created.tenantId).toBe(seeded.orgA.id);
    // Cleanup via adminClient (RLS-bypass) so we always reach the row.
    await adminClient.integrationSyncLog.delete({ where: { id: created.id } });
  });

  it("update by id is scoped — cannot update another tenant's row", async () => {
    const orgBLog = await withTenant(seeded.orgB.id, () =>
      scopedPrisma.integrationSyncLog.findFirst({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(orgBLog).not.toBeNull();

    await expect(
      withTenant(seeded.orgA.id, () =>
        scopedPrisma.integrationSyncLog.update({
          where: { id: orgBLog!.id },
          data: { details: "hijack-attempt" },
        }),
      ),
    ).rejects.toThrow();

    // Verify the row was not mutated. Use adminClient to bypass RLS for the read.
    const after = await adminClient.integrationSyncLog.findUnique({
      where: { id: orgBLog!.id },
    });
    expect(after?.details).toBeNull();
  });

  it("nested withTenant: inner context wins for queries", async () => {
    const logs = await withTenant(seeded.orgA.id, () =>
      withTenant(seeded.orgB.id, () =>
        scopedPrisma.integrationSyncLog.findMany({
          where: { integrationId: seeded.integration.id },
        }),
      ),
    );
    expect(logs.every((l) => l.tenantId === seeded.orgB.id)).toBe(true);
  });

  // Smoke coverage for the other 3 tenant-scoped tables.

  it("scopes IntegrationWebhookEvent reads to current tenant", async () => {
    // IWE has a permissive policy from rls_setup (USING true) because its
    // tenant_id is still nullable. RLS allows the rows; Extension filter scopes
    // them to the active tenantId.
    const eventA = await adminClient.integrationWebhookEvent.create({
      data: {
        tenantId: seeded.orgA.id,
        integrationId: seeded.integration.id,
        eventType: `${TEST_PREFIX}-evt`,
        payload: "{}",
      },
    });
    const eventB = await adminClient.integrationWebhookEvent.create({
      data: {
        tenantId: seeded.orgB.id,
        integrationId: seeded.integration.id,
        eventType: `${TEST_PREFIX}-evt`,
        payload: "{}",
      },
    });

    const seenByA = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.integrationWebhookEvent.findMany({
        where: { eventType: `${TEST_PREFIX}-evt` },
      }),
    );
    expect(seenByA.map((e) => e.id)).toEqual([eventA.id]);

    await adminClient.integrationWebhookEvent.deleteMany({
      where: { id: { in: [eventA.id, eventB.id] } },
    });
  });

  it("scopes IntegrationTierMapping reads to current tenant", async () => {
    const tier = await adminClient.subscriptionTier.findFirst({ select: { id: true } });
    if (!tier) {
      throw new Error("Test requires at least one SubscriptionTier seeded");
    }
    const mappingA = await adminClient.integrationTierMapping.create({
      data: {
        tenantId: seeded.orgA.id,
        integrationId: seeded.integration.id,
        externalPlanId: `${TEST_PREFIX}-plan-a`,
        subscriptionTierId: tier.id,
      },
    });
    const mappingB = await adminClient.integrationTierMapping.create({
      data: {
        tenantId: seeded.orgB.id,
        integrationId: seeded.integration.id,
        externalPlanId: `${TEST_PREFIX}-plan-b`,
        subscriptionTierId: tier.id,
      },
    });

    const seenByA = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.integrationTierMapping.findMany({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(seenByA.map((m) => m.id)).toEqual([mappingA.id]);

    await adminClient.integrationTierMapping.deleteMany({
      where: { id: { in: [mappingA.id, mappingB.id] } },
    });
  });

  it("scopes MemberConnection reads to current tenant", async () => {
    const connA = await adminClient.memberConnection.create({
      data: {
        tenantId: seeded.orgA.id,
        profileId: seeded.profileA.id,
        integrationId: seeded.integration.id,
        externalUserId: `${TEST_PREFIX}-ext-a`,
      },
    });
    const connB = await adminClient.memberConnection.create({
      data: {
        tenantId: seeded.orgB.id,
        profileId: seeded.profileB.id,
        integrationId: seeded.integration.id,
        externalUserId: `${TEST_PREFIX}-ext-b`,
      },
    });

    const seenByA = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.memberConnection.findMany({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(seenByA.map((c) => c.id)).toEqual([connA.id]);

    await adminClient.memberConnection.deleteMany({
      where: { id: { in: [connA.id, connB.id] } },
    });
  });
});
