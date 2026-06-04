import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { can } from "@/lib/permissions";
import type { Actor } from "@/lib/permissions/types";

/**
 * R&P Fase 5 — CRUD of custom per-org roles + assignment, end to end through the
 * route handlers (enforcement OFF → requireOrgRole is the gate; getActor resolves
 * the seeded OWNER from the DB). Proves RLS isolation, the CRUD lifecycle, the
 * delete-while-assigned block, the system-name collision guard, and that assigning
 * a custom role makes can() grant its (seeded) permission via the roleId path.
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

import { GET as listRoles, POST as createRole } from "../route";
import { PATCH as patchRole, DELETE as deleteRole } from "../[id]/route";
import { POST as assignRole } from "../../members/[memberId]/roles/route";
import { DELETE as unassignRole } from "../../members/[memberId]/roles/[roleId]/route";

const url = process.env.DATABASE_URL!;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const P = `test-rolecrud-${Date.now()}`;
let orgA = "", orgB = "", ownerProfile = "", memberId = "", orgBRoleId = "";

async function makeOrg(slug: string) {
  const o = await db.organization.create({ data: { slug, subdomain: slug, name: slug }, select: { id: true } });
  return o.id;
}

beforeAll(async () => {
  orgA = await makeOrg(`${P}-a`);
  orgB = await makeOrg(`${P}-b`);
  const prof = await db.networkProfile.create({
    data: { firstName: "Own", lastName: "Er", email: `${P}@ex.com`, status: "ACTIVE" },
    select: { id: true },
  });
  ownerProfile = prof.id;
  const m = await db.organizationMember.create({
    data: { organizationId: orgA, networkProfileId: prof.id, status: "ACTIVE",
      roles: { create: { role: "OWNER", scopeType: "ORG" } } },
    select: { id: true },
  });
  // A second member (MEMBER) to receive a custom role.
  const prof2 = await db.networkProfile.create({
    data: { firstName: "Mem", lastName: "Ber", email: `${P}2@ex.com`, status: "ACTIVE" },
    select: { id: true },
  });
  const m2 = await db.organizationMember.create({
    data: { organizationId: orgA, networkProfileId: prof2.id, status: "ACTIVE",
      roles: { create: { role: "MEMBER", scopeType: "ORG" } } },
    select: { id: true },
  });
  memberId = m2.id;
  void m;
  // A role in orgB, for the isolation assertion.
  const rb = await db.role.create({ data: { tenantId: orgB, name: `${P}-bRole`, key: `${P}-brole` }, select: { id: true } });
  orgBRoleId = rb.id;
  mock.profileId = ownerProfile;
  mock.orgId = orgA;
});

afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { tenant: { slug: { startsWith: P } } } });
  await db.membershipRole.deleteMany({ where: { member: { organization: { slug: { startsWith: P } } } } });
  await db.role.deleteMany({ where: { tenant: { slug: { startsWith: P } } } });
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

describe("Fase 5 — Role CRUD + assignment (integration)", () => {
  let createdRoleId = "";

  it("creates a custom role (201) and lists it; orgB's role is NOT visible (RLS)", async () => {
    const res = await createRole(req({ name: "Finance Viewer", key: "finance-viewer" }));
    expect(res.status).toBe(201);
    createdRoleId = (await res.json()).data.id;

    const list = await (await listRoles()).json();
    const ids = list.data.roles.map((r: { id: string }) => r.id);
    expect(ids).toContain(createdRoleId);
    expect(ids).not.toContain(orgBRoleId); // isolation: orgB role invisible from orgA
  });

  it("rejects a name/key colliding with a system role (422)", async () => {
    const res = await createRole(req({ name: "Owner", key: "owner" }));
    expect(res.status).toBe(422);
  });

  it("updates the role (200)", async () => {
    const res = await patchRole(req({ description: "edits the books" }, "PATCH"),
      { params: Promise.resolve({ id: createdRoleId }) });
    expect(res.status).toBe(200);
  });

  it("assigns the custom role to a member; can() grants its seeded permission via roleId", async () => {
    const res = await assignRole(req({ roleId: createdRoleId }),
      { params: Promise.resolve({ memberId }) });
    expect(res.status).toBe(201);

    // Seed one grant on the custom role (Fase 5 roles start empty; grant editing is Fase 6).
    await db.rolePermission.create({
      data: { roleId: createdRoleId, tenantId: orgA, resource: "locations", action: "read", scopeType: "ORG" },
    });
    const actor: Actor = {
      profileId: "x", isSuperAdmin: false,
      memberships: [{ organizationId: orgA, status: "ACTIVE",
        roles: [{ role: null, scopeType: "ORG", scopeId: null, roleId: createdRoleId }] }],
    };
    expect(await can(actor, { resource: "locations", action: "read" }, orgA)).toBe(true);
    expect(await can(actor, { resource: "members", action: "read" }, orgA)).toBe(false);
  });

  it("blocks deleting a role still assigned (409), allows after unassign (200)", async () => {
    const blocked = await deleteRole(req(undefined, "DELETE"), { params: Promise.resolve({ id: createdRoleId }) });
    expect(blocked.status).toBe(409);

    const un = await unassignRole(req(undefined, "DELETE"),
      { params: Promise.resolve({ memberId, roleId: createdRoleId }) });
    expect(un.status).toBe(200);

    // Remove the seeded grant so the role has no FK refs blocking delete.
    await db.rolePermission.deleteMany({ where: { roleId: createdRoleId } });
    const ok = await deleteRole(req(undefined, "DELETE"), { params: Promise.resolve({ id: createdRoleId }) });
    expect(ok.status).toBe(200);
  });

  it("≥1 OWNER invariant untouched by custom-role assignment", async () => {
    const owners = await db.organizationMember.count({
      where: { organizationId: orgA, status: "ACTIVE", roles: { some: { role: "OWNER", scopeType: "ORG" } } },
    });
    expect(owners).toBe(1); // assigning/unassigning custom roles never changed it
  });
});
