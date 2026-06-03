import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/lib/tenant/get-org-from-request", () => ({ getOrgIdFromRequest: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketplaceSection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    marketplaceSectionScope: { createMany: vi.fn() },
  },
}));

import { GET, POST } from "../route";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { prisma } from "@/lib/prisma";

const mockGuard = vi.mocked(requireSuperAdmin);
const mockOrgId = vi.mocked(getOrgIdFromRequest);
const mockFindMany = vi.mocked(prisma.marketplaceSection.findMany);
const mockFindFirst = vi.mocked(prisma.marketplaceSection.findFirst);
const mockCreate = vi.mocked(prisma.marketplaceSection.create);
const mockFindOrThrow = vi.mocked(prisma.marketplaceSection.findUniqueOrThrow);
const mockScopeCreateMany = vi.mocked(prisma.marketplaceSectionScope.createMany);

const SESSION = { user: { id: "u1" } } as never;

function postReq(body: unknown) {
  return new Request("http://localhost/api/marketplace/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue(SESSION);
  mockOrgId.mockResolvedValue("org-1");
});

describe("GET /api/marketplace/sections (read — host-scoped)", () => {
  it("lists the host org's sections (under withTenant)", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "s1", scopes: [] }] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [{ id: "s1", scopes: [] }] });
    // GET is not super-admin guarded in SE3 (deferred to SE4 org-RBAC).
    expect(mockGuard).not.toHaveBeenCalled();
  });

  it("returns an empty list when the host has no org", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [] });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/marketplace/sections — super-admin guard + tenant scoping", () => {
  it("returns the guard Response when caller is not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("forbidden", { status: 403 }) as never);
    const res = await POST(postReq({ slug: "deals", name: "Deals" }));
    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400 when the host has no org (cannot create a section without a tenant)", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await POST(postReq({ slug: "deals", name: "Deals" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a section (+scopes) stamping the host org's tenantId", async () => {
    mockFindFirst.mockResolvedValueOnce(null as never); // no slug clash in-tenant
    mockCreate.mockResolvedValueOnce({ id: "new-1" } as never);
    mockFindOrThrow.mockResolvedValueOnce({ id: "new-1", scopes: [] } as never);

    const res = await POST(
      postReq({
        slug: "deals",
        name: "Deals",
        scopes: [{ blockName: "products", scopeType: "ALL" }],
      })
    );
    expect(res.status).toBe(201);
    // tenantId stamped from the host org on both the section and its scopes.
    expect(mockCreate.mock.calls[0][0].data).toMatchObject({ tenantId: "org-1", slug: "deals" });
    expect(mockScopeCreateMany).toHaveBeenCalled();
    const scopeData = (mockScopeCreateMany.mock.calls[0]?.[0]?.data ?? []) as Array<
      Record<string, unknown>
    >;
    expect(scopeData[0]).toMatchObject({ tenantId: "org-1", sectionId: "new-1" });
  });

  it("rejects a duplicate slug (within the tenant) with 409", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "existing" } as never);
    const res = await POST(postReq({ slug: "deals", name: "Deals" }));
    expect(res.status).toBe(409);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid body (validation) with 400", async () => {
    const res = await POST(postReq({ slug: "deals" })); // missing `name`
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
