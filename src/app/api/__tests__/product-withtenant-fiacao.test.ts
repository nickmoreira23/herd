import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// L1a.2 — fiação tests. These assert the WIRING (withTenant is invoked with the
// org resolved from the right source; create sets tenant_id), NOT row-level
// isolation — Product is not in TENANT_SCOPED_MODELS until L1a.3, so the real
// filtering is exercised there. Here withTenant is mocked to capture its arg
// and run the callback.

const tenantCalls: string[] = [];

vi.mock("@/lib/tenancy/context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: () => unknown) => {
    tenantCalls.push(tenantId);
    return fn();
  }),
}));

vi.mock("@/lib/tenant/get-org-from-request", () => ({
  getOrgIdFromRequest: vi.fn(async () => "org-1"),
}));

vi.mock("@/lib/permissions", () => ({
  // Writers gate on requireOrgRole; return a session (not a Response) so the
  // handler proceeds to the withTenant/create path.
  requireOrgRole: vi.fn(async () => ({
    user: { id: "p1", activeOrgId: "org-1" },
  })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async (args: unknown) => ({ id: "new", ...(args as { data: object }).data })),
    },
  },
}));

// api-utils: keep real apiSuccess/apiError, stub parseAndValidate to a valid product.
vi.mock("@/lib/api-utils", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-utils")>();
  return {
    ...actual,
    parseAndValidate: vi.fn(async () => ({
      data: {
        name: "Test",
        sku: "SKU-1",
        category: "SUPPLEMENT",
        retailPrice: 10,
        costOfGoods: 3,
      },
    })),
  };
});

const { getOrgIdFromRequest } = await import("@/lib/tenant/get-org-from-request");
const { prisma } = await import("@/lib/prisma");

function makeReq(url = "http://app.localhost/api/products") {
  return new Request(url, { method: "POST", body: JSON.stringify({}) });
}

beforeEach(() => {
  tenantCalls.length = 0;
  vi.clearAllMocks();
  vi.mocked(getOrgIdFromRequest).mockResolvedValue("org-1");
});

describe("L1a.2 fiação — readers run under withTenant(host org)", () => {
  it("GET /api/products wraps the read in withTenant('org-1')", async () => {
    const { GET } = await import("../products/route");
    const res = await GET(new NextRequest("http://app.localhost/api/products"));
    expect(res.status).toBe(200);
    expect(tenantCalls).toContain("org-1");
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it("GET /api/products returns empty (no withTenant) when no host org", async () => {
    vi.mocked(getOrgIdFromRequest).mockResolvedValue(null);
    const { GET } = await import("../products/route");
    const res = await GET(new NextRequest("http://app.localhost/api/products"));
    expect(res.status).toBe(200);
    expect(tenantCalls).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/products/categories wraps the read in withTenant('org-1')", async () => {
    const { GET } = await import("../products/categories/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(tenantCalls).toContain("org-1");
  });
});

describe("L1a.2 fiação — writer sets tenant_id under withTenant", () => {
  it("POST /api/products runs under withTenant and create sets tenantId", async () => {
    const { POST } = await import("../products/route");
    const res = await POST(makeReq() as never);
    expect(res.status).toBe(201);
    expect(tenantCalls).toContain("org-1");
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: { tenantId?: string };
    };
    expect(arg.data.tenantId).toBe("org-1");
  });
});

describe("L1a.2 fiação — plan-agent search_products runs under withTenant", () => {
  it("handleSearchProducts wraps the catalog read in withTenant('org-1')", async () => {
    const { handlePlanAgentToolCall } = await import(
      "@/lib/agents/handlers/plan-agent"
    );
    const send = vi.fn();
    await handlePlanAgentToolCall("search_products", {}, send, [], false);
    expect(tenantCalls).toContain("org-1");
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});
