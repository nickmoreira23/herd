import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { can } from "../can";
import type { Actor } from "../types";

/**
 * R&P Fase 4a — proves the custom-role path in can(): a Role with a single grant
 * makes can() permit ONLY that (resource, action) and deny everything else, keyed
 * by roleId (not the MemberRole enum). No CRUD/editor yet — the Role + grant are
 * seeded directly and the actor is constructed synthetically with the roleId.
 */
const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const admin = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const P = `test-customrole-${Date.now()}`;
let orgId = "";
let roleId = "";

beforeAll(async () => {
  const org = await admin.organization.create({
    data: { slug: P, subdomain: P, name: "Custom Role Org" },
    select: { id: true },
  });
  orgId = org.id;
  const role = await admin.role.create({
    data: { tenantId: orgId, name: `${P}-role`, key: `${P}-role` },
    select: { id: true },
  });
  roleId = role.id;
  // One custom grant: locations.read, scoped to this org (override row).
  await admin.rolePermission.create({
    data: { roleId, tenantId: orgId, resource: "locations", action: "read", scopeType: "ORG" },
  });
});

afterAll(async () => {
  await admin.rolePermission.deleteMany({ where: { roleId } });
  await admin.role.deleteMany({ where: { id: roleId } });
  await admin.organization.deleteMany({ where: { id: orgId } });
  await admin.$disconnect();
});

function actorWithCustomRole(): Actor {
  return {
    profileId: "p-custom",
    isSuperAdmin: false,
    memberships: [
      {
        organizationId: orgId,
        status: "ACTIVE",
        // role enum is ignored when roleId is set (can() keys by roleId).
        roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null, roleId }],
      },
    ],
  };
}

describe("can() custom-role path (integration)", () => {
  it("grants ONLY the custom role's single grant", async () => {
    const actor = actorWithCustomRole();
    expect(await can(actor, { resource: "locations", action: "read" }, orgId)).toBe(true);
  });

  it("denies everything else (resource the custom role lacks)", async () => {
    const actor = actorWithCustomRole();
    expect(await can(actor, { resource: "locations", action: "create" }, orgId)).toBe(false);
    expect(await can(actor, { resource: "members", action: "read" }, orgId)).toBe(false);
    expect(await can(actor, { resource: "org", action: "delete" }, orgId)).toBe(false);
  });

  it("does NOT inherit system MEMBER grants (keyed by roleId, not the enum)", async () => {
    // System MEMBER has members.read; the custom-role actor must NOT get it.
    const actor = actorWithCustomRole();
    expect(await can(actor, { resource: "members", action: "read" }, orgId)).toBe(false);
  });
});
