import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/permissions", () => ({ getActor: vi.fn() }));

import { getViewerContext } from "../visibility-helpers";
import { getActor } from "@/lib/permissions";
import type { Session } from "next-auth";

const mockGetActor = vi.mocked(getActor);
const session = { user: { id: "p-1" } } as Session;

beforeEach(() => vi.clearAllMocks());

describe("getViewerContext (SE5a — real RBAC from getActor)", () => {
  it("anonymous (no session) → empty, never calls getActor", async () => {
    const ctx = await getViewerContext(null, "org-1");
    expect(ctx).toEqual({ profileId: null, isSuperAdmin: false, roles: [] });
    expect(mockGetActor).not.toHaveBeenCalled();
  });

  it("populates the viewer's system roles in the effective org", async () => {
    mockGetActor.mockResolvedValueOnce({
      profileId: "p-1",
      isSuperAdmin: false,
      memberships: [
        { organizationId: "org-1", status: "ACTIVE", roles: [{ role: "ADMIN", scopeType: "ORG", scopeId: null }] },
        { organizationId: "org-2", status: "ACTIVE", roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }] },
      ],
    } as never);
    const ctx = await getViewerContext(session, "org-1");
    expect(ctx).toEqual({ profileId: "p-1", isSuperAdmin: false, roles: ["ADMIN"] });
  });

  it("drops null roles (custom-role rows carry roleId, not a system role)", async () => {
    mockGetActor.mockResolvedValueOnce({
      profileId: "p-1",
      isSuperAdmin: false,
      memberships: [
        {
          organizationId: "org-1",
          status: "ACTIVE",
          roles: [
            { role: "MEMBER", scopeType: "ORG", scopeId: null },
            { role: null, roleId: "custom-1", scopeType: "ORG", scopeId: null },
          ],
        },
      ],
    } as never);
    const ctx = await getViewerContext(session, "org-1");
    expect(ctx.roles).toEqual(["MEMBER"]);
  });

  it("no membership in the effective org → empty roles", async () => {
    mockGetActor.mockResolvedValueOnce({
      profileId: "p-1",
      isSuperAdmin: false,
      memberships: [
        { organizationId: "other-org", status: "ACTIVE", roles: [{ role: "OWNER", scopeType: "ORG", scopeId: null }] },
      ],
    } as never);
    const ctx = await getViewerContext(session, "org-1");
    expect(ctx.roles).toEqual([]);
  });

  it("super_admin → isSuperAdmin true (sees everything; roles need not be populated)", async () => {
    mockGetActor.mockResolvedValueOnce({
      profileId: "admin-1",
      isSuperAdmin: true,
      memberships: [],
    } as never);
    const ctx = await getViewerContext(session, "org-1");
    expect(ctx).toEqual({ profileId: "admin-1", isSuperAdmin: true, roles: [] });
  });
});
