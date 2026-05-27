import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Hoist mocks so they are available before imports
const { authMock, findUniqueMock, getOrgIdFromRequestMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUniqueMock: vi.fn(),
  getOrgIdFromRequestMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: findUniqueMock },
  },
}));

vi.mock("@/lib/tenant/get-org-from-request", () => ({
  getOrgIdFromRequest: getOrgIdFromRequestMock,
}));

import { requireOrgRole } from "../require-org-role";

const orgA = "org-a-uuid";
const orgB = "org-b-uuid";

describe("requireOrgRole()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no x-org-id header (fallback to JWT)
    getOrgIdFromRequestMock.mockResolvedValue(null);
  });

  // ── Original checks (JWT path) ──────────────────────────────────────────────

  it("returns 401 when session is absent", async () => {
    authMock.mockResolvedValue(null);

    const result = await requireOrgRole(["OWNER"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Authentication required");
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns 400 when neither header nor JWT activeOrgId present", async () => {
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com" },
    });
    getOrgIdFromRequestMock.mockResolvedValue(null);

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

  it("returns enriched session for super_admin bypass (isSuperAdmin=true)", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com", activeOrgId: orgA },
    });
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      isSuperAdmin: true,
      organizationMemberships: [],
    });

    const result = await requireOrgRole(["OWNER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgA);
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

  it("returns enriched session when actor holds an allowed role (OWNER)", async () => {
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
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgA);
  });

  it("returns enriched session when actor holds any of the allowed roles (ADMIN)", async () => {
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
          roles: [{ role: "ADMIN", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgA);
  });

  // ── Sub-etapa 23 expansion: host-based x-org-id header ─────────────────────

  it("header x-org-id present + user is member → returns session with header orgId", async () => {
    // JWT has orgA, but host is orgB
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    getOrgIdFromRequestMock.mockResolvedValue(orgB);
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
        {
          organizationId: orgB,
          status: "ACTIVE",
          roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null }],
        },
      ],
    });

    const result = await requireOrgRole(["OWNER", "MEMBER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    // Session should reflect the host org (orgB), not JWT org (orgA)
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgB);
  });

  it("header x-org-id present + user NOT member of host org → 403", async () => {
    // Header says orgB, but user is only member of orgA
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    getOrgIdFromRequestMock.mockResolvedValue(orgB);
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [
        {
          organizationId: orgA,
          status: "ACTIVE",
          roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }],
        },
        // No membership in orgB
      ],
    });

    const result = await requireOrgRole(["OWNER", "ADMIN"]);

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Not a member of this organization");
    expect((result as NextResponse).status).toBe(403);
  });

  it("header x-org-id absent → falls back to JWT activeOrgId", async () => {
    // No header, JWT has orgA
    authMock.mockResolvedValue({
      user: { id: "p1", email: "user@example.com", activeOrgId: orgA },
    });
    getOrgIdFromRequestMock.mockResolvedValue(null); // no header
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

    const result = await requireOrgRole(["OWNER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    // Falls back to JWT org
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgA);
  });

  it("super_admin + header x-org-id present → returns session with header orgId (membership bypass)", async () => {
    // Super admin accessing orgB (not necessarily a member)
    authMock.mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com", activeOrgId: orgA },
    });
    getOrgIdFromRequestMock.mockResolvedValue(orgB);
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      isSuperAdmin: true,
      organizationMemberships: [], // not a member of orgB, but bypass applies
    });

    const result = await requireOrgRole(["OWNER"]);

    expect(result).not.toBeInstanceOf(NextResponse);
    // Header org wins even for super_admin
    expect((result as { user: { activeOrgId?: string } }).user.activeOrgId).toBe(orgB);
  });
});
