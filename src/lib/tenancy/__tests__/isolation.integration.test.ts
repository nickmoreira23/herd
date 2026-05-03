import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "../context";
import { createTenantScopingExtension } from "../prisma-extension";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");

const baseClient = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// Test-only Prisma client scoped over all 4 tenant-scoped models. Mirrors
// production TENANT_SCOPED_MODELS but stays isolated to this suite so changes
// to the prod list don't bleed into existing seed/cleanup expectations.
const scopedPrisma = baseClient.$extends(
  createTenantScopingExtension([
    "MemberConnection",
    "IntegrationTierMapping",
    "IntegrationWebhookEvent",
    "IntegrationSyncLog",
  ]),
);

const TEST_PREFIX = `test-tenancy-${Date.now()}`;

type Seeded = {
  profileTypeId: string;
  profileA: { id: string };
  profileB: { id: string };
  orgA: { id: string };
  orgB: { id: string };
  integration: { id: string };
};

let seeded: Seeded;

async function ensureProfileType(): Promise<string> {
  const existing = await baseClient.networkProfileType.findFirst({
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await baseClient.networkProfileType.create({
    data: {
      slug: `${TEST_PREFIX}-type`,
      displayName: "Test Type",
      networkType: "INTERNAL",
    },
    select: { id: true },
  });
  return created.id;
}

async function seedTwoTenants(): Promise<Seeded> {
  const profileTypeId = await ensureProfileType();

  const profileA = await baseClient.networkProfile.create({
    data: {
      firstName: "TenantA",
      lastName: "Owner",
      email: `${TEST_PREFIX}-a@example.com`,
      networkType: "INTERNAL",
      profileTypeId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const profileB = await baseClient.networkProfile.create({
    data: {
      firstName: "TenantB",
      lastName: "Owner",
      email: `${TEST_PREFIX}-b@example.com`,
      networkType: "INTERNAL",
      profileTypeId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const orgA = await baseClient.organization.create({
    data: { ownerId: profileA.id, slug: `${TEST_PREFIX}-a`, name: "Tenant A" },
    select: { id: true },
  });

  const orgB = await baseClient.organization.create({
    data: { ownerId: profileB.id, slug: `${TEST_PREFIX}-b`, name: "Tenant B" },
    select: { id: true },
  });

  const integration = await baseClient.integration.create({
    data: {
      name: `${TEST_PREFIX}-int`,
      slug: `${TEST_PREFIX}-int`,
      category: "OTHER",
    },
    select: { id: true },
  });

  // 3 logs for tenant A, 2 for tenant B — written via baseClient (no scoping)
  // so we can set tenantId explicitly.
  for (let i = 0; i < 3; i++) {
    await baseClient.integrationSyncLog.create({
      data: {
        tenantId: orgA.id,
        integrationId: integration.id,
        action: "seed",
        status: "success",
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    await baseClient.integrationSyncLog.create({
      data: {
        tenantId: orgB.id,
        integrationId: integration.id,
        action: "seed",
        status: "success",
      },
    });
  }

  return { profileTypeId, profileA, profileB, orgA, orgB, integration };
}

async function cleanup() {
  await baseClient.integrationSyncLog.deleteMany({
    where: { integrationId: seeded.integration.id },
  });
  await baseClient.integration.delete({ where: { id: seeded.integration.id } });
  await baseClient.organization.deleteMany({
    where: { id: { in: [seeded.orgA.id, seeded.orgB.id] } },
  });
  await baseClient.networkProfile.deleteMany({
    where: { id: { in: [seeded.profileA.id, seeded.profileB.id] } },
  });
  if (seeded.profileTypeId) {
    // Delete only if we created it (slug starts with TEST_PREFIX)
    await baseClient.networkProfileType.deleteMany({
      where: { id: seeded.profileTypeId, slug: { startsWith: TEST_PREFIX } },
    });
  }
}

describe("Tenant scoping isolation (integration)", () => {
  beforeAll(async () => {
    seeded = await seedTwoTenants();
  });

  afterAll(async () => {
    await cleanup();
    await baseClient.$disconnect();
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

  it("read without context returns all rows (no-op extension)", async () => {
    const logs = await scopedPrisma.integrationSyncLog.findMany({
      where: { integrationId: seeded.integration.id },
    });
    expect(logs).toHaveLength(5);
  });

  it("create injects tenantId from context", async () => {
    const created = await withTenant(seeded.orgA.id, () =>
      scopedPrisma.integrationSyncLog.create({
        data: {
          integrationId: seeded.integration.id,
          action: "via-context",
          status: "success",
        },
      }),
    );
    expect(created.tenantId).toBe(seeded.orgA.id);
    // Cleanup the row we just created so the count tests above remain stable
    // if re-run order shifts.
    await baseClient.integrationSyncLog.delete({ where: { id: created.id } });
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

    // Verify the row was not mutated.
    const after = await baseClient.integrationSyncLog.findUnique({
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

  // Smoke coverage for the other 3 tenant-scoped tables. The extension behavior
  // is identical to IntegrationSyncLog (already exhaustively tested above) —
  // these confirm the model name matching works for each table name.

  it("scopes IntegrationWebhookEvent reads to current tenant", async () => {
    const eventA = await baseClient.integrationWebhookEvent.create({
      data: {
        tenantId: seeded.orgA.id,
        integrationId: seeded.integration.id,
        eventType: `${TEST_PREFIX}-evt`,
        payload: "{}",
      },
    });
    const eventB = await baseClient.integrationWebhookEvent.create({
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

    await baseClient.integrationWebhookEvent.deleteMany({
      where: { id: { in: [eventA.id, eventB.id] } },
    });
  });

  it("scopes IntegrationTierMapping reads to current tenant", async () => {
    // Reuse an existing SubscriptionTier (creating one requires ~10 Decimal
    // fields irrelevant to this assertion).
    const tier = await baseClient.subscriptionTier.findFirst({ select: { id: true } });
    if (!tier) {
      throw new Error("Test requires at least one SubscriptionTier seeded");
    }
    const mappingA = await baseClient.integrationTierMapping.create({
      data: {
        tenantId: seeded.orgA.id,
        integrationId: seeded.integration.id,
        externalPlanId: `${TEST_PREFIX}-plan-a`,
        subscriptionTierId: tier.id,
      },
    });
    const mappingB = await baseClient.integrationTierMapping.create({
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

    await baseClient.integrationTierMapping.deleteMany({
      where: { id: { in: [mappingA.id, mappingB.id] } },
    });
  });

  it("scopes MemberConnection reads to current tenant", async () => {
    const connA = await baseClient.memberConnection.create({
      data: {
        tenantId: seeded.orgA.id,
        profileId: seeded.profileA.id,
        integrationId: seeded.integration.id,
        externalUserId: `${TEST_PREFIX}-ext-a`,
      },
    });
    const connB = await baseClient.memberConnection.create({
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

    await baseClient.memberConnection.deleteMany({
      where: { id: { in: [connA.id, connB.id] } },
    });
  });
});
