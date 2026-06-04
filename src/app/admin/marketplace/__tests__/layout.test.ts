/**
 * SE-4 — MarketplaceLayout guard (org-scoped, OWNER/ADMIN-only).
 * requireOrgRole(["OWNER","ADMIN"]) → Response (insufficient role, incl. a
 * plain MEMBER / non-member) → redirect; Session (OWNER/ADMIN/super_admin
 * bypass) → render children. The OWNER/ADMIN/MEMBER/super_admin/cross-org
 * matrix itself lives in require-org-role.test.ts.
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

import MarketplaceLayout from "../layout";

describe("MarketplaceLayout — org-role guard (OWNER/ADMIN)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires OWNER/ADMIN (stricter than Blocks — no MEMBER)", async () => {
    requireOrgRoleMock.mockResolvedValue({ user: { id: "u1" } });
    await MarketplaceLayout({ children: "child" });
    expect(requireOrgRoleMock).toHaveBeenCalledWith(["OWNER", "ADMIN"]);
  });

  it("insufficient role (Response — incl. plain MEMBER / non-member) → redirect /login", async () => {
    requireOrgRoleMock.mockResolvedValue(new Response("forbidden", { status: 403 }));
    await expect(MarketplaceLayout({ children: "child" })).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("OWNER/ADMIN (or super_admin bypass) → renders children", async () => {
    requireOrgRoleMock.mockResolvedValue({ user: { id: "u1" } });
    const result = await MarketplaceLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
