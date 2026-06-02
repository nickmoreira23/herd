import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn(), enforceRoute: vi.fn((_s, _p, ctx) => ctx.current) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findUnique: vi.fn(), update: vi.fn() },
    organizationMember: { count: vi.fn() },
    organizationInvitation: { count: vi.fn() },
  },
}));
vi.mock("@/lib/org-hierarchy", () => ({ getDescendants: vi.fn() }));

import { POST } from "../route";
import { requireOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDescendants } from "@/lib/org-hierarchy";

const mockRequire = vi.mocked(requireOrgRole);
const mockFindUnique = vi.mocked(prisma.organization.findUnique);
const mockUpdate = vi.mocked(prisma.organization.update);
const mockMemberCount = vi.mocked(prisma.organizationMember.count);
const mockInvitationCount = vi.mocked(prisma.organizationInvitation.count);
const mockGetDescendants = vi.mocked(getDescendants);

const SESSION = { user: { id: "u1", activeOrgId: "A" } } as never;
const params = Promise.resolve({ id: "A" });
const post = () => POST(new Request("http://localhost/api/org/A/dissolve", { method: "POST" }), { params });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequire.mockResolvedValue(SESSION);
});

describe("POST /api/org/[id]/dissolve — soft-delete (ARCHIVE)", () => {
  it("returns the gate Response when not OWNER", async () => {
    mockRequire.mockResolvedValue(new Response("nope", { status: 403 }));
    const res = await post();
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("404 when org not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    expect((await post()).status).toBe(404);
  });

  it("409 (idempotency) when already ARCHIVED — no update", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", slug: "a", name: "Acme", status: "ARCHIVED" } as never);
    const res = await post();
    expect(res.status).toBe(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("archives ACTIVE org and returns structural+membership blast radius", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", slug: "a", name: "Acme", status: "ACTIVE" } as never);
    mockGetDescendants.mockResolvedValueOnce([
      { id: "B", slug: "b", name: "B", parentOrgId: "A", depth: 1 },
    ] as never);
    mockMemberCount.mockResolvedValueOnce(5 as never);
    mockInvitationCount.mockResolvedValueOnce(2 as never);
    mockUpdate.mockResolvedValueOnce({ id: "A", slug: "a", name: "Acme", status: "ARCHIVED" } as never);

    const res = await post();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "A" },
      data: { status: "ARCHIVED" },
      select: { id: true, slug: true, name: true, status: true },
    });
    expect(json.data.blastRadius.counts).toEqual({ organizations: 2, members: 5, invitations: 2 });
    expect(json.data.blastRadius.descendants).toHaveLength(1);
    // counts subtree members/invitations across self + descendants
    expect(mockMemberCount).toHaveBeenCalledWith({ where: { organizationId: { in: ["A", "B"] } } });
  });
});
