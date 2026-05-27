import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationMember: {
      findFirst: vi.fn(),
    },
  },
}));

import { POST } from "../route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.organizationMember.findFirst);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/switch-org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/switch-org", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APEX_HOST = "lvh.me";
    (process.env as Record<string, string>).NODE_ENV = "test";
  });

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest({ orgId: "org-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when orgId is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/orgId required/i);
  });

  it("returns 403 when user is not a member of the org", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest({ orgId: "org-unknown" }));
    expect(res.status).toBe(403);
  });

  it("returns 403 when org is SUSPENDED", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({
      organization: { id: "org-1", subdomain: "buckedup", status: "SUSPENDED" },
    } as never);
    const res = await POST(makeRequest({ orgId: "org-1" }));
    expect(res.status).toBe(403);
  });

  it("returns 200 with redirectUrl for valid membership", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({
      organization: { id: "org-2", subdomain: "buckedup", status: "ACTIVE" },
    } as never);

    const res = await POST(makeRequest({ orgId: "org-2" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.redirectUrl).toContain("buckedup.lvh.me");
    expect(body.data.redirectUrl).toContain("/admin");
  });
});
