import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { can } from "@/lib/permissions";
import type { Actor } from "@/lib/permissions/types";

/**
 * R&P Fase 7c-2a — grant writer for a custom role, end to end through the route
 * handlers (enforcement OFF → requireOrgRole is the gate). Proves: OWNER grants/
 * lists/revokes via the choke point; the grant reflows into can() via roleId
 * WITHOUT touching the loader/resolver; ADMIN is denied; non-routed cells and
 * cross-org roleIds are rejected with stable codes; effect is always "grant".
 */
const mock = vi.hoisted(() => ({ profileId: "", orgId: "" }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: mock.profileId, activeOrgId: mock.orgId, isSuperAdmin: false },
  })),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    if (mock.orgId) h.set("x-org-id", mock.orgId);
    return h;
  }),
}));

import { GET, POST, DELETE } from "../route";

const url = process.env.DATABASE_URL!;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const P = `test-grantwriter-${Date.now()}`;
let orgA = "", orgB = "", ownerProfile = "", adminProfile = "", roleId = "", orgBRoleId = "";

async function makeOrg(slug: string) {
  const o = await db.organization.create({ data: { slug, subdomain: slug, name: slug }, select: { id: true } });
  return o.id;
}
async function makeMember(orgId: string, role: "OWNER" | "ADMIN", email: string) {
  const prof = await db.networkProfile.create({
    data: { firstName: role, lastName: "X", email, status: "ACTIVE" }, select: { id: true },
  });
  await db.organizationMember.create({
    data: { organizationId: orgId, networkProfileId: prof.id, status: "ACTIVE",
      roles: { create: { role, scopeType: "ORG" } } },
  });
  return prof.id;
}

beforeAll(async () => {
  orgA = await makeOrg(`${P}-a`);
  orgB = await makeOrg(`${P}-b`);
  ownerProfile = await makeMember(orgA, "OWNER", `${P}-owner@ex.com`);
  adminProfile = await makeMember(orgA, "ADMIN", `${P}-admin@ex.com`);
  const r = await db.role.create({ data: { tenantId: orgA, name: `${P}-role`, key: `${P}-role` }, select: { id: true } });
  roleId = r.id;
  const rb = await db.role.create({ data: { tenantId: orgB, name: `${P}-brole`, key: `${P}-brole` }, select: { id: true } });
  orgBRoleId = rb.id;
  mock.profileId = ownerProfile;
  mock.orgId = orgA;
});

afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { tenant: { slug: { startsWith: P } } } });
  await db.role.deleteMany({ where: { tenant: { slug: { startsWith: P } } } });
  await db.membershipRole.deleteMany({ where: { member: { organization: { slug: { startsWith: P } } } } });
  await db.organizationMember.deleteMany({ where: { organization: { slug: { startsWith: P } } } });
  await db.networkProfile.deleteMany({ where: { email: { startsWith: P } } });
  await db.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await db.$disconnect();
});

function req(body?: unknown, method = "POST") {
  return new Request("http://t.local/", body !== undefined
    ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function actorWithRole(profileId: string): Actor {
  return {
    profileId,
    isSuperAdmin: false,
    memberships: [{ organizationId: orgA, status: "ACTIVE",
      roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null, roleId }] }],
  };
}

describe("Fase 7c-2a — custom-role grant writer (integration)", () => {
  it("OWNER grants locations:read → 200, row is effect=grant, reflows into can() via roleId", async () => {
    mock.profileId = ownerProfile;
    const res = await POST(req({ resource: "locations", action: "read" }), params(roleId));
    expect(res.status).toBe(200);

    const row = await db.rolePermission.findFirst({
      where: { roleId, tenantId: orgA, resource: "locations", action: "read", scopeType: "ORG" },
      select: { effect: true },
    });
    expect(row?.effect).toBe("grant");

    // Reflux — proves can() picks up the roleId grant with NO loader/resolver change.
    expect(await can(actorWithRole("p-x"), { resource: "locations", action: "read" }, orgA)).toBe(true);
    expect(await can(actorWithRole("p-x"), { resource: "members", action: "read" }, orgA)).toBe(false);
  });

  it("GET lists the role's grants (OWNER)", async () => {
    mock.profileId = ownerProfile;
    const res = await GET(req(undefined, "GET"), params(roleId));
    expect(res.status).toBe(200);
    const grants = (await res.json()).data.grants;
    expect(grants).toEqual(expect.arrayContaining([{ resource: "locations", action: "read" }]));
  });

  it("OWNER revokes → 200, row gone, can() denies again", async () => {
    mock.profileId = ownerProfile;
    const res = await DELETE(req({ resource: "locations", action: "read" }, "DELETE"), params(roleId));
    expect(res.status).toBe(200);
    expect(await can(actorWithRole("p-x"), { resource: "locations", action: "read" }, orgA)).toBe(false);
  });

  it("ADMIN cannot grant → 403 (mutation is OWNER-only)", async () => {
    mock.profileId = adminProfile;
    const res = await POST(req({ resource: "members", action: "read" }), params(roleId));
    expect(res.status).toBe(403);
    mock.profileId = ownerProfile;
  });

  it("non-routed cell → 422 invalid_grant (ghost resource rejected by catalog)", async () => {
    mock.profileId = ownerProfile;
    const res = await POST(req({ resource: "org_billing", action: "read" }), params(roleId));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("invalid_grant");
  });

  it("cross-org roleId → 404 role_not_found (RLS isolation)", async () => {
    mock.profileId = ownerProfile;
    const res = await POST(req({ resource: "locations", action: "read" }), params(orgBRoleId));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("role_not_found");
  });

  it("effect is never client-controlled — a deny field is ignored, row stays grant", async () => {
    mock.profileId = ownerProfile;
    await POST(req({ resource: "members", action: "read", effect: "deny" }), params(roleId));
    const row = await db.rolePermission.findFirst({
      where: { roleId, tenantId: orgA, resource: "members", action: "read" },
      select: { effect: true },
    });
    expect(row?.effect).toBe("grant");
    await DELETE(req({ resource: "members", action: "read" }, "DELETE"), params(roleId));
  });
});
