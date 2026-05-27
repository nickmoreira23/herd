import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationMember: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "../route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.organizationMember.findMany);

describe("GET /api/auth/memberships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns empty array when user has no active memberships", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it("returns 2 entries for user with 2 active memberships", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindMany.mockResolvedValue([
      {
        organization: {
          id: "org-1",
          slug: "comecaai",
          name: "ComeçaAI",
          subdomain: "app",
          status: "ACTIVE",
        },
        roles: [{ role: "OWNER", scopeType: "ORG" }],
      },
      {
        organization: {
          id: "org-2",
          slug: "buckedup",
          name: "Bucked Up",
          subdomain: "buckedup",
          status: "ACTIVE",
        },
        roles: [{ role: "ADMIN", scopeType: "ORG" }],
      },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      orgId: "org-1",
      slug: "comecaai",
      name: "ComeçaAI",
      subdomain: "app",
      roles: ["OWNER"],
    });
    expect(body.data[1]).toMatchObject({
      orgId: "org-2",
      name: "Bucked Up",
      subdomain: "buckedup",
    });
  });

  it("filters out orgs with INACTIVE or SUSPENDED status", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindMany.mockResolvedValue([
      {
        organization: {
          id: "org-1",
          slug: "active",
          name: "Active Org",
          subdomain: "active",
          status: "ACTIVE",
        },
        roles: [{ role: "MEMBER", scopeType: "ORG" }],
      },
      {
        organization: {
          id: "org-2",
          slug: "suspended",
          name: "Suspended Org",
          subdomain: "suspended",
          status: "SUSPENDED",
        },
        roles: [{ role: "MEMBER", scopeType: "ORG" }],
      },
      {
        organization: {
          id: "org-3",
          slug: "archived",
          name: "Archived Org",
          subdomain: "archived",
          status: "ARCHIVED",
        },
        roles: [{ role: "MEMBER", scopeType: "ORG" }],
      },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Active Org");
  });
});
