import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationInvitation: {
      findUnique: vi.fn(),
    },
  },
}));

const { GET } = await import("../route");
const { prisma } = await import("@/lib/prisma");
const mockFindUnique = vi.mocked(prisma.organizationInvitation.findUnique);

function makeParams(token: string) {
  return { params: Promise.resolve({ token }) };
}

describe("GET /api/org/invitations/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when token not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request("http://localhost/api/org/invitations/bad-token");
    const res = await GET(req, makeParams("bad-token"));
    expect(res.status).toBe(404);
  });

  it("returns 200 with invitation + expired:false for valid non-expired", async () => {
    mockFindUnique.mockResolvedValue({
      id: "inv-1",
      token: "tok",
      email: "a@b.com",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      organization: { id: "org-1", name: "Acme", subdomain: "acme" },
    } as never);

    const req = new Request("http://localhost/api/org/invitations/tok");
    const res = await GET(req, makeParams("tok"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.expired).toBe(false);
    expect(body.data.invitation.email).toBe("a@b.com");
  });

  it("returns 200 with expired:true for expired invitation", async () => {
    mockFindUnique.mockResolvedValue({
      id: "inv-2",
      token: "old-tok",
      email: "b@c.com",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
      organization: { id: "org-1", name: "Acme", subdomain: "acme" },
    } as never);

    const req = new Request("http://localhost/api/org/invitations/old-tok");
    const res = await GET(req, makeParams("old-tok"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.expired).toBe(true);
  });
});
