import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadRoleMatrix } from "../role-matrix-loader";
import { upsertGrant, type GrantSlot } from "../grant-repository";
import { OWNER_FLOOR } from "../admin-floor";
import { ROLE_PERMISSIONS } from "../role-permissions";

/**
 * R&P Fase 6b — precedence oracle: OWNER_FLOOR > deny per-org > grant per-org >
 * grant global. Denies are seeded via the choke point (no editor yet). Each case
 * cleans its org overrides so cases don't bleed.
 */
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const P = `test-deny-${Date.now()}`;
let orgId = "";

beforeAll(async () => {
  const o = await db.organization.create({ data: { slug: P, subdomain: P, name: P }, select: { id: true } });
  orgId = o.id;
});
afterEach(async () => {
  await db.rolePermission.deleteMany({ where: { tenantId: orgId } }); // clear this org's overrides
});
afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { tenantId: orgId } });
  await db.organization.deleteMany({ where: { id: orgId } });
  await db.$disconnect();
});

const has = (m: Record<string, { resource: string; action: string }[]>, key: string, r: string, a: string) =>
  (m[key] ?? []).some((p) => p.resource === r && p.action === a);

// deny a system-role ORG slot for this org via the choke point.
const denyOrg = (role: "OWNER" | "ADMIN" | "MEMBER", resource: string, action: string) =>
  upsertGrant({ tenantId: orgId, role, roleId: null, resource, action, scopeType: "ORG" } as GrantSlot, "deny");

describe("Fase 6b — deny precedence + OWNER floor", () => {
  it("baseline (no deny): global grants resolve as before", async () => {
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "MEMBER", "locations", "read")).toBe(true);
    expect(has(m, "OWNER", "roles", "delete")).toBe(true);
  });

  it("deny per-org removes a grant (role≠OWNER) — MEMBER loses locations.read", async () => {
    await denyOrg("MEMBER", "locations", "read");
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "MEMBER", "locations", "read")).toBe(false);
  });

  it("OWNER floor IGNORES deny — deny OWNER.roles.delete → still permitted", async () => {
    await denyOrg("OWNER", "roles", "delete");
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "OWNER", "roles", "delete")).toBe(true); // floor protects
  });

  it("OWNER non-floor IS denied — deny OWNER.locations.read → removed", async () => {
    await denyOrg("OWNER", "locations", "read");
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "OWNER", "locations", "read")).toBe(false);
  });

  it("ADMIN has NO floor — deny ADMIN.members.update (an OWNER-floor perm) → removed", async () => {
    await denyOrg("ADMIN", "members", "update");
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "ADMIN", "members", "update")).toBe(false);
  });

  it("deny without a matching grant is a no-op (never creates a permit)", async () => {
    await denyOrg("MEMBER", "members", "create"); // MEMBER never had it
    const m = await loadRoleMatrix(orgId);
    expect(has(m, "MEMBER", "members", "create")).toBe(false);
  });

  it("custom role has NO floor — grant + deny same slot → denied", async () => {
    const role = await db.role.create({ data: { tenantId: orgId, name: `${P}-c`, key: `${P}-c` }, select: { id: true } });
    const slot: GrantSlot = { tenantId: orgId, role: null, roleId: role.id, resource: "roles", action: "delete", scopeType: "ORG" };
    await upsertGrant(slot, "grant");
    let m = await loadRoleMatrix(orgId);
    expect(has(m, role.id, "roles", "delete")).toBe(true); // granted
    await upsertGrant(slot, "deny");
    m = await loadRoleMatrix(orgId);
    expect(has(m, role.id, "roles", "delete")).toBe(false); // custom: no floor → denied
    await db.role.deleteMany({ where: { id: role.id } });
  });

  it("ANTI-SELF-LOCKOUT: deny ALL OWNER perms → OWNER keeps EXACTLY the floor", async () => {
    const globals = await loadRoleMatrix(); // globals only
    const ownerPerms = globals.OWNER;
    // Bulk-insert the denies in one query (fixture seeding — ~40 sequential
    // upsert transactions would time out; the single-deny cases above already
    // exercise the choke point).
    await db.rolePermission.createMany({
      data: ownerPerms.map((p) => ({
        tenantId: orgId, role: "OWNER" as const, roleId: null,
        resource: p.resource, action: p.action,
        scopeType: (p.scopeType === "department" ? "DEPARTMENT" : "ORG") as "ORG" | "DEPARTMENT",
        effect: "deny" as const,
      })),
    });
    const m = await loadRoleMatrix(orgId);
    const survived = new Set((m.OWNER ?? []).map((p) => `${p.resource}.${p.action}`));
    const floor = new Set(OWNER_FLOOR.map((f) => `${f.resource}.${f.action}`));
    expect(survived).toEqual(floor); // exactly the floor, nothing more, nothing less
    // and the floor is enough to re-open the editor (roles.* + members.update present)
    expect(has(m, "OWNER", "roles", "update")).toBe(true);
    expect(has(m, "OWNER", "members", "update")).toBe(true);
  });

  it("NON-REGRESSION: with no override, the org matrix == the global canonical for OWNER", async () => {
    const m = await loadRoleMatrix(orgId); // afterEach cleared overrides
    const got = new Set((m.OWNER ?? []).map((p) => `${p.resource}.${p.action}`));
    const expected = new Set(ROLE_PERMISSIONS.OWNER.map((g) => `${g.resource}.${g.action}`));
    expect(got).toEqual(expected);
  });
});
