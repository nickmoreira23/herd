import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { can } from "../can";
import { resolveViewerPermissions } from "../resolve-viewer-permissions";
import { buildKey } from "../permission-key";
import { upsertGrant, type GrantSlot } from "../grant-repository";
import type { Actor } from "../types";

/**
 * R&P Fase 7a — proves the client allow-set == the server can() for representative
 * cases, INCLUDING a synthetic deny and an OWNER-floor case. The client side is the
 * pure `buildKey` lookup over `resolveViewerPermissions().allowSet`; the server side
 * is the authoritative `can()`. They must agree — the allow-set reflects the resolved
 * matrix, not a second logic. Distinct orgs per scenario avoid the request-memo leak.
 */
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const P = `test-vpar-${Date.now()}`;
let orgClean = "", orgDeny = "", orgFloor = "";

async function org(suffix: string) {
  return (await db.organization.create({ data: { slug: `${P}-${suffix}`, subdomain: `${P}-${suffix}`, name: suffix }, select: { id: true } })).id;
}
function actor(orgId: string, role: "OWNER" | "ADMIN" | "MEMBER"): Actor {
  return {
    profileId: `p-${role}`, isSuperAdmin: false,
    memberships: [{ organizationId: orgId, status: "ACTIVE", roles: [{ role, scopeType: "ORG", scopeId: null }] }],
  };
}

beforeAll(async () => {
  orgClean = await org("clean");
  orgDeny = await org("deny");
  orgFloor = await org("floor");
  await upsertGrant({ tenantId: orgDeny, role: "ADMIN", roleId: null, resource: "locations", action: "read", scopeType: "ORG" } as GrantSlot, "deny");
  await upsertGrant({ tenantId: orgFloor, role: "OWNER", roleId: null, resource: "roles", action: "delete", scopeType: "ORG" } as GrantSlot, "deny");
});
afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { OR: [{ tenantId: orgDeny }, { tenantId: orgFloor }] } });
  await db.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await db.$disconnect();
});

// Asserts the client lookup (allowSet) and the server can() agree for (resource, action).
async function parity(a: Actor, orgId: string, resource: string, action: string) {
  const server = await can(a, { resource: resource as never, action: action as never }, orgId);
  const { allowSet } = await resolveViewerPermissions(orgId, a);
  const client = allowSet.includes(buildKey(resource, action, "ORG"));
  return { server, client };
}

describe("Fase 7a — client allow-set == server can()", () => {
  it("clean org: OWNER grant present on both", async () => {
    const r = await parity(actor(orgClean, "OWNER"), orgClean, "roles", "delete");
    expect(r.client).toBe(r.server);
    expect(r.server).toBe(true);
  });

  it("clean org: MEMBER lacks a grant on both", async () => {
    const r = await parity(actor(orgClean, "MEMBER"), orgClean, "roles", "delete");
    expect(r.client).toBe(r.server);
    expect(r.server).toBe(false);
  });

  it("clean org: MEMBER has its own grant on both (locations.read)", async () => {
    const r = await parity(actor(orgClean, "MEMBER"), orgClean, "locations", "read");
    expect(r.client).toBe(r.server);
    expect(r.server).toBe(true);
  });

  it("synthetic deny: ADMIN×locations.read denied on both", async () => {
    const r = await parity(actor(orgDeny, "ADMIN"), orgDeny, "locations", "read");
    expect(r.client).toBe(r.server);
    expect(r.server).toBe(false); // deny applied in resolution
  });

  it("OWNER floor: deny on roles.delete IGNORED on both (floor protects)", async () => {
    const r = await parity(actor(orgFloor, "OWNER"), orgFloor, "roles", "delete");
    expect(r.client).toBe(r.server);
    expect(r.server).toBe(true); // floor wins → still granted on both
  });
});
