import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/lib/tenant/get-org-from-request", () => ({ getOrgIdFromRequest: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketplaceSection: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    marketplaceSectionScope: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { GET, PATCH, DELETE } from "../route";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { prisma } from "@/lib/prisma";

const mockGuard = vi.mocked(requireSuperAdmin);
const mockOrgId = vi.mocked(getOrgIdFromRequest);
const mockFindUnique = vi.mocked(prisma.marketplaceSection.findUnique);
const mockFindOrThrow = vi.mocked(prisma.marketplaceSection.findUniqueOrThrow);
const mockUpdate = vi.mocked(prisma.marketplaceSection.update);
const mockDelete = vi.mocked(prisma.marketplaceSection.delete);
const scope = prisma.marketplaceSectionScope;
const mockScopeFindMany = vi.mocked(scope.findMany);
const mockScopeCreate = vi.mocked(scope.create);
const mockScopeUpdate = vi.mocked(scope.update);
const mockScopeDeleteMany = vi.mocked(scope.deleteMany);

const SESSION = { user: { id: "u1" } } as never;
const params = Promise.resolve({ id: "sec-1" });

function req(method: string, body?: unknown) {
  return new Request("http://localhost/api/marketplace/sections/sec-1", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue(SESSION);
  mockOrgId.mockResolvedValue("org-1");
  mockUpdate.mockResolvedValue({ id: "sec-1" } as never);
  mockFindOrThrow.mockResolvedValue({ id: "sec-1", slug: "s", scopes: [] } as never);
  mockScopeFindMany.mockResolvedValue([] as never);
});

describe("GET /api/marketplace/sections/[id] (read — host-scoped)", () => {
  it("returns the section with scopes", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "sec-1", scopes: [] } as never);
    const res = await GET(req("GET"), { params });
    expect(res.status).toBe(200);
    expect(mockGuard).not.toHaveBeenCalled();
  });

  it("404 when the section is missing (or hidden by RLS / no org)", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await GET(req("GET"), { params });
    expect(res.status).toBe(404);
  });

  it("404 when the host has no org", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await GET(req("GET"), { params });
    expect(res.status).toBe(404);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/marketplace/sections/[id] — guard + tenant scoping + scope diff", () => {
  it("returns the guard Response when not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await PATCH(req("PATCH", { name: "X" }), { params });
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("400 when the host has no org", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await PATCH(req("PATCH", { name: "X" }), { params });
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("reconciles scopes via a diff — create new, update changed, delete absent, leave unchanged", async () => {
    mockScopeFindMany.mockResolvedValueOnce([
      // unchanged → must NOT be updated (no PK churn)
      { id: "e1", blockName: "products", scopeType: "ALL", scopeValue: null, sortOrder: 0, allowedProfileTypeIds: [], allowedRoleIds: [] },
      // same identity, sortOrder changes → update
      { id: "e2", blockName: "products", scopeType: "CATEGORY", scopeValue: "supplements", sortOrder: 1, allowedProfileTypeIds: [], allowedRoleIds: [] },
      // absent from payload → delete
      { id: "e3", blockName: "agents", scopeType: "ALL", scopeValue: null, sortOrder: 2, allowedProfileTypeIds: [], allowedRoleIds: [] },
    ] as never);

    const res = await PATCH(
      req("PATCH", {
        name: "Renamed",
        scopes: [
          { blockName: "products", scopeType: "ALL" }, // idx 0 → sortOrder 0 == e1, unchanged
          { blockName: "products", scopeType: "CATEGORY", scopeValue: "supplements", sortOrder: 5 }, // e2 changed
          { blockName: "products", scopeType: "ITEM", scopeValue: "xyz" }, // new
        ],
      }),
      { params }
    );
    expect(res.status).toBe(200);

    // create: only the brand-new ITEM scope, stamped with the host tenantId
    expect(mockScopeCreate).toHaveBeenCalledTimes(1);
    expect(mockScopeCreate.mock.calls[0][0].data).toMatchObject({
      tenantId: "org-1",
      sectionId: "sec-1",
      scopeType: "ITEM",
      scopeValue: "xyz",
    });
    // update: only the changed e2 (unchanged e1 left alone)
    expect(mockScopeUpdate).toHaveBeenCalledTimes(1);
    expect(mockScopeUpdate.mock.calls[0][0].where).toEqual({ id: "e2" });
    // delete: only the absent e3 — never a blanket sectionId wipe
    expect(mockScopeDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ["e3"] } } });
  });

  it("a PATCH that OMITS scopes PRESERVES them (no scope ops at all)", async () => {
    const res = await PATCH(req("PATCH", { name: "OnlyName" }), { params });
    expect(res.status).toBe(200);
    expect(mockScopeFindMany).not.toHaveBeenCalled();
    expect(mockScopeCreate).not.toHaveBeenCalled();
    expect(mockScopeUpdate).not.toHaveBeenCalled();
    expect(mockScopeDeleteMany).not.toHaveBeenCalled();
  });

  it("a metadata-only PATCH does NOT reset omitted defaulted fields", async () => {
    const res = await PATCH(req("PATCH", { name: "JustRename" }), { params });
    expect(res.status).toBe(200);
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data).toEqual({ name: "JustRename" });
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("blockNames");
    expect(data).not.toHaveProperty("components");
    expect(data).not.toHaveProperty("creationPath");
  });
});

describe("DELETE /api/marketplace/sections/[id] — guard + tenant scoping", () => {
  it("returns the guard Response when not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("nope", { status: 403 }) as never);
    const res = await DELETE(req("DELETE"), { params });
    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("400 when the host has no org", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await DELETE(req("DELETE"), { params });
    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("404 when the section is missing (or hidden by RLS)", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await DELETE(req("DELETE"), { params });
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes when super-admin and the section exists", async () => {
    mockFindUnique.mockResolvedValueOnce({ slug: "s" } as never);
    mockDelete.mockResolvedValueOnce({} as never);
    const res = await DELETE(req("DELETE"), { params });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "sec-1" } });
  });
});
