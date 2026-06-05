/**
 * Fix-2 — OrganizationLayout membership guard.
 *
 * The layout delegates to requireOrgRole(["OWNER","ADMIN","MEMBER"]): a Response
 * (non-member / unauth) → redirect("/login"); a Session (member OR super_admin
 * bypass, both resolved inside requireOrgRole) → render children. We mock
 * requireOrgRole + redirect and assert the two branches.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireOrgRoleMock, redirectMock, getActorMock, resolveMock } = vi.hoisted(() => ({
  requireOrgRoleMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
  getActorMock: vi.fn(async () => ({ profileId: "u1", isSuperAdmin: false, memberships: [] })),
  // Fase 7a: the layout now seeds the permission provider; mock the resolver +
  // provider so this stays a unit test (no DB). The guard behavior is unchanged.
  resolveMock: vi.fn(async () => ({ allowSet: [], orgRole: null, isSuperAdmin: false })),
}));

vi.mock("@/lib/permissions", () => ({ requireOrgRole: requireOrgRoleMock, getActor: getActorMock }));
vi.mock("@/lib/permissions/resolve-viewer-permissions", () => ({ resolveViewerPermissions: resolveMock }));
vi.mock("@/lib/permissions/permission-context", () => ({
  PermissionProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import OrganizationLayout from "../layout";

describe("OrganizationLayout — membership guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("non-member (requireOrgRole → Response) → redirect /login, children NOT rendered", async () => {
    requireOrgRoleMock.mockResolvedValue(new Response("forbidden", { status: 403 }));
    await expect(
      OrganizationLayout({ children: "child" }),
    ).rejects.toThrow("REDIRECT:/login");
    expect(requireOrgRoleMock).toHaveBeenCalledWith(["OWNER", "ADMIN", "MEMBER"]);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("member (requireOrgRole → Session) → renders children, no redirect", async () => {
    requireOrgRoleMock.mockResolvedValue({
      user: { id: "u1", activeOrgId: "org-1" },
    });
    const result = await OrganizationLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("super_admin (requireOrgRole bypass → Session) → renders children", async () => {
    // super_admin bypass happens INSIDE requireOrgRole, which returns a Session;
    // from the layout's perspective it's the same allow path as a member.
    requireOrgRoleMock.mockResolvedValue({
      user: { id: "admin", activeOrgId: "any-org", isSuperAdmin: true },
    });
    const result = await OrganizationLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
