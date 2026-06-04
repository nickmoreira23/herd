/**
 * Fix-3 — MarketplaceLayout guard (super_admin-only, SE-1 interim).
 * requireSuperAdmin → Response (non-super_admin, incl. a plain org member) →
 * redirect; Session (super_admin) → render children.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireSuperAdminMock, redirectMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
}));

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: requireSuperAdminMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import MarketplaceLayout from "../layout";

describe("MarketplaceLayout — super_admin guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("non-super_admin (Response — incl. plain org member) → redirect /login", async () => {
    requireSuperAdminMock.mockResolvedValue(new Response("forbidden", { status: 403 }));
    await expect(MarketplaceLayout({ children: "child" })).rejects.toThrow("REDIRECT:/login");
    expect(requireSuperAdminMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("super_admin (Session) → renders children", async () => {
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin", role: "super_admin" } });
    const result = await MarketplaceLayout({ children: "CHILD" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
