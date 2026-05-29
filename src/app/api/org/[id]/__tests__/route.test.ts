import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

import { DELETE } from "../route";
import { requireOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const mockRequire = vi.mocked(requireOrgRole);
const mockFindUnique = vi.mocked(prisma.organization.findUnique);
const mockDelete = vi.mocked(prisma.organization.delete);

const SESSION = { user: { id: "u1", activeOrgId: "A" } } as never;
const params = Promise.resolve({ id: "A" });

function req(body: unknown) {
  return new Request("http://localhost/api/org/A", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequire.mockResolvedValue(SESSION);
});

describe("DELETE /api/org/[id] — hard-delete, 3 guards", () => {
  it("guard 1: returns the gate Response when not OWNER", async () => {
    mockRequire.mockResolvedValue(new Response("nope", { status: 403 }));
    const res = await DELETE(req({ confirmName: "Acme" }), { params });
    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("404 when org not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const res = await DELETE(req({ confirmName: "Acme" }), { params });
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("guard 2: 409 when status is not ARCHIVED (must dissolve first)", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", name: "Acme", status: "ACTIVE" } as never);
    const res = await DELETE(req({ confirmName: "Acme" }), { params });
    expect(res.status).toBe(409);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("guard 3: 400 when confirmName does not match", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", name: "Acme", status: "ARCHIVED" } as never);
    const res = await DELETE(req({ confirmName: "WRONG" }), { params });
    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("guard 3: 400 when confirmName is missing", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", name: "Acme", status: "ARCHIVED" } as never);
    const res = await DELETE(req({}), { params });
    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes only when all 3 guards pass", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "A", name: "Acme", status: "ARCHIVED" } as never);
    mockDelete.mockResolvedValueOnce({ id: "A" } as never);
    const res = await DELETE(req({ confirmName: "Acme" }), { params });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "A" } });
  });
});
