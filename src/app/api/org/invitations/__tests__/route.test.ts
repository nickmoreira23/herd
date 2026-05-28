import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers (called by requireOrgRole → getOrgIdFromRequest)
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-org-id": "org-1" })),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn() },
    organizationInvitation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    organization: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  getEmailProvider: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
  mockSentEmails: [],
  clearMockSentEmails: vi.fn(),
  resetEmailProvider: vi.fn(),
}));

const { auth } = await import("@/lib/auth");
const { GET, POST } = await import("../route");
const { prisma } = await import("@/lib/prisma");

const mockAuth = vi.mocked(auth);
const invitationFindFirst = vi.mocked(prisma.organizationInvitation.findFirst);
const invitationCreate = vi.mocked(prisma.organizationInvitation.create);
const invitationFindMany = vi.mocked(prisma.organizationInvitation.findMany);
const profileFindUnique = vi.mocked(prisma.networkProfile.findUnique);
const orgFindUnique = vi.mocked(prisma.organization.findUnique);

function makeOwnerProfile(role = "OWNER") {
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

function makeSession(role = "OWNER") {
  return {
    user: { id: "profile-1", activeOrgId: "org-1", isSuperAdmin: false, role },
    expires: "9999-01-01",
  };
}

function makePostRequest(body?: unknown) {
  return new Request("http://localhost/api/org/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-org-id": "org-1" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/org/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await POST(makePostRequest({ email: "a@b.com", role: "MEMBER" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is MEMBER", async () => {
    mockAuth.mockResolvedValue(makeSession("MEMBER") as never);
    profileFindUnique.mockResolvedValue(makeOwnerProfile("MEMBER") as never);

    const res = await POST(makePostRequest({ email: "a@b.com", role: "MEMBER" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid payload (bad email)", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeOwnerProfile() as never);

    const res = await POST(makePostRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate PENDING invitation", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeOwnerProfile() as never);
    invitationFindFirst.mockResolvedValue({
      id: "existing",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 10000),
    } as never);

    const res = await POST(makePostRequest({ email: "a@b.com", role: "MEMBER" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("ALREADY_EXISTS");
  });

  it("returns 201 on happy path", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique
      .mockResolvedValueOnce(makeOwnerProfile() as never) // requireOrgRole getActor
      .mockResolvedValueOnce({ firstName: "Nick", lastName: "M" } as never); // inviter lookup

    invitationFindFirst.mockResolvedValue(null);
    invitationCreate.mockResolvedValue({
      id: "inv-new",
      token: "tok-123",
      email: "a@b.com",
      status: "PENDING",
    } as never);
    orgFindUnique.mockResolvedValue({ name: "ComeçaAI" } as never);

    const res = await POST(makePostRequest({ email: "a@b.com", role: "MEMBER" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("inv-new");
  });
});

describe("GET /api/org/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = new Request("http://localhost/api/org/invitations", {
      headers: { "x-org-id": "org-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with invitations list", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    profileFindUnique.mockResolvedValue(makeOwnerProfile("ADMIN") as never);
    invitationFindMany.mockResolvedValue([
      { id: "inv-1", email: "a@b.com", status: "PENDING" },
    ] as never);

    const req = new Request("http://localhost/api/org/invitations", {
      headers: { "x-org-id": "org-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });
});
