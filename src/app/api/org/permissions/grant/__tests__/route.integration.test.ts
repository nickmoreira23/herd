import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedRolePermissions } from "../../../../../../../scripts/seed-role-permissions";

const mockState = vi.hoisted(() => ({
  actorId: "",
  role: undefined as string | undefined,
  activeOrgId: "",
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: mockState.actorId,
      role: mockState.role,
      activeOrgId: mockState.activeOrgId,
    },
  })),
}));

import { PATCH } from "../route";

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) throw new Error("DATABASE_URL or DIRECT_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const PREFIX = `test-grant-${Date.now()}`;
let orgId = "";
let superId = "";

function patch(body: unknown): Promise<Response> {
  const req = new Request("http://test.local/api/org/permissions/grant", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return PATCH(req) as Promise<Response>;
}

function asSuper() {
  mockState.actorId = superId;
  mockState.role = "super_admin";
  mockState.activeOrgId = orgId;
}

const ORG = "ORG" as const;
async function rowExists(role: string, resource: string, action: string) {
  // Fase 6a: legacy @@unique dropped — address the system-global slot by fields.
  const row = await db.rolePermission.findFirst({
    where: { tenantId: null, roleId: null, role: role as never, resource, action, scopeType: ORG },
  });
  return row !== null;
}
async function auditCount() {
  return db.auditLog.count({
    where: { action: "role_permission.updated", tenantId: orgId },
  });
}

beforeAll(async () => {
  const org = await db.organization.create({
    data: { slug: PREFIX, subdomain: PREFIX, name: "Grant Test Org" },
    select: { id: true },
  });
  orgId = org.id;
  const profile = await db.networkProfile.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: `${PREFIX}@ex.com`,
      status: "ACTIVE",
      isSuperAdmin: true,
    },
    select: { id: true },
  });
  superId = profile.id;
  await seedRolePermissions(db); // ensure canonical matrix present
});

afterAll(async () => {
  // Restore the canonical matrix: drop test-only grants, re-add any seeded rows
  // a test deleted.
  await db.rolePermission.deleteMany({
    where: { role: "MEMBER", resource: "locations", action: "create" },
  });
  await seedRolePermissions(db);
  await db.auditLog.deleteMany({ where: { tenantId: orgId } });
  await db.organization.deleteMany({ where: { id: orgId } });
  await db.networkProfile.deleteMany({ where: { id: superId } });
  await db.$disconnect();
});

describe("PATCH /api/org/permissions/grant", () => {
  it("super_admin turns a grant ON: 200 + row created + audit", async () => {
    asSuper();
    // MEMBER/locations/create is NOT in the seed.
    await db.rolePermission.deleteMany({
      where: { role: "MEMBER", resource: "locations", action: "create" },
    });
    const before = await auditCount();
    const res = await patch({
      role: "MEMBER",
      resource: "locations",
      action: "create",
      scopeType: "ORG",
      granted: true,
    });
    expect(res.status).toBe(200);
    expect(await rowExists("MEMBER", "locations", "create")).toBe(true);
    expect(await auditCount()).toBe(before + 1);
  });

  it("super_admin turns a grant OFF: 200 + row removed + audit", async () => {
    asSuper();
    // ADMIN/locations/create IS in the seed.
    expect(await rowExists("ADMIN", "locations", "create")).toBe(true);
    const before = await auditCount();
    const res = await patch({
      role: "ADMIN",
      resource: "locations",
      action: "create",
      scopeType: "ORG",
      granted: false,
    });
    expect(res.status).toBe(200);
    expect(await rowExists("ADMIN", "locations", "create")).toBe(false);
    expect(await auditCount()).toBe(before + 1);
  });

  it("non-super: 403", async () => {
    mockState.actorId = "00000000-0000-4000-8000-000000000000";
    mockState.role = undefined;
    mockState.activeOrgId = orgId;
    const res = await patch({
      role: "MEMBER",
      resource: "locations",
      action: "read",
      scopeType: "ORG",
      granted: false,
    });
    expect(res.status).toBe(403);
  });

  it("ghost resource: 422 (server blocks)", async () => {
    asSuper();
    const res = await patch({
      role: "MEMBER",
      resource: "audit_log",
      action: "read",
      scopeType: "ORG",
      granted: true,
    });
    expect(res.status).toBe(422);
  });

  it("department role: 422 (server blocks)", async () => {
    asSuper();
    const res = await patch({
      role: "DEPARTMENT_HEAD",
      resource: "members",
      action: "read",
      scopeType: "ORG",
      granted: true,
    });
    expect(res.status).toBe(422);
  });

  it("OWNER members guardrail: removing → 422", async () => {
    asSuper();
    const res = await patch({
      role: "OWNER",
      resource: "members",
      action: "read",
      scopeType: "ORG",
      granted: false,
    });
    expect(res.status).toBe(422);
    expect(await rowExists("OWNER", "members", "read")).toBe(true); // untouched
  });

  it("no-op (same state): 200 without audit", async () => {
    asSuper();
    // OWNER/org/read IS in the seed → setting granted:true is a no-op.
    expect(await rowExists("OWNER", "org", "read")).toBe(true);
    const before = await auditCount();
    const res = await patch({
      role: "OWNER",
      resource: "org",
      action: "read",
      scopeType: "ORG",
      granted: true,
    });
    expect(res.status).toBe(200);
    expect(await auditCount()).toBe(before);
  });
});
