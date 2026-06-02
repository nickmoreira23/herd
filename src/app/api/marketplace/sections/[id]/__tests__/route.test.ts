import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketplaceSection: { findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { GET, PATCH, DELETE } from "../route";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { prisma } from "@/lib/prisma";

const mockGuard = vi.mocked(requireSuperAdmin);
const mockFindUnique = vi.mocked(prisma.marketplaceSection.findUnique);
const mockDelete = vi.mocked(prisma.marketplaceSection.delete);
const mockTx = vi.mocked(prisma.$transaction);

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
});

describe("GET /api/marketplace/sections/[id] (read — no guard)", () => {
  it("returns the section with scopes", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "sec-1", scopes: [] } as never);
    const res = await GET(req("GET"), { params });
    expect(res.status).toBe(200);
    expect(mockGuard).not.toHaveBeenCalled();
  });

  it("404 when the section is missing", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await GET(req("GET"), { params });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/marketplace/sections/[id] — guard + scope replace-total", () => {
  it("returns the guard Response when not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await PATCH(req("PATCH", { name: "X" }), { params });
    expect(res.status).toBe(401);
    expect(mockTx).not.toHaveBeenCalled();
  });

  it("BASELINE: replaces ALL scopes (deleteMany + createMany) — changes to a diff in SE6", async () => {
    const tx = {
      marketplaceSection: {
        update: vi.fn().mockResolvedValue({ id: "sec-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "sec-1", slug: "s", scopes: [] }),
      },
      marketplaceSectionScope: { deleteMany: vi.fn(), createMany: vi.fn() },
    };
    mockTx.mockImplementationOnce(((cb: (t: typeof tx) => unknown) => cb(tx)) as never);

    const res = await PATCH(
      req("PATCH", {
        name: "Renamed",
        scopes: [{ blockName: "products", scopeType: "ALL" }],
      }),
      { params }
    );
    expect(res.status).toBe(200);
    // The current MVP wipes every scope then recreates — captured as baseline.
    expect(tx.marketplaceSectionScope.deleteMany).toHaveBeenCalledWith({
      where: { sectionId: "sec-1" },
    });
    expect(tx.marketplaceSectionScope.createMany).toHaveBeenCalled();
    const deleteOrder = tx.marketplaceSectionScope.deleteMany.mock.invocationCallOrder[0];
    const createOrder = tx.marketplaceSectionScope.createMany.mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it("BASELINE (LATENT BUG): a PATCH that OMITS scopes STILL wipes them", async () => {
    // DISCOVERED DURING SE2 — report, do not fix here:
    // updateSectionSchema = createSectionSchema.partial(), but the `scopes`
    // field carries .default([]). At runtime result.data.scopes resolves to
    // [] (defined, not undefined) even when the caller omits it, so the
    // `scopes !== undefined` branch runs: deleteMany wipes ALL scopes and
    // createMany is skipped (length 0). Net effect: ANY metadata-only PATCH
    // (e.g. a rename) silently deletes every scope on the section. This is
    // worse than the known replace-total issue and should be fixed in SE6.
    const tx = {
      marketplaceSection: {
        update: vi.fn().mockResolvedValue({ id: "sec-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "sec-1", slug: "s", scopes: [] }),
      },
      marketplaceSectionScope: { deleteMany: vi.fn(), createMany: vi.fn() },
    };
    mockTx.mockImplementationOnce(((cb: (t: typeof tx) => unknown) => cb(tx)) as never);
    const res = await PATCH(req("PATCH", { name: "OnlyName" }), { params });
    expect(res.status).toBe(200);
    // Captured as the current (broken) behavior:
    expect(tx.marketplaceSectionScope.deleteMany).toHaveBeenCalledWith({
      where: { sectionId: "sec-1" },
    });
    expect(tx.marketplaceSectionScope.createMany).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/marketplace/sections/[id] — guard", () => {
  it("returns the guard Response when not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("nope", { status: 403 }) as never);
    const res = await DELETE(req("DELETE"), { params });
    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("404 when the section is missing", async () => {
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
