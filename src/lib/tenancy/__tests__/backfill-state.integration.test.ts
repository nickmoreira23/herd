import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { organizationSlugSchema } from "../../validators/organization-slug";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// Picks up Test A deferred from Sub-etapa 1: every NetworkProfile has exactly
// one Organization (the post-backfill 1:1 invariant the backfill seed claims).
describe("Backfill 1:1 invariant — NetworkProfile ↔ Organization (integration)", () => {
  afterAll(async () => prisma.$disconnect());

  // Excludes test-fixture profiles created by other integration suites so this
  // assertion reflects the production backfill invariant, not transient test seed.
  const realFilter = { email: { not: { startsWith: "test-" } } };

  it("each real NetworkProfile owns exactly one Organization", async () => {
    const profileCount = await prisma.networkProfile.count({ where: realFilter });
    const orgs = await prisma.organization.findMany({
      where: { owner: realFilter },
      select: { id: true },
    });
    const orphans = await prisma.networkProfile.count({
      where: { ...realFilter, ownedOrganizations: { none: {} } },
    });

    expect(profileCount).toBe(orgs.length);
    expect(orphans).toBe(0);
  });

  it("each Organization slug satisfies the validator", async () => {
    const orgs = await prisma.organization.findMany({ select: { slug: true } });
    for (const { slug } of orgs) {
      expect(() => organizationSlugSchema.parse(slug)).not.toThrow();
    }
  });
});
