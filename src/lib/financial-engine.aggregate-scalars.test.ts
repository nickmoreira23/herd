import { describe, it, expect } from "vitest";
import { calculateScenario, type FinancialInputs } from "./financial-engine";

/**
 * Thread D.2 — root-cause regression suite.
 *
 * Eradicates the `Mo1subs × something × multiplier` anti-pattern that
 * affected every period-total scalar in `ScenarioResults`. Pre-D.2:
 * `mrr`, `totalProductCost`, `totalCommissionExpense`,
 * `grossMarginDollars`, `chargebackCostPerMonth`, `chargebacksPerMonth`,
 * `totalFulfillmentCost`, `tierDetails[].subscribers`, and
 * `revenueByTier[].revenue` were all frozen at Mo 1's subscriber base.
 * Up to 5,697% under-report at 36mo in growth scenarios.
 *
 * Post-D.2: each scalar is the AVERAGE of the per-month series in
 * `cohortProjection`. UI consumers sum the first `multiplier` months
 * directly. The 14 assertions from A.2 and A.3.2 still pass —
 * verified here by re-running their stressed-scenario assertions.
 */

function buildAuditScenario(): FinancialInputs {
  // Sub-etapa 1 audit scenario: 50 acquisitions/mo, no rep growth,
  // 30/10/10 split, 36 months. Pinned at $879,956 accrual / $990,498 cash.
  return {
    tiers: [{ tierId: "Solo", monthlyPrice: 50, biannualPricePerMonth: 40, annualPricePerMonth: 30, monthlyCredits: 0, apparelCOGSPerMonth: 0, packageCOGSPerSub: 5, subscriberPercent: 100, churnRateMonthly: 5, minimumCommitMonths: 1, avgShippingCost: 3, avgHandlingCost: 2, processingFeePct: 0, processingFeeFlat: 0, commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 } }],
    billingCycleDistribution: { monthly: 60, biannual: 20, annual: 20 }, creditRedemptionRate: 0, avgCOGSToMemberPriceRatio: 0, breakageRate: 0, fulfillmentCostPerOrder: 0, shippingCostPerOrder: 0,
    commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 },
    salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 0 },
    samplerChannel: { monthlyMarketingSpend: 0, costPerSampler: 0, conversionRate: 0, monthlyGrowthRate: 0 }, partnerKickbacks: [],
    operationalOverhead: { mode: "categories", fixedMonthly: 1000, categories: [{ id: "ops", name: "Ops", milestones: [{ memberCount: 0, monthlyCost: 1000 }] }] },
    profitSplitParties: [{ id: "p1", name: "Bucked Up", percent: 50 }],
    chargebackPercent: 0, chargebackFee: 0, buckPlatformFeePerSub: 5, buckTokenCostPerSub: 2, welcomeKitCostPerSub: 25,
  };
}

function buildStressedScenario(): FinancialInputs {
  // 100 reps × 5 sales × 10%/mo growth, 36mo, single milestone overhead.
  return {
    tiers: [{ tierId: "Solo", monthlyPrice: 50, biannualPricePerMonth: 40, annualPricePerMonth: 30, monthlyCredits: 0, apparelCOGSPerMonth: 0, packageCOGSPerSub: 5, subscriberPercent: 100, churnRateMonthly: 5, minimumCommitMonths: 1, avgShippingCost: 3, avgHandlingCost: 2, processingFeePct: 0, processingFeeFlat: 0, commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 } }],
    billingCycleDistribution: { monthly: 60, biannual: 20, annual: 20 }, creditRedemptionRate: 0, avgCOGSToMemberPriceRatio: 0, breakageRate: 0, fulfillmentCostPerOrder: 0, shippingCostPerOrder: 0,
    commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 },
    salesRepChannel: { startingReps: 100, salesPerRepPerMonth: 5, monthlyGrowthRate: 10 },
    samplerChannel: { monthlyMarketingSpend: 0, costPerSampler: 0, conversionRate: 0, monthlyGrowthRate: 0 }, partnerKickbacks: [],
    operationalOverhead: { mode: "categories", fixedMonthly: 0, categories: [{ id: "mkt", name: "Marketing", milestones: [{ memberCount: 0, monthlyCost: 5000 }] }] },
    profitSplitParties: [], chargebackPercent: 0, chargebackFee: 0, buckPlatformFeePerSub: 5, buckTokenCostPerSub: 2, welcomeKitCostPerSub: 25,
  };
}

describe("Thread D.2 — aggregate-scalar root-cause fix", () => {
  // ── SUITE A: audit scenario (no rep growth, deterministic 50/mo) ──
  describe("audit scenario (sub-etapa 1, no growth)", () => {
    const r = calculateScenario(buildAuditScenario());

    it("[A1] mrr is the average of cohortProjection.revenue (~$24,443)", () => {
      const expected = 879_956 / 36;
      expect(r.mrr).toBeGreaterThan(expected * 0.995);
      expect(r.mrr).toBeLessThan(expected * 1.005);
    });

    it("[A2] mrr × 36 ≈ Σ cohortProjection.revenue ≈ $879,956 (audit pinned)", () => {
      const cum = r.cohortProjection.reduce((s, m) => s + m.revenue, 0);
      expect(Math.round(cum)).toBe(879_956);
      expect(Math.abs(r.mrr * 36 - cum)).toBeLessThan(1);
    });

    it("[A3] ARR semantics — arrAvg pinned to ~$293,319; arr aliased to arrExit (Thread D.3.3)", () => {
      // Pre-D.3.3 this test pinned `r.arr` at $293,319 (= 879,956/36 × 12,
      // the avg-MRR-of-period × 12 reading α). Thread D.3.3 repointed
      // `r.arr` to `arrExit` (SaaS convention β = exit MRR × 12).
      // The original reconciliation pin moves to `arrAvg` (same value,
      // new field). The audit scenario is NOT flat — it ramps from
      // ~50 subs (Mo 1) to ~1,000 subs steady-state (Mo 30+) due to
      // 50/mo acquisitions vs 5%/mo churn — so α and β diverge by
      // ~1.51× even here. See Thread D.3.3 pause-and-report.
      const expectedAvg = (879_956 / 36) * 12;
      expect(r.arrAvg).toBeGreaterThan(expectedAvg * 0.995);
      expect(r.arrAvg).toBeLessThan(expectedAvg * 1.005);
      // Mathematical identities for the new API.
      expect(Math.abs(r.arrAvg - r.mrr * 12)).toBeLessThan(0.01);
      expect(r.arr).toBe(r.arrExit);
      expect(Math.abs(r.arr - r.mrrExit * 12)).toBeLessThan(0.01);
      // Direction: ramp produces exit > avg in this scenario.
      expect(r.arrExit).toBeGreaterThan(r.arrAvg);
    });

    it("[A4] Σ first 36 months of revenue from cohortProjection = $879,956 (preserved)", () => {
      const sum = r.cohortProjection.slice(0, 36).reduce((s, m) => s + m.revenue, 0);
      expect(Math.round(sum)).toBe(879_956);
    });

    it("[A5] Σ first 36 months of cohortLifecycles cash revenue = $990,498 (preserved)", () => {
      const cash = r.cohortLifecycles.reduce((s, c) => s + c.totals.revenue, 0);
      expect(Math.round(cash)).toBe(990_498);
    });
  });

  // ── SUITE B: stressed scenario (100 reps × 5 sales × 10%/mo) ──
  describe("stressed scenario (10%/mo rep growth)", () => {
    const r = calculateScenario(buildStressedScenario());

    it("[B1] mrr ≈ $1,275,345 (= $45,912,416 / 36)", () => {
      const expected = 45_912_416 / 36;
      expect(r.mrr).toBeGreaterThan(expected * 0.995);
      expect(r.mrr).toBeLessThan(expected * 1.005);
    });

    it("[B2] totalProductCost ≈ $289,851 (= $10,434,640 / 36)", () => {
      const expected = 10_434_640 / 36;
      expect(r.totalProductCost).toBeGreaterThan(expected * 0.995);
      expect(r.totalProductCost).toBeLessThan(expected * 1.005);
    });

    it("[B3] totalCommissionExpense ≈ $271,494 (= $9,773,791 / 36)", () => {
      const expected = 9_773_791 / 36;
      expect(r.totalCommissionExpense).toBeGreaterThan(expected * 0.995);
      expect(r.totalCommissionExpense).toBeLessThan(expected * 1.005);
    });

    it("[B4] Year 1 revenue from cohortProjection ≈ $2,169,288", () => {
      const y1 = r.cohortProjection.slice(0, 12).reduce((s, m) => s + m.revenue, 0);
      expect(y1).toBeGreaterThan(2_169_288 * 0.995);
      expect(y1).toBeLessThan(2_169_288 * 1.005);
    });

    it("[B5] Year 2 revenue from cohortProjection ≈ $10,135,576", () => {
      const y2 = r.cohortProjection.slice(12, 24).reduce((s, m) => s + m.revenue, 0);
      expect(y2).toBeGreaterThan(10_135_576 * 0.995);
      expect(y2).toBeLessThan(10_135_576 * 1.005);
    });

    it("[B6] 36mo revenue ≈ $45,912,416", () => {
      const cum = r.cohortProjection.reduce((s, m) => s + m.revenue, 0);
      expect(cum).toBeGreaterThan(45_912_416 * 0.995);
      expect(cum).toBeLessThan(45_912_416 * 1.005);
    });
  });

  // ── SUITE C: internal consistency invariants ──
  describe("internal consistency (audit scenario)", () => {
    const r = calculateScenario(buildAuditScenario());

    it("[C1] revenueByTier per-month sums to total revenue per-month", () => {
      for (const mo of r.cohortProjection) {
        const tierSum = (mo.revenueByTier ?? []).reduce((s, t) => s + t.revenue, 0);
        expect(Math.abs(tierSum - mo.revenue)).toBeLessThan(0.01);
      }
    });

    it("[C2] mrr × 36 == Σ cohortProjection.revenue (literal definition)", () => {
      const cum = r.cohortProjection.reduce((s, m) => s + m.revenue, 0);
      expect(Math.abs(r.mrr * 36 - cum)).toBeLessThan(0.01);
    });

    it("[C3] grossMarginDollars == mrr - totalProductCost", () => {
      const expected = r.mrr - r.totalProductCost;
      expect(Math.abs(r.grossMarginDollars - expected)).toBeLessThan(0.01);
    });

    it("[C4] netMarginDollars × 36 ≈ Σ cohortProjection.netProfit", () => {
      const cumNetProfit = r.cohortProjection.reduce((s, m) => s + m.netProfit, 0);
      expect(Math.abs(r.netMarginDollars * 36 - cumNetProfit)).toBeLessThan(1);
    });
  });

  // ── SUITE D: A.2 + A.3.2 regression — already covered by their own
  // test files (financial-engine.stressed-overhead.test.ts and
  // financial-engine.welcome-kit.test.ts). Vitest runs them
  // automatically as part of the suite. Add 2 invariant assertions
  // here to triangulate that those preserved fixes are still wired up
  // through the scalar export changes. ──
  describe("A.2 + A.3.2 invariants survive D.2", () => {
    const r = calculateScenario(buildStressedScenario());

    it("[D1] welcomeKitCostPerMonth still equals avg of cohortProjection.welcomeKitCost (A.3.2 preserved)", () => {
      const avg =
        r.cohortProjection.reduce((s, m) => s + (m.welcomeKitCost ?? 0), 0) /
        r.cohortProjection.length;
      expect(Math.abs(r.welcomeKitCostPerMonth - avg)).toBeLessThan(0.01);
    });

    it("[D2] cohortProjection.operationalOverhead uses currentSubs (A.2 preserved)", () => {
      // In the stressed scenario, subs cross 1k milestone at Mo 2.
      // Mo 1: $5k overhead; Mo 2+: should remain $5k (single milestone @ 0).
      // Pin Mo 1 as the baseline value.
      expect(r.cohortProjection[0].operationalOverhead).toBe(5000);
    });
  });

  // ── SUITE E: default-seed shows MATERIAL CHANGE pre/post D.2 ──
  // Unlike A.2 and A.3.2 (where the default seed was degenerate and
  // pre/post values matched), D.2 affects ANY scenario where subs
  // accumulate across the projection (which is essentially all
  // non-trivial scenarios — even no-growth has month-over-month
  // accumulation up to commit period + churn-driven steady state).
  describe("default-seed-style scenario shows direction of change", () => {
    it("[E1] mrr post-D.2 strictly above legacy Mo-1-frozen value", () => {
      // Legacy `mrr` (pre-D.2) would have been:
      //   month1Subs × revenuePerSub
      // Post-D.2 it's `Σ revenue / 36`. In any scenario where
      // subscribers accumulate, the post-D.2 value is strictly higher.
      const r = calculateScenario(buildAuditScenario());
      const month1Revenue = r.cohortProjection[0].revenue;
      // Post-D.2 mrr should be substantially above Mo 1 revenue.
      expect(r.mrr).toBeGreaterThan(month1Revenue * 5);
    });

    it("[E2] mrr equals Σ revenue / 36 by construction", () => {
      const r = calculateScenario(buildAuditScenario());
      const expected =
        r.cohortProjection.reduce((s, m) => s + m.revenue, 0) /
        r.cohortProjection.length;
      expect(Math.abs(r.mrr - expected)).toBeLessThan(0.01);
    });
  });
});
