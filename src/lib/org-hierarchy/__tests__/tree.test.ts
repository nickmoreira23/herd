import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { getDescendants, getAncestors, assertNoCycle } from "../tree";
import { OrgCycleError, type OrgTreeNode } from "../types";
import { prisma } from "@/lib/prisma";

const mockQueryRaw = vi.mocked(prisma.$queryRaw);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDescendants", () => {
  it("returns descendants of a linear tree (A→B→C)", async () => {
    const rows: OrgTreeNode[] = [
      { id: "B", slug: "b", name: "B", parentOrgId: "A", depth: 1 },
      { id: "C", slug: "c", name: "C", parentOrgId: "B", depth: 2 },
    ];
    mockQueryRaw.mockResolvedValueOnce(rows as never);

    const result = await getDescendants("A");

    expect(result).toEqual(rows);
    expect(mockQueryRaw).toHaveBeenCalledOnce();
  });

  it("returns descendants of a branched tree (A→{B,C}, B→D)", async () => {
    const rows: OrgTreeNode[] = [
      { id: "B", slug: "b", name: "B", parentOrgId: "A", depth: 1 },
      { id: "C", slug: "c", name: "C", parentOrgId: "A", depth: 1 },
      { id: "D", slug: "d", name: "D", parentOrgId: "B", depth: 2 },
    ];
    mockQueryRaw.mockResolvedValueOnce(rows as never);

    const result = await getDescendants("A");

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual(["B", "C", "D"]);
  });

  it("returns empty for a leaf org", async () => {
    mockQueryRaw.mockResolvedValueOnce([] as never);
    expect(await getDescendants("leaf")).toEqual([]);
  });

  it("interpolates the orgId into the parameterized query", async () => {
    mockQueryRaw.mockResolvedValueOnce([] as never);
    await getDescendants("org-123");
    // Tagged-template call: first arg is the strings array, rest are the values.
    const values = mockQueryRaw.mock.calls[0].slice(1);
    expect(values).toContain("org-123");
  });
});

describe("getAncestors", () => {
  it("returns the ancestor chain nearest-first", async () => {
    const rows: OrgTreeNode[] = [
      { id: "B", slug: "b", name: "B", parentOrgId: "A", depth: 1 },
      { id: "A", slug: "a", name: "A", parentOrgId: null, depth: 2 },
    ];
    mockQueryRaw.mockResolvedValueOnce(rows as never);

    const result = await getAncestors("C");

    expect(result.map((r) => r.id)).toEqual(["B", "A"]);
    expect(result[result.length - 1].parentOrgId).toBeNull();
  });

  it("returns empty for a root org", async () => {
    mockQueryRaw.mockResolvedValueOnce([] as never);
    expect(await getAncestors("root")).toEqual([]);
  });
});

describe("assertNoCycle", () => {
  it("allows promoting to root (newParentId = null) without querying", async () => {
    await expect(assertNoCycle("A", null)).resolves.toBeUndefined();
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("rejects self-reference without querying", async () => {
    await expect(assertNoCycle("A", "A")).rejects.toBeInstanceOf(OrgCycleError);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it("rejects moving under one of its own descendants", async () => {
    // newParentId "C" is found in descendants(A) → cycle.
    mockQueryRaw.mockResolvedValueOnce([{ hit: 1 }] as never);
    await expect(assertNoCycle("A", "C")).rejects.toBeInstanceOf(OrgCycleError);
  });

  it("allows a valid reparent (target not a descendant)", async () => {
    mockQueryRaw.mockResolvedValueOnce([] as never);
    await expect(assertNoCycle("A", "unrelated")).resolves.toBeUndefined();
  });
});
