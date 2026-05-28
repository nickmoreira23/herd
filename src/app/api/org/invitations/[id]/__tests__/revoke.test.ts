import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-org-id": "org-1" })),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn() },
    organizationInvitation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { auth } = await import("@/lib/auth");
const { POST } = await import("../revoke/route");
const { prisma } = await import("@/lib/prisma");

const mockAuth = vi.mocked(auth);
const profileFindUnique = vi.mocked(prisma.networkProfile.findUnique);
const invitationFindFirst = vi.mocked(prisma.organizationInvitation.findFirst);
const invitationUpdate = vi.mocked(prisma.organizationInvitation.update);

function makeProfile(role = "OWNER") {
  return {
    id: "profile-1",
    isSuperAdmin: false,
    organizationMemberships: [
      {
        organizationId: "org-1",
        status: "ACTIVE",
        roles: [{ role, scopeType: "ORG", scopeId: null }],
      },
    ],
  };
}

function makeSession() {
  return {
    user: { id: "profile-1", activeOrgId: "org-1", isSuperAdmin: false },
    expires: "9999-01-01",
  };
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest() {
  return new Request("http://localhost/api/org/invitations/inv-1/revoke", {
    method: "POST",
    headers: { "x-org-id": "org-1" },
  });
}

describe("POST /api/org/invitations/[id]/revoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(), makeParams("inv-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is MEMBER", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeProfile("MEMBER") as never);
    const res = await POST(makeRequest(), makeParams("inv-1"));
    expect(res.status).toBe(403);
  });

  it("returns 404 when invitation not found", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeProfile() as never);
    invitationFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(), makeParams("inv-x"));
    expect(res.status).toBe(404);
  });

  it("returns 409 when invitation already accepted", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeProfile() as never);
    invitationFindFirst.mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      status: "ACCEPTED",
    } as never);
    const res = await POST(makeRequest(), makeParams("inv-1"));
    expect(res.status).toBe(409);
  });

  it("returns 204 on happy path", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeProfile() as never);
    invitationFindFirst.mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      status: "PENDING",
    } as never);
    invitationUpdate.mockResolvedValue({} as never);

    const res = await POST(makeRequest(), makeParams("inv-1"));
    expect(res.status).toBe(204);
  });
});
