import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolveActiveOrgIdForProfile } from "../resolve-active-org";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const baseClient = new PrismaClient({ adapter: new PrismaPg(connectionString) });

const TEST_PREFIX = `test-resolve-org-${Date.now()}`;

let profileOwner: { id: string };
let profileMemberOnly: { id: string };
let profileNoOrg: { id: string };
let orgViaOwner: { id: string };
let orgViaMembership: { id: string };

beforeAll(async () => {
  // Profile 1: has org via ownerId (fallback path) — no Membership row
  profileOwner = await baseClient.networkProfile.create({
    data: {
      firstName: "Owner",
      lastName: "Test",
      email: `${TEST_PREFIX}-owner@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // Profile 2: has org via Membership only (primary path) — no ownerId org
  profileMemberOnly = await baseClient.networkProfile.create({
    data: {
      firstName: "MemberOnly",
      lastName: "Test",
      email: `${TEST_PREFIX}-member@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // Profile 3: no org at all
  profileNoOrg = await baseClient.networkProfile.create({
    data: {
      firstName: "NoOrg",
      lastName: "Test",
      email: `${TEST_PREFIX}-noop@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // Org owned by profileOwner (no Membership row created — tests fallback)
  orgViaOwner = await baseClient.organization.create({
    data: {
      ownerId: profileOwner.id,
      slug: `${TEST_PREFIX}-owner-org`,
      subdomain: `${TEST_PREFIX}-owner-org`,
      name: "Owner Org",
    },
    select: { id: true },
  });

  // Org for Membership primary path (owned by nobody)
  orgViaMembership = await baseClient.organization.create({
    data: {
      slug: `${TEST_PREFIX}-member-org`,
      subdomain: `${TEST_PREFIX}-member-org`,
      name: "Member Org",
    },
    select: { id: true },
  });

  // Create Membership row (primary path) for profileMemberOnly
  const member = await baseClient.organizationMember.create({
    data: {
      organizationId: orgViaMembership.id,
      networkProfileId: profileMemberOnly.id,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  await baseClient.membershipRole.create({
    data: { memberId: member.id, role: "MEMBER", scopeType: "ORG" },
  });
});

afterAll(async () => {
  await baseClient.organization.deleteMany({
    where: { id: { in: [orgViaOwner.id, orgViaMembership.id] } },
  });
  await baseClient.networkProfile.deleteMany({
    where: { id: { in: [profileOwner.id, profileMemberOnly.id, profileNoOrg.id] } },
  });
  await baseClient.$disconnect();
});

describe("resolveActiveOrgIdForProfile (integration)", () => {
  it("primary path: returns organizationId from active Membership row", async () => {
    const result = await resolveActiveOrgIdForProfile(profileMemberOnly.id);
    expect(result).toBe(orgViaMembership.id);
  });

  it("fallback path: returns Organization id when profile owns via ownerId (no Membership)", async () => {
    const result = await resolveActiveOrgIdForProfile(profileOwner.id);
    expect(result).toBe(orgViaOwner.id);
  });

  it("returns null when profile has no Organization and no Membership", async () => {
    const result = await resolveActiveOrgIdForProfile(profileNoOrg.id);
    expect(result).toBeNull();
  });
});
