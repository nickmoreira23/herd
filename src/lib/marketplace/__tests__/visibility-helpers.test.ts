import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn() },
  },
}));

import { getViewerContext } from "../visibility-helpers";
import { prisma } from "@/lib/prisma";

const mockFindUnique = vi.mocked(prisma.networkProfile.findUnique);

beforeEach(() => vi.clearAllMocks());

describe("getViewerContext (BASELINE — placeholder post Sub-3.5/3.6)", () => {
  it("returns an empty context for an anonymous viewer (no profileId)", async () => {
    const ctx = await getViewerContext(null);
    expect(ctx).toEqual({ profileId: null, profileTypeId: null, roleIds: [] });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("resolves the profile id but always yields empty profileTypeId + roleIds", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "p-1" } as never);
    const ctx = await getViewerContext("p-1");
    // The gating attributes are hard-coded empty until the new RBAC/identity
    // model lands — this is the placeholder baseline SE5 will replace.
    expect(ctx).toEqual({ profileId: "p-1", profileTypeId: null, roleIds: [] });
  });

  it("falls back to the passed id (still empty attrs) when the profile is not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    const ctx = await getViewerContext("ghost");
    expect(ctx).toEqual({ profileId: "ghost", profileTypeId: null, roleIds: [] });
  });
});
