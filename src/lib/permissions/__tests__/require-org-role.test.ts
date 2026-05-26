import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Hoist mocks so they are available before imports
const { authMock, findUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: findUniqueMock },
  },
}));

import { requireOrgRole } from "../require-org-role";

const orgA = "org-a-uuid";

describe("requireOrgRole()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is absent", async () => {
    authMock.mockResolvedValue(null);

    const result = await requireOrgRole(["OWNER"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Authentication required");
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns 400 when activeOrgId is absent", async () => {
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com" },
    });

    const result = await requireOrgRole(["OWNER"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("No active organization");
    expect((result as NextResponse).status).toBe(400);
  });

  it("returns 404 when profile is not found in DB", async () => {
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    findUniqueMock.mockResolvedValue(null);

    const result = await requireOrgRole(["OWNER"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Profile not found");
    expect((result as NextResponse).status).toBe(404);
  });

  it("returns session for super_admin bypass (isSuperAdmin=true)", async () => {
    const session = {
      user: { id: "admin-1", email: "admin@example.com", activeOrgId: orgA },
    };
    authMock.mockResolvedValue(session);
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      isSuperAdmin: true,
      organizationMemberships: [],
    });

    const result = await requireOrgRole(["OWNER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(session);
  });

  it("returns 403 when actor has no membership in the active org", async () => {
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [],
    });

    const result = await requireOrgRole(["OWNER"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Not a member of this organization");
    expect((result as NextResponse).status).toBe(403);
  });

  it("returns 403 when actor role is not in allowedRoles", async () => {
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toMatch(/Forbidden/);
    expect((result as NextResponse).status).toBe(403);
  });

  it("returns session when actor holds an allowed role (OWNER)", async () => {
    const session = {
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    };
    authMock.mockResolvedValue(session);
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(session);
  });

  it("returns session when actor holds any of the allowed roles (ADMIN)", async () => {
    const session = {
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    };
    authMock.mockResolvedValue(session);
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "ADMIN", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(session);
  });
});
