import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedRolePermissions } from "../../../../scripts/seed-role-permissions";

/**
 * THE proof of the whole feature (V3.4): editing the matrix changes who can do
 * what — no code change. With CAN_ENFORCEMENT=enforce, removing MEMBER's
 * `locations:read` grant makes GET /api/locations return 403 for a MEMBER who
 * passed a moment earlier; restoring the grant restores access.
 */
const mockState = vi.hoisted(() => ({ actorId: "", orgId: "" }));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: mockState.actorId } })),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    if (mockState.orgId) h.set("x-org-id", mockState.orgId);
    return h;
  }),
}));

import { GET as locationsGet } from "../locations/route";

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) throw new Error("DATABASE_URL or DIRECT_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const PREFIX = `test-enforce-effect-${Date.now()}`;
let orgId = "";
let memberId = "";

const GRANT = {
  role: "MEMBER" as const,
  resource: "locations",
  action: "read",
  scopeType: "ORG" as const,
};
const grantWhere = { role_resource_action_scopeType: GRANT };

function getLocations(): Promise<Response> {
  return locationsGet(
    new Request("http://test.local/api/locations")
  ) as Promise<Response>;
}

beforeAll(async () => {
  const org = await db.organization.create({
    data: { slug: PREFIX, subdomain: PREFIX, name: "Enforce Effect Org" },
    select: { id: true },
  });
  orgId = org.id;
  const profile = await db.networkProfile.create({
    data: {
      firstName: "Member",
      lastName: "Effect",
      email: `${PREFIX}@ex.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  await db.organizationMember.create({
    data: {
      organizationId: orgId,
      networkProfileId: profile.id,
      status: "ACTIVE",
      roles: { create: { role: "MEMBER", scopeType: "ORG" } },
    },
  });
  memberId = profile.id;
  await seedRolePermissions(db); // canonical matrix: MEMBER has locations:read
  mockState.actorId = memberId;
  mockState.orgId = orgId;
});

afterAll(async () => {
  delete process.env.CAN_ENFORCEMENT;
  await seedRolePermissions(db); // restore canonical matrix
  await db.organization.deleteMany({ where: { id: orgId } });
  await db.networkProfile.deleteMany({ where: { id: memberId } });
  await db.$disconnect();
});

describe("flip has teeth: matrix edit changes authorization", () => {
  it("MEMBER blocked when locations:read removed, allowed when restored (enforce)", async () => {
    process.env.CAN_ENFORCEMENT = "enforce";

    // Baseline — grant present + enforce → MEMBER passes the gate.
    await db.rolePermission.upsert({
      where: grantWhere,
      update: {},
      create: GRANT,
    });
    const baseline = await getLocations();
    expect(baseline.status).not.toBe(403);

    // Remove the grant → can() denies → 403 (no code change, only data).
    await db.rolePermission.delete({ where: grantWhere });
    const denied = await getLocations();
    expect(denied.status).toBe(403);

    // Restore the grant → access returns.
    await db.rolePermission.create({ data: GRANT });
    const restored = await getLocations();
    expect(restored.status).not.toBe(403);

    delete process.env.CAN_ENFORCEMENT;
  });

  it("with flag off, the same removed grant does NOT block (inert)", async () => {
    delete process.env.CAN_ENFORCEMENT; // off
    await db.rolePermission.delete({ where: grantWhere }).catch(() => {});
    const res = await getLocations();
    expect(res.status).not.toBe(403); // off → can() never runs
    await db.rolePermission.create({ data: GRANT }); // restore
  });
});
