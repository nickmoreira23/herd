import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, findUniqueMock, getOrgIdFromRequestMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUniqueMock: vi.fn(),
  getOrgIdFromRequestMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { networkProfile: { findUnique: findUniqueMock } },
}));
vi.mock("@/lib/tenant/get-org-from-request", () => ({
  getOrgIdFromRequest: getOrgIdFromRequestMock,
}));

import { hasOrgRole } from "../has-org-role";

const orgA = "org-a-uuid";

function membership(role: string | null) {
  return {
    id: "p1",
    isSuperAdmin: false,
    organizationMemberships: [
      {
        organizationId: orgA,
        status: "ACTIVE",
        roles: [{ role, roleId: null, scopeType: "ORG", scopeId: null }],
      },
    ],
  };
}

describe("hasOrgRole()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrgIdFromRequestMock.mockResolvedValue(orgA);
  });

  it("false when no session", async () => {
    authMock.mockResolvedValue(null);
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(false);
  });

  it("false when no org context (no header, no JWT)", async () => {
    authMock.mockResolvedValue({ user: { id: "p1" } });
    getOrgIdFromRequestMock.mockResolvedValue(null);
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(false);
  });

  it("false when profile not found", async () => {
    authMock.mockResolvedValue({ user: { id: "p1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue(null);
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(false);
  });

  it("false when MEMBER and OWNER/ADMIN required", async () => {
    authMock.mockResolvedValue({ user: { id: "p1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue(membership("MEMBER"));
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(false);
  });

  it("false when not a member of the effective org", async () => {
    authMock.mockResolvedValue({ user: { id: "p1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue({
      id: "p1",
      isSuperAdmin: false,
      organizationMemberships: [],
    });
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(false);
  });

  it("true for OWNER", async () => {
    authMock.mockResolvedValue({ user: { id: "p1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue(membership("OWNER"));
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(true);
  });

  it("true for ADMIN", async () => {
    authMock.mockResolvedValue({ user: { id: "p1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue(membership("ADMIN"));
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(true);
  });

  it("true for super_admin (bypass, no membership)", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", activeOrgId: orgA } });
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      isSuperAdmin: true,
      organizationMemberships: [],
    });
    expect(await hasOrgRole(["OWNER", "ADMIN"])).toBe(true);
  });
});
