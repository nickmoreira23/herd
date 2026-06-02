import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketplaceSection: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { GET, POST } from "../route";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { prisma } from "@/lib/prisma";

const mockGuard = vi.mocked(requireSuperAdmin);
const mockFindMany = vi.mocked(prisma.marketplaceSection.findMany);
const mockFindUnique = vi.mocked(prisma.marketplaceSection.findUnique);
const mockTx = vi.mocked(prisma.$transaction);

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
});

describe("GET /api/marketplace/sections (read — no guard)", () => {
  it("lists sections with scopes, no auth required", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "s1", scopes: [] }] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [{ id: "s1", scopes: [] }] });
    // GET is intentionally NOT guarded in SE1 (deferred to SE4 org-RBAC).
    expect(mockGuard).not.toHaveBeenCalled();
  });
});

describe("POST /api/marketplace/sections — super-admin guard (SE1 baseline)", () => {
  it("returns the guard Response when caller is not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("forbidden", { status: 403 }) as never);
    const res = await POST(postReq({ slug: "deals", name: "Deals" }));
    expect(res.status).toBe(403);
    expect(mockTx).not.toHaveBeenCalled();
  });

  it("creates a section (+scopes) in a transaction when super-admin", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never); // no slug clash
    const tx = {
      marketplaceSection: {
        create: vi.fn().mockResolvedValue({ id: "new-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "new-1", scopes: [] }),
      },
      marketplaceSectionScope: { createMany: vi.fn() },
    };
    mockTx.mockImplementationOnce(((cb: (t: typeof tx) => unknown) => cb(tx)) as never);

    const res = await POST(
      postReq({
        slug: "deals",
        name: "Deals",
        scopes: [{ blockName: "products", scopeType: "ALL" }],
      })
    );
    expect(res.status).toBe(201);
    expect(tx.marketplaceSection.create).toHaveBeenCalled();
    expect(tx.marketplaceSectionScope.createMany).toHaveBeenCalled();
  });

  it("rejects a duplicate slug with 409", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "existing" } as never);
    const res = await POST(postReq({ slug: "deals", name: "Deals" }));
    expect(res.status).toBe(409);
    expect(mockTx).not.toHaveBeenCalled();
  });

  it("rejects an invalid body (validation) with 400", async () => {
    // missing required `name`
    const res = await POST(postReq({ slug: "deals" }));
    expect(res.status).toBe(400);
    expect(mockTx).not.toHaveBeenCalled();
  });
});
