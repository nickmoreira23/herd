import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadRoleMatrix } from "@/lib/permissions/role-matrix-loader";

/**
 * R&P Fase 6c — the per-org override endpoint (OWNER-only). Proves: a deny lands
 * in the loader's resolution for the org; the OWNER floor is rejected 422; ADMIN
 * cannot edit (403); inherit clears an override; and a deny in orgA does NOT leak
 * to orgB (RLS / per-org).
 */
const mock = vi.hoisted(() => ({ profileId: "", orgId: "" }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: mock.profileId, activeOrgId: mock.orgId, isSuperAdmin: false } })),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    if (mock.orgId) h.set("x-org-id", mock.orgId);
    return h;
  }),
}));

import { PATCH } from "../route";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const P = `test-override-${Date.now()}`;
let orgA = "", orgB = "", ownerId = "", adminId = "";

function patch(body: unknown): Promise<Response> {
  return PATCH(new Request("http://t.local/", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })) as Promise<Response>;
}

async function member(orgId: string, role: "OWNER" | "ADMIN", suffix: string) {
  const p = await db.networkProfile.create({
    data: { firstName: role, lastName: suffix, email: `${P}-${suffix}@ex.com`, status: "ACTIVE" }, select: { id: true },
  });
  await db.organizationMember.create({
    data: { organizationId: orgId, networkProfileId: p.id, status: "ACTIVE", roles: { create: { role, scopeType: "ORG" } } },
  });
  return p.id;
}

beforeAll(async () => {
  orgA = (await db.organization.create({ data: { slug: `${P}-a`, subdomain: `${P}-a`, name: "A" }, select: { id: true } })).id;
  orgB = (await db.organization.create({ data: { slug: `${P}-b`, subdomain: `${P}-b`, name: "B" }, select: { id: true } })).id;
  ownerId = await member(orgA, "OWNER", "owner");
  adminId = await member(orgA, "ADMIN", "admin");
  mock.profileId = ownerId; mock.orgId = orgA;
});
afterEach(async () => {
  await db.rolePermission.deleteMany({ where: { OR: [{ tenantId: orgA }, { tenantId: orgB }] } });
  mock.profileId = ownerId; mock.orgId = orgA;
});
afterAll(async () => {
  await db.rolePermission.deleteMany({ where: { OR: [{ tenantId: orgA }, { tenantId: orgB }] } });
  await db.organizationMember.deleteMany({ where: { organization: { slug: { startsWith: P } } } });
  await db.networkProfile.deleteMany({ where: { email: { startsWith: P } } });
  await db.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await db.$disconnect();
});

const adminHas = async (orgId: string, r: string, a: string) => {
  const m = await loadRoleMatrix(orgId);
  return (m.ADMIN ?? []).some((p) => p.resource === r && p.action === a);
};

describe("PATCH /api/org/roles/matrix (Fase 6c)", () => {
  it("OWNER deny on ADMIN×locations.read → loader drops it for the org", async () => {
    expect(await adminHas(orgA, "locations", "read")).toBe(true); // baseline (global grant)
    const res = await patch({ role: "ADMIN", resource: "locations", action: "read", effect: "deny" });
    expect(res.status).toBe(200);
    expect(await adminHas(orgA, "locations", "read")).toBe(false); // denied for orgA
  });

  it("OWNER deny on the OWNER floor → 422 (anti-self-lockout)", async () => {
    const res = await patch({ role: "OWNER", resource: "roles", action: "delete", effect: "deny" });
    expect(res.status).toBe(422);
  });

  it("inherit clears the override (back to global)", async () => {
    await patch({ role: "ADMIN", resource: "locations", action: "read", effect: "deny" });
    expect(await adminHas(orgA, "locations", "read")).toBe(false);
    const res = await patch({ role: "ADMIN", resource: "locations", action: "read", effect: "inherit" });
    expect(res.status).toBe(200);
    expect(await adminHas(orgA, "locations", "read")).toBe(true); // inherited again
  });

  it("ADMIN cannot edit → 403", async () => {
    mock.profileId = adminId; // ADMIN of orgA
    const res = await patch({ role: "MEMBER", resource: "locations", action: "read", effect: "deny" });
    expect(res.status).toBe(403);
  });

  it("RLS / per-org: a deny in orgA does NOT affect orgB", async () => {
    await patch({ role: "ADMIN", resource: "locations", action: "read", effect: "deny" }); // orgA
    expect(await adminHas(orgA, "locations", "read")).toBe(false);
    expect(await adminHas(orgB, "locations", "read")).toBe(true); // orgB unaffected
  });
});
