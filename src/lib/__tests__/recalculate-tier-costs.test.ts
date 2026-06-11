import { describe, it, expect, vi, beforeEach } from "vitest";

const updateSpy = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriptionRedemptionRule: { findMany: vi.fn(async () => []) },
    packageTierVariant: {
      findMany: vi.fn(async () => [
        {
          id: "variant-1",
          products: [
            { id: "ptp-1", productId: "prod-1", creditCost: 12.5, quantity: 1 },
          ],
        },
      ]),
    },
    product: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) =>
      fn({
        packageTierProduct: { update: updateSpy, findMany: vi.fn(async () => []) },
        packageTierVariant: { update: vi.fn() },
      })
    ),
  },
}));

vi.mock("@/lib/tenancy/context", () => ({
  withTenant: vi.fn(async (_orgId: string, fn: () => Promise<unknown>) => fn()),
}));

import { recalculateTierProductCosts } from "@/lib/recalculate-tier-costs";

describe("recalculateTierProductCosts — org guard (L1a.4)", () => {
  beforeEach(() => {
    updateSpy.mockClear();
  });

  it("throws without an org context instead of recalculating against an empty catalog", async () => {
    await expect(recalculateTierProductCosts("tier-1", "")).rejects.toThrow(
      /org context/
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("skips products invisible under the tenant — never zeroes their cost", async () => {
    // The scoped catalog read returns nothing (e.g. wrong org for this tier):
    // every join row misses and no creditCost is touched.
    const updated = await recalculateTierProductCosts("tier-1", "org-1");
    expect(updated).toBe(0);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
