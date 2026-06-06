import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn() }));
vi.mock("@/components/organization/roles-manager", () => ({
  RolesManager: () => "ROLES_MANAGER",
}));

import RolesPage from "../page";
import { requireOrgRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

const mockRequire = vi.mocked(requireOrgRole);
const mockRedirect = vi.mocked(redirect);

describe("RolesPage — server gate (roles.read = OWNER/ADMIN; MEMBER bounced)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("OWNER/ADMIN (session) → renders RolesManager", async () => {
    mockRequire.mockResolvedValue({ user: { activeOrgId: "org-1" } } as never);
    const out = await RolesPage();
    expect(out).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("MEMBER / non-member (Response) → redirect('/admin')", async () => {
    mockRequire.mockResolvedValue(new Response(null, { status: 403 }) as never);
    await expect(RolesPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
    expect(mockRedirect).toHaveBeenCalledWith("/admin");
  });
});
