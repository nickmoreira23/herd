import { describe, it, expect, vi, beforeEach } from "vitest";

// L1b.2b — activation. Asserts: SubscriptionTier is in TENANT_SCOPED_MODELS; the
// subscription provider loud-fails when tier is read without a tenant context;
// and the plan-agent context reads tier under the host org threaded from the
// route (no host → no unscoped read). Uses the REAL withTenant/requireTenantId
// (only prisma is mocked) so the AsyncLocalStorage context is exercised.
// Isolation (RLS) is NOT tested here — that is L1b.3.

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriptionTier: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({ id: "x" })),
    },
  },
}));

const { prisma } = await import("@/lib/prisma");

describe("L1b.2b — activation: SubscriptionTier in TENANT_SCOPED_MODELS", () => {
  it("declares SubscriptionTier as tenant-scoped", async () => {
    const { TENANT_SCOPED_MODELS } = await import("@/lib/tenancy/prisma-extension");
    expect(TENANT_SCOPED_MODELS).toContain("SubscriptionTier");
  });
});

describe("L1b.2b — loud-fail when tier is read without tenant context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("SubscriptionProvider.getCatalogItems throws outside withTenant", async () => {
    const { SubscriptionProvider } = await import(
      "@/lib/chat/providers/subscription.provider"
    );
    const provider = new SubscriptionProvider();
    await expect(provider.getCatalogItems()).rejects.toThrow(/withTenant/);
    expect(prisma.subscriptionTier.findMany).not.toHaveBeenCalled();
  });

  it("SubscriptionProvider.getCatalogItems succeeds inside withTenant", async () => {
    const { SubscriptionProvider } = await import(
      "@/lib/chat/providers/subscription.provider"
    );
    const { withTenant } = await import("@/lib/tenancy/context");
    const provider = new SubscriptionProvider();
    const items = await withTenant("org-1", () => provider.getCatalogItems());
    expect(items).toEqual([]);
    expect(prisma.subscriptionTier.findMany).toHaveBeenCalled();
  });
});

describe("L1b.2b — plan-agent reads tier under the host org", () => {
  beforeEach(() => vi.clearAllMocks());

  it("buildPlanAgentContext(null) does NOT read tier (no host → no unscoped read)", async () => {
    const { buildPlanAgentContext } = await import(
      "@/lib/agents/handlers/plan-agent"
    );
    const { allPlans } = await buildPlanAgentContext(null);
    expect(allPlans).toEqual([]);
    expect(prisma.subscriptionTier.findMany).not.toHaveBeenCalled();
  });

  it("buildPlanAgentContext(orgId) reads tier under withTenant", async () => {
    const { buildPlanAgentContext } = await import(
      "@/lib/agents/handlers/plan-agent"
    );
    // buildPlanAgentContext wraps the read in withTenant(orgId) internally — the
    // real withTenant sets the context, so the (mocked) findMany is reached.
    const { allPlans } = await buildPlanAgentContext("org-1");
    expect(allPlans).toEqual([]);
    expect(prisma.subscriptionTier.findMany).toHaveBeenCalled();
  });
});
