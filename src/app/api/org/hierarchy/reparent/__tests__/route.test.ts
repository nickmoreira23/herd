import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({
  requireOrgRole: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Keep the real OrgCycleError (for instanceof in the route) but stub assertNoCycle.
vi.mock("@/lib/org-hierarchy", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/org-hierarchy")>();
  return { ...actual, assertNoCycle: vi.fn() };
});

import { PATCH } from "../route";
import { requireOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertNoCycle, OrgCycleError } from "@/lib/org-hierarchy";

const mockRequire = vi.mocked(requireOrgRole);
const mockFindUnique = vi.mocked(prisma.organization.findUnique);
const mockUpdate = vi.mocked(prisma.organization.update);
const mockAssertNoCycle = vi.mocked(assertNoCycle);

const SESSION = { user: { id: "u1", activeOrgId: "active" } } as never;

function req(body: unknown) {
  return new Request("http://localhost/api/org/hierarchy/reparent", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequire.mockResolvedValue(SESSION);
});

describe("PATCH /api/org/hierarchy/reparent", () => {
  it("returns the gate Response when unauthorized", async () => {
    mockRequire.mockResolvedValue(new Response("nope", { status: 403 }));
    const res = await PATCH(req({ orgId: "A", newParentId: "B" }));
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("400 when orgId missing", async () => {
    const res = await PATCH(req({ newParentId: "B" }));
    expect(res.status).toBe(400);
  });

  it("404 when org not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await PATCH(req({ orgId: "A", newParentId: "B" }));
    expect(res.status).toBe(404);
  });

  it("400 when new parent not found", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "A" } as never) // org exists
      .mockResolvedValueOnce(null as never); // parent missing
    const res = await PATCH(req({ orgId: "A", newParentId: "ghost" }));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("400 with clear message when assertNoCycle throws (self-ref / cycle / descendant)", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "A" } as never)
      .mockResolvedValueOnce({ id: "C" } as never);
    mockAssertNoCycle.mockRejectedValueOnce(
      new OrgCycleError("Cannot reparent an organization under one of its own descendants.")
    );
    const res = await PATCH(req({ orgId: "A", newParentId: "C" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("descendant");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("checks anti-cycle BEFORE writing on a valid reparent", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "A" } as never)
      .mockResolvedValueOnce({ id: "B" } as never);
    mockAssertNoCycle.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce({
      id: "A",
      slug: "a",
      name: "A",
      parentOrgId: "B",
    } as never);

    const res = await PATCH(req({ orgId: "A", newParentId: "B" }));

    expect(mockAssertNoCycle).toHaveBeenCalledWith("A", "B");
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("allows promoting to root (newParentId null)", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A" } as never);
    mockAssertNoCycle.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce({
      id: "A",
      slug: "a",
      name: "A",
      parentOrgId: null,
    } as never);

    const res = await PATCH(req({ orgId: "A", newParentId: null }));

    expect(mockAssertNoCycle).toHaveBeenCalledWith("A", null);
    expect(res.status).toBe(200);
  });
});
