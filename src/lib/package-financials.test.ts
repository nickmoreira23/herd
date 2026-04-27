// Runnable with: npx tsx src/lib/package-financials.test.ts
// (No jest/vitest is installed; we use node:assert + node:test so this can run
// standalone without adding a dependency.)

import assert from "node:assert/strict";
import { test } from "node:test";
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
  assert.equal(r.revenue, 100);
  assert.equal(r.productCOGS, 0);
  assert.equal(r.fulfillmentCost, 0);
  assert.equal(r.paymentProcessing, 0);
  assert.equal(r.totalCOGS, 0);
  assert.equal(r.profitPerSubscriber, 100);
  assert.equal(r.grossMarginPct, 100);
  assert.equal(r.healthStatus, "empty");
  assert.equal(r.productCount, 0);
});

test("single product, no plan-level fulfillment or processing", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 10, quantity: 1 })],
    makeTier()
  );
  assert.equal(r.productCOGS, 10);
  assert.equal(r.totalCOGS, 10);
  assert.equal(r.profitPerSubscriber, 90);
  assert.equal(r.grossMarginPct, 90);
  assert.equal(r.healthStatus, "healthy");
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
  assert.equal(r.productCOGS, 35);
  // Fulfillment is plan-level only — not multiplied by quantities
  assert.equal(r.fulfillmentCost, 5);
  assert.equal(r.paymentProcessing, 0);
  assert.equal(r.totalCOGS, 40);
  assert.equal(r.profitPerSubscriber, 60);
  assert.equal(r.healthStatus, "healthy");
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
  assert.equal(r.productCOGS, 10);
  assert.equal(r.fulfillmentCost, 5);
  // 100 * 0.029 + 0.30 = 3.2
  assert.ok(Math.abs(r.paymentProcessing - 3.2) < 0.0001);
  assert.ok(Math.abs(r.totalCOGS - 18.2) < 0.0001);
  assert.ok(Math.abs(r.profitPerSubscriber - 81.8) < 0.0001);
});

test("plan-level processing fees", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 10, quantity: 1 })],
    makeTier({ processingFeePct: 2.9, processingFeeFlat: 0.3 })
  );
  assert.ok(Math.abs(r.paymentProcessing - 3.2) < 0.0001);
  assert.ok(Math.abs(r.totalCOGS - 13.2) < 0.0001);
  assert.ok(Math.abs(r.profitPerSubscriber - 86.8) < 0.0001);
});

test("loss-making selection yields negative profit and loss status", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 80, quantity: 2 })],
    makeTier({ monthlyPrice: 100, avgShippingCost: 10, avgHandlingCost: 4 })
  );
  // COGS: 160, fulfillment: 14, total: 174
  assert.equal(r.totalCOGS, 174);
  assert.equal(r.profitPerSubscriber, -74);
  assert.equal(r.healthStatus, "loss");
});

test("tight margin status kicks in between 10% and 30%", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 80, quantity: 1 })],
    makeTier({ monthlyPrice: 100 })
  );
  // Profit 20, margin 20% — tight.
  assert.equal(r.profitPerSubscriber, 20);
  assert.equal(r.grossMarginPct, 20);
  assert.equal(r.healthStatus, "tight");
});
