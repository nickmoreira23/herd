import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { upsertGrant, removeGrant, bulkEnsureGrants, type GrantSlot } from "../grant-repository";

/**
 * R&P Fase 6a — the grant choke point enforces "one row per slot" app-level (the
 * legacy DB @@unique was dropped), AND the schema now accepts a global grant + a
 * per-org override for the same (role, resource, action) — which the old unique
 * blocked. Deny is NOT processed yet; this only proves the schema/choke-point shape.
 */
const url = process.env.DATABASE_URL!;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const P = `test-grantrepo-${Date.now()}`;
let orgId = "";
const RES = `${P}-res`; // unique resource string so we never touch the 108 system rows

afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { resource: RES } });
  await db.organization.deleteMany({ where: { slug: P } });
  await db.$disconnect();
});

beforeAll(async () => {
  const o = await db.organization.create({ data: { slug: P, subdomain: P, name: P }, select: { id: true } });
  orgId = o.id;
});

const globalSlot: GrantSlot = {
  tenantId: null, role: "MEMBER", roleId: null, resource: RES, action: "read", scopeType: "ORG",
};

describe("grant choke point (integration)", () => {
  it("upsertGrant on the same slot twice keeps exactly one row", async () => {
    await upsertGrant(globalSlot, "grant");
    await upsertGrant(globalSlot, "grant");
    const n = await db.rolePermission.count({ where: { resource: RES, tenantId: null, role: "MEMBER" } });
    expect(n).toBe(1);
  });

  it("schema now accepts a global grant + a per-org override for the same slot", async () => {
    // Same role/resource/action as the global, but tenant-scoped → the OLD @@unique
    // would have blocked this; now it must coexist as a distinct slot.
    const overrideSlot: GrantSlot = { ...globalSlot, tenantId: orgId };
    await upsertGrant(overrideSlot, "grant");
    const rows = await db.rolePermission.count({
      where: { resource: RES, role: "MEMBER", action: "read" },
    });
    expect(rows).toBe(2); // global (tenant null) + override (tenant orgId)
  });

  it("removeGrant deletes only the addressed slot", async () => {
    await removeGrant({ ...globalSlot, tenantId: orgId });
    const rows = await db.rolePermission.count({ where: { resource: RES, role: "MEMBER", action: "read" } });
    expect(rows).toBe(1); // override gone, global remains
    await removeGrant(globalSlot);
  });

  it("bulkEnsureGrants is idempotent and slot-safe", async () => {
    const slots: GrantSlot[] = [
      { tenantId: null, role: "ADMIN", roleId: null, resource: RES, action: "create", scopeType: "ORG" },
      { tenantId: null, role: "ADMIN", roleId: null, resource: RES, action: "update", scopeType: "ORG" },
    ];
    const first = await bulkEnsureGrants(db, slots);
    const second = await bulkEnsureGrants(db, slots);
    expect(first).toBe(2); // both inserted
    expect(second).toBe(0); // none re-inserted (idempotent)
    const n = await db.rolePermission.count({ where: { resource: RES, role: "ADMIN" } });
    expect(n).toBe(2);
  });
});
