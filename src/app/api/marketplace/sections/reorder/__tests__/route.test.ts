import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/require-super-admin", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/lib/tenant/get-org-from-request", () => ({ getOrgIdFromRequest: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketplaceSection: { update: vi.fn() },
  },
}));

import { POST } from "../route";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { prisma } from "@/lib/prisma";

const mockGuard = vi.mocked(requireSuperAdmin);
const mockOrgId = vi.mocked(getOrgIdFromRequest);
const mockUpdate = vi.mocked(prisma.marketplaceSection.update);

const SESSION = { user: { id: "u1" } } as never;
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

function req(body: unknown) {
  return new Request("http://localhost/api/marketplace/sections/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuard.mockResolvedValue(SESSION);
  mockOrgId.mockResolvedValue("org-1");
  mockUpdate.mockResolvedValue({} as never);
});

describe("POST /api/marketplace/sections/reorder — guard + tenant-scoped batch update", () => {
  it("returns the guard Response when not super-admin", async () => {
    mockGuard.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await POST(req({ orders: [{ id: UUID_A, sortOrder: 0 }] }));
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("400 when the host has no org", async () => {
    mockOrgId.mockResolvedValueOnce(null);
    const res = await POST(req({ orders: [{ id: UUID_A, sortOrder: 0 }] }));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates each section's sort order under withTenant when super-admin", async () => {
    const res = await POST(
      req({
        orders: [
          { id: UUID_A, sortOrder: 0 },
          { id: UUID_B, sortOrder: 1 },
        ],
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { updated: 2 } });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("rejects an invalid payload (non-uuid id) with 400", async () => {
    const res = await POST(req({ orders: [{ id: "not-a-uuid", sortOrder: 0 }] }));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty orders array with 400", async () => {
    const res = await POST(req({ orders: [] }));
    expect(res.status).toBe(400);
  });
});
