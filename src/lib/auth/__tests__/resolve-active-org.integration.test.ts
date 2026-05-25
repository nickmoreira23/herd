import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveActiveOrgIdForProfile } from "../resolve-active-org";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const baseClient = new PrismaClient({ adapter: new PrismaPg(connectionString) });

const TEST_PREFIX = `test-resolve-org-${Date.now()}`;

let profileWithOrg: { id: string };
let profileWithoutOrg: { id: string };
let org: { id: string };

beforeAll(async () => {
  // NetworkProfileType removed in Sub-etapa 3.6.

  profileWithOrg = await baseClient.networkProfile.create({
    data: {
      firstName: "WithOrg",
      lastName: "Test",
      email: `${TEST_PREFIX}-with@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  profileWithoutOrg = await baseClient.networkProfile.create({
    data: {
      firstName: "WithoutOrg",
      lastName: "Test",
      email: `${TEST_PREFIX}-without@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  org = await baseClient.organization.create({
    data: {
      ownerId: profileWithOrg.id,
      slug: `${TEST_PREFIX}-org`,
      subdomain: `${TEST_PREFIX}-org`,
      name: "Test Org",
    },
    select: { id: true },
  });
});

afterAll(async () => {
  await baseClient.organization.deleteMany({
    where: { id: org.id },
  });
  await baseClient.networkProfile.deleteMany({
    where: { id: { in: [profileWithOrg.id, profileWithoutOrg.id] } },
  });
  await baseClient.$disconnect();
});

describe("resolveActiveOrgIdForProfile (integration)", () => {
  it("returns Organization id when profile owns one", async () => {
    const result = await resolveActiveOrgIdForProfile(profileWithOrg.id);
    expect(result).toBe(org.id);
  });

  it("returns null when profile has no Organization", async () => {
    const result = await resolveActiveOrgIdForProfile(profileWithoutOrg.id);
    expect(result).toBeNull();
  });
});
