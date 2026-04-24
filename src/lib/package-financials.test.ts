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

const TIER = { monthlyPrice: 100 };

test("empty selection returns revenue only, empty status", () => {
  const r = computeTierFinancials([], TIER);
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

test("single product, no fulfillment or processing", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 10, quantity: 1 })],
    TIER
  );
  assert.equal(r.productCOGS, 10);
  assert.equal(r.totalCOGS, 10);
  assert.equal(r.profitPerSubscriber, 90);
  assert.equal(r.grossMarginPct, 90);
  assert.equal(r.healthStatus, "healthy");
});

test("multi-product with quantities + fulfillment", () => {
  const r = computeTierFinancials(
    [
      makeProduct({
        productId: "a",
        costOfGoods: 10,
        quantity: 2,
        shippingCost: 2,
        handlingCost: 1,
      }),
      makeProduct({
        productId: "b",
        costOfGoods: 5,
        quantity: 3,
        shippingCost: 1,
        handlingCost: 0,
      }),
    ],
    TIER
  );
  // COGS: 10*2 + 5*3 = 35
  assert.equal(r.productCOGS, 35);
  // Fulfillment: (2+1)*2 + (1+0)*3 = 6 + 3 = 9
  assert.equal(r.fulfillmentCost, 9);
  assert.equal(r.paymentProcessing, 0);
  assert.equal(r.totalCOGS, 44);
  assert.equal(r.profitPerSubscriber, 56);
  assert.equal(r.healthStatus, "healthy");
});

test("payment processing applied once per subscription", () => {
  const r = computeTierFinancials(
    [
      makeProduct({
        costOfGoods: 10,
        quantity: 1,
        paymentProcessingPct: 2.9,
        paymentProcessingFlat: 0.3,
      }),
    ],
    TIER
  );
  // Processing: 100 * 0.029 + 0.3 = 3.2
  assert.ok(Math.abs(r.paymentProcessing - 3.2) < 0.0001);
  assert.ok(Math.abs(r.totalCOGS - 13.2) < 0.0001);
  assert.ok(Math.abs(r.profitPerSubscriber - 86.8) < 0.0001);
});

test("loss-making selection yields negative profit and loss status", () => {
  const r = computeTierFinancials(
    [
      makeProduct({
        costOfGoods: 80,
        quantity: 2,
        shippingCost: 5,
        handlingCost: 2,
      }),
    ],
    { monthlyPrice: 100 }
  );
  // COGS: 160, fulfillment: (5+2)*2 = 14, total: 174
  assert.equal(r.totalCOGS, 174);
  assert.equal(r.profitPerSubscriber, -74);
  assert.equal(r.healthStatus, "loss");
});

test("tight margin status kicks in between 10% and 30%", () => {
  const r = computeTierFinancials(
    [makeProduct({ costOfGoods: 80, quantity: 1 })],
    { monthlyPrice: 100 }
  );
  // Profit 20, margin 20% — tight.
  assert.equal(r.profitPerSubscriber, 20);
  assert.equal(r.grossMarginPct, 20);
  assert.equal(r.healthStatus, "tight");
});
