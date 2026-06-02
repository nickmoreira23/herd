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

  // Build a transaction-client mock exposing the scope ops the diff uses.
  function makeTx(existingScopes: unknown[] = []) {
    const tx = {
      marketplaceSection: {
        update: vi.fn().mockResolvedValue({ id: "sec-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "sec-1", slug: "s", scopes: [] }),
      },
      marketplaceSectionScope: {
        findMany: vi.fn().mockResolvedValue(existingScopes),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    mockTx.mockImplementationOnce(((cb: (t: typeof tx) => unknown) => cb(tx)) as never);
    return tx;
  }

  it("CORRECT (SE2.5): reconciles scopes via a diff — create new, update changed, delete absent, leave unchanged", async () => {
    // Was the SE2 'BASELINE: replaces ALL scopes' test. Replace-total is gone.
    const existing = [
      // unchanged → must NOT be updated (no PK churn)
      { id: "e1", blockName: "products", scopeType: "ALL", scopeValue: null, sortOrder: 0, allowedProfileTypeIds: [], allowedRoleIds: [] },
      // same identity, sortOrder changes → update
      { id: "e2", blockName: "products", scopeType: "CATEGORY", scopeValue: "supplements", sortOrder: 1, allowedProfileTypeIds: [], allowedRoleIds: [] },
      // absent from payload → delete
      { id: "e3", blockName: "agents", scopeType: "ALL", scopeValue: null, sortOrder: 2, allowedProfileTypeIds: [], allowedRoleIds: [] },
    ];
    const tx = makeTx(existing);

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

    // create: only the brand-new ITEM scope
    expect(tx.marketplaceSectionScope.create).toHaveBeenCalledTimes(1);
    expect(tx.marketplaceSectionScope.create.mock.calls[0][0].data).toMatchObject({
      sectionId: "sec-1",
      scopeType: "ITEM",
      scopeValue: "xyz",
    });
    // update: only the changed e2 (unchanged e1 left alone)
    expect(tx.marketplaceSectionScope.update).toHaveBeenCalledTimes(1);
    expect(tx.marketplaceSectionScope.update.mock.calls[0][0].where).toEqual({ id: "e2" });
    // delete: only the absent e3 — never a blanket sectionId wipe
    expect(tx.marketplaceSectionScope.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["e3"] } },
    });
  });

  it("CORRECT (SE2.5): a PATCH that OMITS scopes PRESERVES them (no scope ops at all)", async () => {
    // Was the SE2 'LATENT BUG' baseline. The update schema no longer defaults
    // scopes to [], so result.data.scopes is undefined and the block is skipped.
    const tx = makeTx([{ id: "e1", blockName: "products", scopeType: "ALL", scopeValue: null, sortOrder: 0, allowedProfileTypeIds: [], allowedRoleIds: [] }]);
    const res = await PATCH(req("PATCH", { name: "OnlyName" }), { params });
    expect(res.status).toBe(200);
    expect(tx.marketplaceSectionScope.findMany).not.toHaveBeenCalled();
    expect(tx.marketplaceSectionScope.create).not.toHaveBeenCalled();
    expect(tx.marketplaceSectionScope.update).not.toHaveBeenCalled();
    expect(tx.marketplaceSectionScope.deleteMany).not.toHaveBeenCalled();
  });

  it("CORRECT (SE2.5): a metadata-only PATCH does NOT reset omitted defaulted fields", async () => {
    // Root-cause guard: .partial() used to leak .default() so an omitted
    // status/blockNames/components/creationPath got reset/wiped. The update
    // schema now drops those defaults → the handler's `!== undefined` guards
    // skip them entirely.
    const tx = makeTx([]);
    const res = await PATCH(req("PATCH", { name: "JustRename" }), { params });
    expect(res.status).toBe(200);
    const data = tx.marketplaceSection.update.mock.calls[0][0].data;
    expect(data).toEqual({ name: "JustRename" });
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("blockNames");
    expect(data).not.toHaveProperty("components");
    expect(data).not.toHaveProperty("creationPath");
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
