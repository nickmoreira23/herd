import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/permissions", () => ({ requireOrgRole: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationMember: { findMany: vi.fn() },
    organizationInvitation: { findMany: vi.fn() },
  },
}));
// The page returns <MembersClient {...props} />; we read props off the element.
vi.mock("../members-client", () => ({ MembersClient: () => null }));

import MembersPage from "../page";
import { requireOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const mockRequire = vi.mocked(requireOrgRole);
const mockMembers = vi.mocked(prisma.organizationMember.findMany);
const mockInvites = vi.mocked(prisma.organizationInvitation.findMany);

describe("MembersPage — R&P Fase 7c-2b widen (system vs custom split)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequire.mockResolvedValue({ user: { id: "viewer", activeOrgId: "org-1", isSuperAdmin: false } } as never);
    mockInvites.mockResolvedValue([] as never);
  });

  it("splits each member's rows: system role stays in `roles`, custom goes to `customRoles`", async () => {
    mockMembers.mockResolvedValue([
      {
        id: "m1",
        joinedAt: new Date(),
        networkProfile: { id: "p1", firstName: "A", lastName: "B", email: "a@b.com", avatarUrl: null },
        roles: [
          { role: "OWNER", scopeType: "ORG", roleId: null, customRole: null },
          { role: null, scopeType: "ORG", roleId: "r-1", customRole: { id: "r-1", name: "Finance Viewer" } },
        ],
      },
    ] as never);

    const out = (await MembersPage()) as { props: { members: unknown } };
    const members = out.props.members as Array<{
      roles: Array<{ role: string; scopeType: string }>;
      customRoles: Array<{ roleId: string; name: string }>;
    }>;
    // System-role path unchanged: only the enum row, shape {role, scopeType}.
    expect(members[0].roles).toEqual([{ role: "OWNER", scopeType: "ORG" }]);
    // Custom assignment surfaced separately for the chips control.
    expect(members[0].customRoles).toEqual([{ roleId: "r-1", name: "Finance Viewer" }]);
  });

  it("a member with no custom roles → customRoles is empty, roles intact", async () => {
    mockMembers.mockResolvedValue([
      {
        id: "m2",
        joinedAt: new Date(),
        networkProfile: { id: "p2", firstName: "C", lastName: "D", email: "c@d.com", avatarUrl: null },
        roles: [{ role: "MEMBER", scopeType: "ORG", roleId: null, customRole: null }],
      },
    ] as never);

    const out = (await MembersPage()) as { props: { members: unknown } };
    const members = out.props.members as Array<{ roles: unknown[]; customRoles: unknown[] }>;
    expect(members[0].roles).toEqual([{ role: "MEMBER", scopeType: "ORG" }]);
    expect(members[0].customRoles).toEqual([]);
  });
});
