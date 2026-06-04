/**
 * Fix-3 — BlocksLayout membership guard (org-scoped, mirrors Fix-2).
 * requireOrgRole → Response (non-member) → redirect; Session (member OR
 * super_admin bypass) → render children.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireOrgRoleMock, redirectMock } = vi.hoisted(() => ({
  requireOrgRoleMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
}));

vi.mock("@/lib/permissions", () => ({ requireOrgRole: requireOrgRoleMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import BlocksLayout from "../layout";

describe("BlocksLayout — membership guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("non-member (Response) → redirect /login", async () => {
    requireOrgRoleMock.mockResolvedValue(new Response("forbidden", { status: 403 }));
    await expect(BlocksLayout({ children: "child" })).rejects.toThrow("REDIRECT:/login");
    expect(requireOrgRoleMock).toHaveBeenCalledWith(["OWNER", "ADMIN", "MEMBER"]);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("member (Session) → renders children", async () => {
    requireOrgRoleMock.mockResolvedValue({ user: { id: "u1", activeOrgId: "org-1" } });
    const result = await BlocksLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("super_admin (Session via bypass) → renders children", async () => {
    requireOrgRoleMock.mockResolvedValue({ user: { id: "admin", activeOrgId: "any", isSuperAdmin: true } });
    const result = await BlocksLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
