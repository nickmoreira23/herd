import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn(), enforceRoute: vi.fn((_s, _p, ctx) => ctx.current) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { organization: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { POST } from "../route";
import { requireOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const mockRequire = vi.mocked(requireOrgRole);
const mockFindUnique = vi.mocked(prisma.organization.findUnique);
const mockUpdate = vi.mocked(prisma.organization.update);

const SESSION = { user: { id: "u1", activeOrgId: "A" } } as never;
const params = Promise.resolve({ id: "A" });
const post = () => POST(new Request("http://localhost/api/org/A/restore", { method: "POST" }), { params });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequire.mockResolvedValue(SESSION);
});

describe("POST /api/org/[id]/restore — ARCHIVED → ACTIVE", () => {
  it("409 when not ARCHIVED", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", status: "ACTIVE" } as never);
    const res = await post();
    expect(res.status).toBe(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("restores and only touches status (never parentOrgId)", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", status: "ARCHIVED" } as never);
    mockUpdate.mockResolvedValueOnce({ id: "A", slug: "a", name: "Acme", status: "ACTIVE" } as never);

    const res = await post();

    expect(res.status).toBe(200);
    const callArg = mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(callArg.data).toEqual({ status: "ACTIVE" });
    expect(callArg.data).not.toHaveProperty("parentOrgId");
  });
});
