import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { createTenantScopingExtension } from "@/lib/tenancy/prisma-extension";

/**
 * Sub-etapa 9 — Payment Provider Layer schema smoke tests.
 *
 * Asserts the load-bearing invariants of the 11-table billing schema
 * without exhaustively covering each table. Sub-etapa 11 (mapper) layers
 * entity-specific tests on top.
 *
 * Properties verified:
 *  - RLS: cross-tenant SELECT on payment_providers via runtime client returns
 *    nothing; same-tenant SELECT returns the seeded row.
 *  - NOT NULL: `tenant_id NOT NULL` blocks raw INSERTs that omit it.
 *  - UNIQUE: `(provider_id, external_id)` blocks duplicates in
 *    `billing_customers` (representative; same constraint exists in 8
 *    other tables).
 *  - Cascade: deleting an Organization cleans up `payment_providers` and
 *    all dependent rows.
 */

const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClientBare = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });
const runtimeClient = runtimeClientBare.$extends(
  createTenantScopingExtension(["PaymentProvider", "BillingCustomer"]),
);

const TEST_PREFIX = `test-billing-smoke-${Date.now()}`;

type Seeded = {
  profileA: { id: string };
  profileB: { id: string };
  orgA: { id: string };
  orgB: { id: string };
  providerA: { id: string };
};

let seeded: Seeded;

async function seed(): Promise<Seeded> {
  // NetworkProfileType removed in Sub-etapa 3.6.

  const profileA = await adminClient.networkProfile.create({
    data: {
      firstName: "BillA",
      lastName: "Owner",
      email: `${TEST_PREFIX}-a@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const profileB = await adminClient.networkProfile.create({
    data: {
      firstName: "BillB",
      lastName: "Owner",
      email: `${TEST_PREFIX}-b@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const orgA = await adminClient.organization.create({
    data: { ownerId: profileA.id, slug: `${TEST_PREFIX}-a`, subdomain: `${TEST_PREFIX}-a`, name: "Billing A" },
    select: { id: true },
  });

  const orgB = await adminClient.organization.create({
    data: { ownerId: profileB.id, slug: `${TEST_PREFIX}-b`, subdomain: `${TEST_PREFIX}-b`, name: "Billing B" },
    select: { id: true },
  });

  const providerA = await adminClient.paymentProvider.create({
    data: {
      tenantId: orgA.id,
      slug: `${TEST_PREFIX}-recharge`,
      name: "Recharge (test)",
      category: "BILLING",
    },
    select: { id: true },
  });

  return { profileA, profileB, orgA, orgB, providerA };
}

async function cleanup() {
  // Cascade from Organization handles billing rows; clean up profiles
  // and orgs that weren't deleted by cascade tests.
  await adminClient.organization.deleteMany({
    where: { id: { in: [seeded.orgA.id, seeded.orgB.id] } },
  });
  await adminClient.networkProfile.deleteMany({
    where: { id: { in: [seeded.profileA.id, seeded.profileB.id] } },
  });
  // NetworkProfileType removed in Sub-etapa 3.6
}

describe("Sub-etapa 9 billing schema — smoke", () => {
  beforeAll(async () => {
    seeded = await seed();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClientBare.$disconnect();
  });

  it("RLS: cross-tenant SELECT on payment_providers returns 0 rows", async () => {
    const rowsFromB = await withTenant(seeded.orgB.id, () =>
      runtimeClient.paymentProvider.findMany({
        where: { id: seeded.providerA.id },
      }),
    );
    expect(rowsFromB).toHaveLength(0);
  });

  it("RLS: same-tenant SELECT on payment_providers returns the row", async () => {
    const rowsFromA = await withTenant(seeded.orgA.id, () =>
      runtimeClient.paymentProvider.findMany({
        where: { id: seeded.providerA.id },
      }),
    );
    expect(rowsFromA).toHaveLength(1);
    expect(rowsFromA[0].name).toBe("Recharge (test)");
  });

  it("NOT NULL: raw INSERT on billing_customers without tenant_id is rejected", async () => {
    await expect(
      adminClient.$executeRaw`
        INSERT INTO "billing_customers" ("provider_id", "external_id")
        VALUES (${seeded.providerA.id}::uuid, ${`${TEST_PREFIX}-nn-test`})
      `,
    ).rejects.toThrow();
  });

  it("UNIQUE: duplicate (provider_id, external_id) on billing_customers is rejected", async () => {
    const externalId = `${TEST_PREFIX}-uniq-test`;

    const first = await adminClient.billingCustomer.create({
      data: {
        tenantId: seeded.orgA.id,
        providerId: seeded.providerA.id,
        externalId,
        email: "a@example.com",
      },
      select: { id: true },
    });

    await expect(
      adminClient.billingCustomer.create({
        data: {
          tenantId: seeded.orgA.id,
          providerId: seeded.providerA.id,
          externalId, // same pair
          email: "b@example.com",
        },
      }),
    ).rejects.toThrow();

    // cleanup
    await adminClient.billingCustomer.delete({ where: { id: first.id } });
  });

  it("Cascade: deleting Organization removes its payment_providers and billing rows", async () => {
    // Spin up a throw-away org so the assertion doesn't tear down the
    // shared seed used by the other tests.
    const tempProfile = await adminClient.networkProfile.create({
      data: {
        firstName: "Cascade",
        lastName: "Test",
        email: `${TEST_PREFIX}-cascade@example.com`,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    const tempOrg = await adminClient.organization.create({
      data: {
        ownerId: tempProfile.id,
        slug: `${TEST_PREFIX}-cascade`,
        subdomain: `${TEST_PREFIX}-cascade`,
        name: "Cascade Test",
      },
      select: { id: true },
    });
    const tempProvider = await adminClient.paymentProvider.create({
      data: {
        tenantId: tempOrg.id,
        slug: `${TEST_PREFIX}-cascade-prov`,
        name: "Provider",
        category: "BILLING",
      },
      select: { id: true },
    });
    const tempCustomer = await adminClient.billingCustomer.create({
      data: {
        tenantId: tempOrg.id,
        providerId: tempProvider.id,
        externalId: `${TEST_PREFIX}-cascade-cust`,
        email: "cascade@example.com",
      },
      select: { id: true },
    });

    // Sanity: rows exist.
    expect(
      await adminClient.paymentProvider.findUnique({
        where: { id: tempProvider.id },
      }),
    ).not.toBeNull();
    expect(
      await adminClient.billingCustomer.findUnique({
        where: { id: tempCustomer.id },
      }),
    ).not.toBeNull();

    // Delete the org; cascade should sweep both billing rows.
    await adminClient.organization.delete({ where: { id: tempOrg.id } });

    expect(
      await adminClient.paymentProvider.findUnique({
        where: { id: tempProvider.id },
      }),
    ).toBeNull();
    expect(
      await adminClient.billingCustomer.findUnique({
        where: { id: tempCustomer.id },
      }),
    ).toBeNull();

    await adminClient.networkProfile.delete({ where: { id: tempProfile.id } });
  });

  it("ChargeStatus enum: only the 8 canonical values are accepted", async () => {
    // Sanity check: writing a charge with an arbitrary status string is
    // rejected by Postgres because the column is the typed enum.
    const customer = await adminClient.billingCustomer.create({
      data: {
        tenantId: seeded.orgA.id,
        providerId: seeded.providerA.id,
        externalId: `${TEST_PREFIX}-enum-cust`,
      },
      select: { id: true },
    });

    await expect(
      adminClient.$executeRaw`
        INSERT INTO "charges"
          ("tenant_id", "provider_id", "external_id", "customer_id",
           "status", "amount_cents", "currency")
        VALUES
          (${seeded.orgA.id}::uuid,
           ${seeded.providerA.id}::uuid,
           ${`${TEST_PREFIX}-enum-bad`},
           ${customer.id}::uuid,
           ${"NOT_A_REAL_STATUS"}::"ChargeStatus",
           1000,
           'USD')
      `,
    ).rejects.toThrow();

    // Cleanup
    await adminClient.billingCustomer.delete({ where: { id: customer.id } });
  });
});
