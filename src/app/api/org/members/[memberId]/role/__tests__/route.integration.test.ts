import { describe, it, expect, afterAll, vi } from "vitest";
import { PrismaClient, type MemberRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Mutable actor/org context read by the auth + headers mocks below.
const mockState = vi.hoisted(() => ({
  actorId: "",
  isSuperAdmin: false,
  orgId: "",
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: mockState.actorId, isSuperAdmin: mockState.isSuperAdmin },
  })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    if (mockState.orgId) h.set("x-org-id", mockState.orgId);
    return h;
  }),
}));

import { PATCH } from "../route";

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const db = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const PREFIX = `test-member-role-${Date.now()}`;
const orgIds: string[] = [];
const profileIds: string[] = [];

async function seedProfile(isSuperAdmin = false): Promise<string> {
  const p = await db.networkProfile.create({
    data: {
      firstName: "Test",
      lastName: "User",
      email: `${PREFIX}-${Math.random().toString(36).slice(2, 9)}@ex.com`,
      status: "ACTIVE",
      isSuperAdmin,
    },
    select: { id: true },
  });
  profileIds.push(p.id);
  return p.id;
}

async function seedOrg(): Promise<string> {
  const slug = `${PREFIX}-${Math.random().toString(36).slice(2, 9)}`;
  const o = await db.organization.create({
    data: { slug, subdomain: slug, name: "Test Org" },
    select: { id: true },
  });
  orgIds.push(o.id);
  return o.id;
}

async function seedMember(
  orgId: string,
  profileId: string,
  role: MemberRole
): Promise<string> {
  const m = await db.organizationMember.create({
    data: {
      organizationId: orgId,
      networkProfileId: profileId,
      status: "ACTIVE",
      roles: { create: { role, scopeType: "ORG" } },
    },
    select: { id: true },
  });
  return m.id;
}

function patch(memberId: string, role: string): Promise<Response> {
  const req = new Request(
    `http://test.local/api/org/members/${memberId}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }
  );
  return PATCH(req, { params: Promise.resolve({ memberId }) }) as Promise<Response>;
}

function actAs(actorId: string, orgId: string, isSuperAdmin = false) {
  mockState.actorId = actorId;
  mockState.orgId = orgId;
  mockState.isSuperAdmin = isSuperAdmin;
}

async function orgRoleOf(memberId: string): Promise<string | undefined> {
  const row = await db.membershipRole.findFirst({
    where: { memberId, scopeType: "ORG" },
  });
  return row?.role;
}

async function auditCount(memberId: string): Promise<number> {
  return db.auditLog.count({
    where: { action: "membership_role.assigned", resourceId: memberId },
  });
}

afterAll(async () => {
  if (orgIds.length) {
    await db.organization.deleteMany({ where: { id: { in: orgIds } } });
  }
  if (profileIds.length) {
    await db.networkProfile.deleteMany({ where: { id: { in: profileIds } } });
  }
  await db.$disconnect();
});

describe("PATCH /api/org/members/[memberId]/role", () => {
  it("ADMIN promotes MEMBER → ADMIN: 200 + audit", async () => {
    const orgId = await seedOrg();
    const adminId = await seedProfile();
    await seedMember(orgId, adminId, "ADMIN");
    const targetMember = await seedMember(orgId, await seedProfile(), "MEMBER");

    actAs(adminId, orgId);
    const res = await patch(targetMember, "ADMIN");

    expect(res.status).toBe(200);
    expect(await orgRoleOf(targetMember)).toBe("ADMIN");
    expect(await auditCount(targetMember)).toBe(1);
  });

  it("ADMIN promoting to OWNER: 403", async () => {
    const orgId = await seedOrg();
    const adminId = await seedProfile();
    await seedMember(orgId, adminId, "ADMIN");
    const targetMember = await seedMember(orgId, await seedProfile(), "MEMBER");

    actAs(adminId, orgId);
    const res = await patch(targetMember, "OWNER");

    expect(res.status).toBe(403);
    expect(await orgRoleOf(targetMember)).toBe("MEMBER");
    expect(await auditCount(targetMember)).toBe(0);
  });

  it("ADMIN altering an OWNER: 403", async () => {
    const orgId = await seedOrg();
    const adminId = await seedProfile();
    await seedMember(orgId, adminId, "ADMIN");
    await seedMember(orgId, await seedProfile(), "OWNER"); // floor owner
    const targetOwner = await seedMember(orgId, await seedProfile(), "OWNER");

    actAs(adminId, orgId);
    const res = await patch(targetOwner, "MEMBER");

    expect(res.status).toBe(403);
    expect(await orgRoleOf(targetOwner)).toBe("OWNER");
  });

  it("OWNER demoting the last OWNER: 409", async () => {
    const orgId = await seedOrg();
    const ownerId = await seedProfile();
    const ownerMember = await seedMember(orgId, ownerId, "OWNER");

    actAs(ownerId, orgId);
    const res = await patch(ownerMember, "MEMBER");

    expect(res.status).toBe(409);
    expect(await orgRoleOf(ownerMember)).toBe("OWNER");
    expect(await auditCount(ownerMember)).toBe(0);
  });

  it("OWNER demoting an OWNER with 2+ owners: 200", async () => {
    const orgId = await seedOrg();
    const ownerId = await seedProfile();
    await seedMember(orgId, ownerId, "OWNER");
    const owner2 = await seedMember(orgId, await seedProfile(), "OWNER");

    actAs(ownerId, orgId);
    const res = await patch(owner2, "MEMBER");

    expect(res.status).toBe(200);
    expect(await orgRoleOf(owner2)).toBe("MEMBER");
  });

  it("memberId from another org: 404 (isolation)", async () => {
    const orgId = await seedOrg();
    const ownerId = await seedProfile();
    await seedMember(orgId, ownerId, "OWNER");

    const otherOrg = await seedOrg();
    const foreignMember = await seedMember(
      otherOrg,
      await seedProfile(),
      "MEMBER"
    );

    actAs(ownerId, orgId); // header resolves to orgId, target lives in otherOrg
    const res = await patch(foreignMember, "ADMIN");

    expect(res.status).toBe(404);
    expect(await orgRoleOf(foreignMember)).toBe("MEMBER");
  });

  it("super_admin alters role: 200 (bypass permission)", async () => {
    const orgId = await seedOrg();
    const superId = await seedProfile(true); // isSuperAdmin, not a member
    await seedMember(orgId, await seedProfile(), "OWNER"); // floor owner
    const targetMember = await seedMember(orgId, await seedProfile(), "MEMBER");

    actAs(superId, orgId, true);
    const res = await patch(targetMember, "ADMIN");

    expect(res.status).toBe(200);
    expect(await orgRoleOf(targetMember)).toBe("ADMIN");
  });

  it("super_admin still blocked by last-OWNER invariant: 409", async () => {
    const orgId = await seedOrg();
    const superId = await seedProfile(true);
    const soleOwner = await seedMember(orgId, await seedProfile(), "OWNER");

    actAs(superId, orgId, true);
    const res = await patch(soleOwner, "MEMBER");

    expect(res.status).toBe(409);
    expect(await orgRoleOf(soleOwner)).toBe("OWNER");
  });

  it("no-op (same role): 200 without audit", async () => {
    const orgId = await seedOrg();
    const ownerId = await seedProfile();
    await seedMember(orgId, ownerId, "OWNER");
    const targetMember = await seedMember(orgId, await seedProfile(), "ADMIN");

    actAs(ownerId, orgId);
    const res = await patch(targetMember, "ADMIN");

    expect(res.status).toBe(200);
    expect(await orgRoleOf(targetMember)).toBe("ADMIN");
    expect(await auditCount(targetMember)).toBe(0);
  });
});
