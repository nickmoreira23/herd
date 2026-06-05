import { describe, it, expect, vi, beforeEach } from "vitest";

// L1.0 — characterization of the interim catalog write guard.
// Every catalog write handler (Product / Tier / satellites) must reject
// non-OWNER/ADMIN: anonymous → 401, MEMBER → 403; OWNER/ADMIN passes the guard
// (reaches the handler body — any status other than 401/403).
//
// requireOrgRole resolves org via getOrgIdFromRequest → headers() (mocked) and
// the actor via prisma.networkProfile.findUnique (mocked, see makeProfile).

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-org-id": "org-1" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/recalculate-tier-costs", () => ({
  recalculateTierProductCosts: vi.fn(async () => 0),
}));

function delegate() {
  return {
    findUnique: vi.fn(async () => null),
    findFirst: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    create: vi.fn(async () => ({ id: "x" })),
    update: vi.fn(async () => ({ id: "x" })),
    delete: vi.fn(async () => ({ id: "x" })),
    createMany: vi.fn(async () => ({ count: 0 })),
    updateMany: vi.fn(async () => ({ count: 0 })),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn() },
    product: delegate(),
    productImage: delegate(),
    subscriptionTier: delegate(),
    tierPricingSnapshot: delegate(),
    subscriptionRedemptionRule: delegate(),
    financialSnapshot: delegate(),
    agentTierAccess: delegate(),
    communityBenefitTierAssignment: delegate(),
    perkTierAssignment: delegate(),
    $transaction: vi.fn(async (arg: unknown) =>
      Array.isArray(arg) ? [] : (arg as (tx: unknown) => unknown)({})
    ),
  },
}));

const { auth } = await import("@/lib/auth");
const { prisma } = await import("@/lib/prisma");
const mockAuth = vi.mocked(auth);
const profileFindUnique = vi.mocked(prisma.networkProfile.findUnique);

function makeSession() {
  return {
    user: { id: "profile-1", activeOrgId: "org-1", isSuperAdmin: false, role: "OWNER" },
    expires: "9999-01-01",
  };
}

function makeProfile(role: string | null) {
  return {
    id: "profile-1",
    isSuperAdmin: false,
    organizationMemberships: [
      {
        organizationId: "org-1",
        status: "ACTIVE",
        roles: [{ role, roleId: null, scopeType: "ORG", scopeId: null }],
      },
    ],
  };
}

const UUID = "00000000-0000-0000-0000-000000000001";

function ctx() {
  return { params: Promise.resolve({ id: UUID, tierId: UUID, imageId: UUID }) };
}

function req() {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-org-id": "org-1" },
    body: JSON.stringify({}),
  });
}

// One entry per guarded handler. `call` invokes the exported handler.
const cases: Array<{ name: string; call: () => Promise<Response> }> = [
  {
    name: "POST /api/products",
    call: async () => (await import("../products/route")).POST(req() as never),
  },
  {
    name: "PATCH /api/products/[id]",
    call: async () => (await import("../products/[id]/route")).PATCH(req(), ctx() as never),
  },
  {
    name: "DELETE /api/products/[id]",
    call: async () => (await import("../products/[id]/route")).DELETE(req(), ctx() as never),
  },
  {
    name: "POST /api/products/bulk",
    call: async () => (await import("../products/bulk/route")).POST(req()),
  },
  {
    name: "PATCH /api/products/bulk",
    call: async () => (await import("../products/bulk/route")).PATCH(req()),
  },
  {
    name: "PATCH /api/products/[id]/images/[imageId]",
    call: async () =>
      (await import("../products/[id]/images/[imageId]/route")).PATCH(req(), ctx() as never),
  },
  {
    name: "DELETE /api/products/[id]/images/[imageId]",
    call: async () =>
      (await import("../products/[id]/images/[imageId]/route")).DELETE(req(), ctx() as never),
  },
  {
    name: "PUT /api/products/[id]/images/reorder",
    call: async () =>
      (await import("../products/[id]/images/reorder/route")).PUT(req(), ctx() as never),
  },
  {
    name: "POST /api/tiers",
    call: async () => (await import("../tiers/route")).POST(req()),
  },
  {
    name: "PATCH /api/tiers/[id]",
    call: async () => (await import("../tiers/[id]/route")).PATCH(req(), ctx() as never),
  },
  {
    name: "DELETE /api/tiers/[id]",
    call: async () => (await import("../tiers/[id]/route")).DELETE(req(), ctx() as never),
  },
  {
    name: "POST /api/tiers/reorder",
    call: async () => (await import("../tiers/reorder/route")).POST(req()),
  },
  {
    name: "POST /api/subscriptions/[tierId]/redemption-rules",
    call: async () =>
      (await import("../subscriptions/[tierId]/redemption-rules/route")).POST(req(), ctx() as never),
  },
  {
    name: "PATCH /api/subscriptions/[tierId]/redemption-rules/[id]",
    call: async () =>
      (await import("../subscriptions/[tierId]/redemption-rules/[id]/route")).PATCH(
        req(),
        ctx() as never
      ),
  },
  {
    name: "DELETE /api/subscriptions/[tierId]/redemption-rules/[id]",
    call: async () =>
      (await import("../subscriptions/[tierId]/redemption-rules/[id]/route")).DELETE(
        req(),
        ctx() as never
      ),
  },
  {
    name: "POST /api/products/import-url",
    call: async () => (await import("../products/import-url/route")).POST(req()),
  },
  {
    name: "PUT /api/tiers/[id]/agents",
    call: async () => (await import("../tiers/[id]/agents/route")).PUT(req(), ctx() as never),
  },
  {
    name: "PUT /api/tiers/[id]/community",
    call: async () => (await import("../tiers/[id]/community/route")).PUT(req(), ctx() as never),
  },
  {
    name: "PUT /api/tiers/[id]/perks",
    call: async () => (await import("../tiers/[id]/perks/route")).PUT(req(), ctx() as never),
  },
  {
    name: "POST /api/financials",
    call: async () => (await import("../financials/route")).POST(req()),
  },
  {
    name: "PATCH /api/financials/[id]",
    call: async () => (await import("../financials/[id]/route")).PATCH(req(), ctx() as never),
  },
  {
    name: "DELETE /api/financials/[id]",
    call: async () => (await import("../financials/[id]/route")).DELETE(req(), ctx() as never),
  },
];

describe("L1.0 — catalog write guard (requireOrgRole OWNER/ADMIN)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const c of cases) {
    describe(c.name, () => {
      it("rejects anonymous with 401", async () => {
        mockAuth.mockResolvedValue(null as never);
        const res = await c.call();
        expect(res.status).toBe(401);
      });

      it("rejects MEMBER with 403", async () => {
        mockAuth.mockResolvedValue(makeSession() as never);
        profileFindUnique.mockResolvedValue(makeProfile("MEMBER") as never);
        const res = await c.call();
        expect(res.status).toBe(403);
      });

      it("lets OWNER past the guard (not 401/403)", async () => {
        mockAuth.mockResolvedValue(makeSession() as never);
        profileFindUnique.mockResolvedValue(makeProfile("OWNER") as never);
        const res = await c.call();
        expect([401, 403]).not.toContain(res.status);
      });
    });
  }
});
