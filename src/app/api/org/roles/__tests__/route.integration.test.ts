import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * POST /api/org/roles — contract regression for the PROD incident where the
 * form's `description: null` was rejected by `.optional()` (which only accepts
 * undefined) and every create silently died as a 400 behind a generic toast.
 * Proves: null/omitted/string descriptions create (201); real validation
 * failures still 400 with `details.fieldErrors` (the shape the modal surfaces).
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

import { POST, GET } from "../route";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const P = `test-role-create-${Date.now()}`;
let orgId = "";
let ownerId = "";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://test.local/api/org/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  const org = await db.organization.create({
    data: { slug: P, subdomain: P, name: "Role Create Org" },
    select: { id: true },
  });
  orgId = org.id;
  const profile = await db.networkProfile.create({
    data: { firstName: "Role", lastName: "Creator", email: `${P}@ex.com`, status: "ACTIVE" },
    select: { id: true },
  });
  ownerId = profile.id;
  await db.organizationMember.create({
    data: {
      organizationId: orgId,
      networkProfileId: ownerId,
      status: "ACTIVE",
      roles: { create: { role: "OWNER", scopeType: "ORG", scopeId: null } },
    },
  });
  mock.profileId = ownerId;
  mock.orgId = orgId;
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { tenantId: orgId } });
  await db.role.deleteMany({ where: { tenantId: orgId } });
  await db.organization.deleteMany({ where: { id: orgId } });
  await db.networkProfile.deleteMany({ where: { id: ownerId } });
  await db.$disconnect();
});

describe("POST /api/org/roles — description contract", () => {
  it("description: null (what the form sends when empty) → 201", async () => {
    const res = await post({ name: "Auditor", key: `${P}-auditor`, description: null });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.key).toBe(`${P}-auditor`);
    expect(json.data.description).toBeNull();
  });

  it("description omitted → 201", async () => {
    const res = await post({ name: "Omitted", key: `${P}-omitted` });
    expect(res.status).toBe(201);
  });

  it("description string → 201 and persists", async () => {
    const res = await post({ name: "Described", key: `${P}-described`, description: "audits things" });
    expect(res.status).toBe(201);
    expect((await res.json()).data.description).toBe("audits things");
  });

  it("created roles are visible to the list GET (same tenant context)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const keys = ((await res.json()).data.roles as { key: string }[]).map((r) => r.key);
    expect(keys).toEqual(
      expect.arrayContaining([`${P}-auditor`, `${P}-omitted`, `${P}-described`]),
    );
  });

  it("description > 1000 chars still 400 with fieldErrors", async () => {
    const res = await post({ name: "Long", key: `${P}-long`, description: "x".repeat(1001) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.fieldErrors.description).toBeDefined();
  });

  it("non-kebab key still 400 with fieldErrors (modal-surfaced shape)", async () => {
    const res = await post({ name: "Bad Key", key: "Not Kebab", description: null });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.fieldErrors.key).toBeDefined();
  });
});
