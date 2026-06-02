import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * V2.3.5 — shadow observation across the 24 previously-uncovered call-sites.
 *
 * Goal is AUTHZ observation, not feature coverage (decision 5): each test calls
 * a handler as an actor that PASSES requireOrgRole (so enforceRoute runs and
 * emits a `[can-shadow]` log) and asserts the gate let it through (status not
 * 401/403). The agree:true/false verdict is read by scraping the suite run
 * under `CAN_ENFORCEMENT=shadow ... --disable-console-intercept` (Tarefa 2).
 * Tests are env-agnostic: identical pass/fail in off and shadow (shadow never
 * changes the response).
 *
 * Deny cases document the structural limit: actors requireOrgRole rejects never
 * reach enforceRoute, so no shadow log is emitted for them.
 */

const mockState = vi.hoisted(() => ({
  actorId: "",
  isSuperAdmin: false,
  orgId: "",
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: mockState.actorId, isSuperAdmin: mockState.isSuperAdmin },
  })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const h = new Headers();
    if (mockState.orgId) h.set("x-org-id", mockState.orgId);
    return h;
  }),
}));

import { GET as hierarchyGet } from "../org/hierarchy/route";
import { PATCH as reparentPatch } from "../org/hierarchy/reparent/route";
import { GET as orgChartGet } from "../org-chart/internal/route";
import { POST as vertDeptPost } from "../org/[id]/departments/route";
import { DELETE as vertDeptDelete } from "../org/[id]/departments/[deptId]/route";
import { GET as deptListGet, POST as deptPost } from "../departments/route";
import { GET as deptTreeGet } from "../departments/tree/route";
import {
  GET as deptGet,
  PATCH as deptPatch,
  DELETE as deptDelete,
} from "../departments/[id]/route";
import {
  POST as deptMemberPost,
  DELETE as deptMemberDelete,
} from "../departments/[id]/members/route";
import { GET as locListGet, POST as locPost } from "../locations/route";
import {
  GET as locGet,
  PATCH as locPatch,
  DELETE as locDelete,
} from "../locations/[id]/route";
import { POST as invPost, GET as invGet } from "../org/invitations/route";
import { POST as revokePost } from "../org/invitations/[token]/revoke/route";
import { DELETE as orgDelete } from "../org/[id]/route";
import { POST as restorePost } from "../org/[id]/restore/route";
import { POST as dissolvePost } from "../org/[id]/dissolve/route";

const db = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

const PREFIX = `test-shadow-obs-${Date.now()}`;
const RANDOM_UUID = "00000000-0000-4000-8000-000000000000";
const orgIds: string[] = [];
const profileIds: string[] = [];

let orgId = "";
let deptId = "";
let ownerId = "";
let memberId = "";
let deptHeadId = "";

function actAs(actorId: string, isSuperAdmin = false) {
  mockState.actorId = actorId;
  mockState.isSuperAdmin = isSuperAdmin;
  mockState.orgId = orgId;
}

function req(method: string, body?: unknown): Request {
  return new Request("http://test.local/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const params = <T>(o: T) => Promise.resolve(o);

/**
 * Allow-actor assertion. For an OWNER actor, requireOrgRole always passes
 * (cross-checked: OWNER holds every grant), so enforceRoute always runs and
 * logs. The handler then completes with whatever business status (200/400/404/
 * 409/500/business-403). We only assert it RAN to a Response and was not an
 * auth-401; the agree verdict is read from the shadow-run scrape (Tarefa 2).
 */
function gatePassed(res: Response) {
  expect(res).toBeInstanceOf(Response);
  expect(res.status).not.toBe(401);
}

async function seedMember(role: string, scopeId?: string): Promise<string> {
  const profile = await db.networkProfile.create({
    data: {
      firstName: "Shadow",
      lastName: "Obs",
      email: `${PREFIX}-${Math.random().toString(36).slice(2, 9)}@ex.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  profileIds.push(profile.id);
  await db.organizationMember.create({
    data: {
      organizationId: orgId,
      networkProfileId: profile.id,
      status: "ACTIVE",
      roles: {
        create: {
          role: role as never,
          scopeType: scopeId ? "DEPARTMENT" : "ORG",
          scopeId: scopeId ?? null,
        },
      },
    },
  });
  return profile.id;
}

beforeAll(async () => {
  const org = await db.organization.create({
    data: { slug: PREFIX, subdomain: PREFIX, name: "Shadow Obs Org" },
    select: { id: true },
  });
  orgId = org.id;
  orgIds.push(org.id);

  const dept = await db.department.create({
    data: { tenantId: orgId, name: "Obs Dept", slug: `${PREFIX}-dept` },
    select: { id: true },
  });
  deptId = dept.id;

  ownerId = await seedMember("OWNER");
  memberId = await seedMember("MEMBER");
  deptHeadId = await seedMember("DEPARTMENT_HEAD", deptId);
});

afterAll(async () => {
  if (orgIds.length)
    await db.organization.deleteMany({ where: { id: { in: orgIds } } });
  if (profileIds.length)
    await db.networkProfile.deleteMany({ where: { id: { in: profileIds } } });
  await db.$disconnect();
});

describe("shadow observation — allow actors reach enforceRoute (5 resources)", () => {
  // org_hierarchy
  it("GET /api/org/hierarchy", async () => {
    actAs(ownerId);
    gatePassed(await hierarchyGet());
  });
  it("PATCH /api/org/hierarchy/reparent", async () => {
    actAs(ownerId);
    gatePassed(await reparentPatch(req("PATCH")));
  });
  it("GET /api/org-chart/internal", async () => {
    actAs(ownerId);
    gatePassed(await orgChartGet());
  });

  // departments
  it("POST /api/org/[id]/departments (vertical)", async () => {
    actAs(ownerId);
    gatePassed(await vertDeptPost(req("POST"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("DELETE /api/org/[id]/departments/[deptId] (vertical)", async () => {
    actAs(ownerId);
    gatePassed(
      await vertDeptDelete(req("DELETE"), {
        params: params({ id: RANDOM_UUID, deptId: RANDOM_UUID }),
      })
    );
  });
  it("GET /api/departments", async () => {
    actAs(ownerId);
    gatePassed(await deptListGet());
  });
  it("POST /api/departments", async () => {
    actAs(ownerId);
    gatePassed(await deptPost(req("POST")));
  });
  it("GET /api/departments/tree", async () => {
    actAs(ownerId);
    gatePassed(await deptTreeGet());
  });
  it("GET /api/departments/[id]", async () => {
    actAs(ownerId);
    gatePassed(await deptGet(req("GET"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("PATCH /api/departments/[id]", async () => {
    actAs(ownerId);
    gatePassed(await deptPatch(req("PATCH"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("DELETE /api/departments/[id]", async () => {
    actAs(ownerId);
    gatePassed(await deptDelete(req("DELETE"), { params: params({ id: RANDOM_UUID }) }));
  });

  // departments — dept-scoped (scopeId in the shadow log = real dept id)
  it("POST /api/departments/[id]/members (dept-scoped)", async () => {
    actAs(ownerId);
    gatePassed(await deptMemberPost(req("POST"), { params: params({ id: deptId }) }));
  });
  it("DELETE /api/departments/[id]/members (dept-scoped)", async () => {
    actAs(ownerId);
    gatePassed(await deptMemberDelete(req("DELETE"), { params: params({ id: deptId }) }));
  });

  // locations
  it("GET /api/locations", async () => {
    actAs(ownerId);
    gatePassed(await locListGet(req("GET")));
  });
  it("POST /api/locations", async () => {
    actAs(ownerId);
    gatePassed(await locPost(req("POST")));
  });
  it("GET /api/locations/[id]", async () => {
    actAs(ownerId);
    gatePassed(await locGet(req("GET"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("PATCH /api/locations/[id]", async () => {
    actAs(ownerId);
    gatePassed(await locPatch(req("PATCH"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("DELETE /api/locations/[id]", async () => {
    actAs(ownerId);
    gatePassed(await locDelete(req("DELETE"), { params: params({ id: RANDOM_UUID }) }));
  });

  // members / invitations
  it("POST /api/org/invitations", async () => {
    actAs(ownerId);
    gatePassed(await invPost(req("POST", { email: `${PREFIX}-inv@ex.com` })));
  });
  it("GET /api/org/invitations", async () => {
    actAs(ownerId);
    gatePassed(await invGet(req("GET")));
  });
  it("POST /api/org/invitations/[token]/revoke", async () => {
    actAs(ownerId);
    gatePassed(await revokePost(req("POST"), { params: params({ token: RANDOM_UUID }) }));
  });

  // org lifecycle (random id → 404 after the shadow log; no fixture mutation)
  it("DELETE /api/org/[id]", async () => {
    actAs(ownerId);
    gatePassed(await orgDelete(req("DELETE", { confirmName: "x" }), { params: params({ id: RANDOM_UUID }) }));
  });
  it("POST /api/org/[id]/restore", async () => {
    actAs(ownerId);
    gatePassed(await restorePost(req("POST"), { params: params({ id: RANDOM_UUID }) }));
  });
  it("POST /api/org/[id]/dissolve", async () => {
    actAs(ownerId);
    gatePassed(await dissolvePost(req("POST"), { params: params({ id: RANDOM_UUID }) }));
  });
});

describe("shadow observation — deny actors are filtered BEFORE enforceRoute", () => {
  it("MEMBER on POST /api/departments → 403 (no shadow log emitted)", async () => {
    actAs(memberId);
    const res = await deptPost(req("POST"));
    expect(res.status).toBe(403);
  });
  it("DEPARTMENT_HEAD on POST /api/departments/[id]/members → 403 (dept role not in [O,A]; never reaches scopeId check)", async () => {
    actAs(deptHeadId);
    const res = await deptMemberPost(req("POST"), { params: params({ id: deptId }) });
    expect(res.status).toBe(403);
  });
});
