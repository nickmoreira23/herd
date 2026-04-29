import { test, expect } from "vitest";
import type { LocalProduct } from "@/stores/package-wizard-store";
import { computeTierFinancials } from "./package-financials";

function makeProduct(overrides: Partial<LocalProduct>): LocalProduct {
  return {
    productId: "p1",
    name: "Test",
    sku: "SKU-1",
    category: "SUPPLEMENT",
    subCategory: null,
    imageUrl: null,
    memberPrice: 40,
    retailPrice: 50,
    quantity: 1,
    creditCost: 40,
    costOfGoods: 10,
    shippingCost: 0,
    handlingCost: 0,
    paymentProcessingPct: 0,
    paymentProcessingFlat: 0,
    ...overrides,
  };
}

function makeTier(
  overrides: Partial<{
    monthlyPrice: number;
    avgShippingCost: number;
    avgHandlingCost: number;
    processingFeePct: number;
    processingFeeFlat: number;
  }> = {}
) {
  return {
    monthlyPrice: 100,
    avgShippingCost: 0,
    avgHandlingCost: 0,
    processingFeePct: 0,
    processingFeeFlat: 0,
    ...overrides,
  };
}

test("empty selection returns revenue only, empty status", () => {
  const r = computeTierFinancials([], makeTier());
  expect(r.revenue).toBe(100);
  expect(r.productCOGS).toBe(0);
  expect(r.fulfillmentCost).toBe(0);
  expect(r.paymentProcessing).toBe(0);
  expect(r.totalCOGS).toBe(0);
  expect(r.profitPerSubscriber).toBe(100);
  expect(r.grossMarginPct).toBe(100);
  expect(r.healthStatus).toBe("empty");
  expect(r.productCount).toBe(0);
});

test("single product, no plan-level fulfillment or processing", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 10, quantity: 1 })],
    makeTier()
  );
  expect(r.productCOGS).toBe(10);
  expect(r.totalCOGS).toBe(10);
  expect(r.profitPerSubscriber).toBe(90);
  expect(r.grossMarginPct).toBe(90);
  expect(r.healthStatus).toBe("healthy");
});

test("plan-level shipping + handling are added once per subscriber", () => {
  const r = computeTierFinancials(
    [
      makeProduct({ productId: "a", costOfGoods: 10, quantity: 2 }),
      makeProduct({ productId: "b", costOfGoods: 5, quantity: 3 }),
    ],
    makeTier({ avgShippingCost: 4, avgHandlingCost: 1 })
  );
  // COGS: 10*2 + 5*3 = 35
  expect(r.productCOGS).toBe(35);
  // Fulfillment is plan-level only — not multiplied by quantities
  expect(r.fulfillmentCost).toBe(5);
  expect(r.paymentProcessing).toBe(0);
  expect(r.totalCOGS).toBe(40);
  expect(r.profitPerSubscriber).toBe(60);
  expect(r.healthStatus).toBe("healthy");
});

test("plan-level product cost fields are ignored (plan-level replaces them)", () => {
  // Even if products have shippingCost / paymentProcessingPct set, the calc
  // ignores them — fulfillment & processing now come from the tier alone.
  const r = computeTierFinancials(
    [
      makeProduct({
        costOfGoods: 10,
        quantity: 1,
        shippingCost: 999,
        handlingCost: 999,
        paymentProcessingPct: 99,
        paymentProcessingFlat: 99,
      }),
    ],
    makeTier({
      avgShippingCost: 4,
      avgHandlingCost: 1,
      processingFeePct: 2.9,
      processingFeeFlat: 0.3,
    })
  );
  expect(r.productCOGS).toBe(10);
  expect(r.fulfillmentCost).toBe(5);
  // 100 * 0.029 + 0.30 = 3.2
  expect(Math.abs(r.paymentProcessing - 3.2) < 0.0001).toBeTruthy();
  expect(Math.abs(r.totalCOGS - 18.2) < 0.0001).toBeTruthy();
  expect(Math.abs(r.profitPerSubscriber - 81.8) < 0.0001).toBeTruthy();
});

test("plan-level processing fees", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 10, quantity: 1 })],
    makeTier({ processingFeePct: 2.9, processingFeeFlat: 0.3 })
  );
  expect(Math.abs(r.paymentProcessing - 3.2) < 0.0001).toBeTruthy();
  expect(Math.abs(r.totalCOGS - 13.2) < 0.0001).toBeTruthy();
  expect(Math.abs(r.profitPerSubscriber - 86.8) < 0.0001).toBeTruthy();
});

test("loss-making selection yields negative profit and loss status", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 80, quantity: 2 })],
    makeTier({ monthlyPrice: 100, avgShippingCost: 10, avgHandlingCost: 4 })
  );
  // COGS: 160, fulfillment: 14, total: 174
  expect(r.totalCOGS).toBe(174);
  expect(r.profitPerSubscriber).toBe(-74);
  expect(r.healthStatus).toBe("loss");
});

test("tight margin status kicks in between 10% and 30%", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 80, quantity: 1 })],
    makeTier({ monthlyPrice: 100 })
  );
  // Profit 20, margin 20% — tight.
  expect(r.profitPerSubscriber).toBe(20);
  expect(r.grossMarginPct).toBe(20);
  expect(r.healthStatus).toBe("tight");
});
