import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/tenant/get-org-from-request", () => ({ getOrgIdFromRequest: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { marketplaceSection: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/marketplace/visibility-helpers", () => ({ getViewerContext: vi.fn() }));
vi.mock("@/lib/marketplace/render-resolver", () => ({
  resolveItemsPage: vi.fn(),
  INITIAL_ITEMS_PAGE_SIZE: 24,
  MAX_ITEMS_PAGE_SIZE: 48,
}));

import { GET } from "../route";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import { resolveItemsPage } from "@/lib/marketplace/render-resolver";

const mockAuth = vi.mocked(auth);
const mockOrgId = vi.mocked(getOrgIdFromRequest);
const mockFindUnique = vi.mocked(prisma.marketplaceSection.findUnique);
const mockViewer = vi.mocked(getViewerContext);
const mockResolve = vi.mocked(resolveItemsPage);

const params = Promise.resolve({ id: "sec-1" });
const PAGE = { items: [], total: 0, hasMore: false };

function req(qs: string) {
  // The handler reads request.nextUrl.searchParams → needs a NextRequest.
  return new NextRequest(
    `http://localhost/api/marketplace/sections/sec-1/items${qs}`
  ) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "u1" } } as never);
  mockOrgId.mockResolvedValue("org-1");
  mockFindUnique.mockResolvedValue({ id: "sec-1", scopes: [] } as never);
  mockViewer.mockResolvedValue({ profileId: "u1", isSuperAdmin: false, roles: [] });
  mockResolve.mockResolvedValue(PAGE as never);
});

describe("GET /api/marketplace/sections/[id]/items", () => {
  it("400 when `block` query param is absent", async () => {
    const res = await GET(req(""), { params });
    expect(res.status).toBe(400);
  });

  it("404 when the section is missing", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await GET(req("?block=products"), { params });
    expect(res.status).toBe(404);
  });

  it("returns the resolved page and forwards offset/limit/query/filters", async () => {
    const res = await GET(
      req("?block=products&offset=10&limit=12&q=whey&filters=" +
        encodeURIComponent(JSON.stringify({ category: ["supplements"] }))),
      { params }
    );
    expect(res.status).toBe(200);
    expect(mockResolve).toHaveBeenCalledWith(
      expect.anything(),
      "products",
      expect.anything(),
      { offset: 10, limit: 12, query: "whey", filters: { category: ["supplements"] } }
    );
  });

  it("caps an oversized limit at MAX_ITEMS_PAGE_SIZE (48)", async () => {
    await GET(req("?block=products&limit=1000"), { params });
    expect(mockResolve).toHaveBeenCalledWith(
      expect.anything(),
      "products",
      expect.anything(),
      expect.objectContaining({ limit: 48 })
    );
  });

  it("BASELINE: anonymous request still returns 200 at the HANDLER level", async () => {
    // The handler tolerates a null userId by design (public Explore surface).
    // In production, anonymous /api/marketplace/* is blocked by the proxy
    // session gate (→ 401) because it is NOT in PUBLIC_API_MATCHERS. That
    // proxy-level 401 is NOT exercised here (isPublicApiRoute is not exported;
    // unit-testing it would require a production change / new infra). This
    // test pins the contradiction: the handler itself is public-by-design.
    // See Questão Aberta 1 (SE3) — public tenant resolution for /explore.
    mockAuth.mockResolvedValueOnce(null as never);
    const res = await GET(req("?block=products"), { params });
    expect(res.status).toBe(200);
    // Anonymous: getViewerContext is called with (null session, host orgId) →
    // empty roles → only unrestricted scopes match (SE5a internal facet).
    expect(mockViewer).toHaveBeenCalledWith(null, "org-1");
  });

  it("returns an empty page when the host has no org (no storefront)", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await GET(req("?block=products"), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { items: [], total: 0, hasMore: false } });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
