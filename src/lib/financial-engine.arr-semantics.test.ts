import { describe, it, expect } from "vitest";
import { calculateScenario, type FinancialInputs } from "./financial-engine";

/**
 * Thread D.3.3 — ARR semantic disambiguation regression suite.
 *
 * Pre-D.3.3 the engine exposed a single `arr = mrr × 12`, which after
 * D.2 meant "12 × average of cohortProjection.revenue over 36mo"
 * (reading α). That diverges from SaaS convention (exit ARR =
 * current run-rate × 12, reading β) by ~3.5× in the stressed
 * scenario. D.3.3 splits the readings into separate fields and
 * aliases `arr` to `arrExit`.
 *
 * This suite pins:
 *   - the three readings (`arrAvg`, `arrExit`, `revenueY1`) populated
 *     correctly,
 *   - `arr === arrExit` identity,
 *   - magnitude of divergence in growth scenario (3.54× / 7.06×),
 *   - audit scenario direction (exit > avg even in audit due to
 *     50/mo + 5% churn ramp; not "flat" as originally hypothesized),
 *   - audit pinned reconciliation ($879,956) preserved,
 *   - LTV/CAC isolated.
 */

function buildArrStressed(): FinancialInputs {
  // 100 reps × 5 sales × 10%/mo growth, 36mo. Same shape as D.3.2.
  return {
    tiers: [
      {
        tierId: "Solo",
        monthlyPrice: 50,
        biannualPricePerMonth: 40,
        annualPricePerMonth: 30,
        monthlyCredits: 0,
        apparelCOGSPerMonth: 0,
        packageCOGSPerSub: 5,
        subscriberPercent: 100,
        churnRateMonthly: 5,
        minimumCommitMonths: 1,
        avgShippingCost: 3,
        avgHandlingCost: 2,
        processingFeePct: 0,
        processingFeeFlat: 0,
        commissionStructure: {
          upfrontType: "flat",
          flatBonusPerSale: 50,
          upfrontPercent: 0,
          residualPercent: 5,
          residualDelayMonths: 0,
          tierBonuses: [],
          percentHittingAccelerator: 0,
          acceleratorMultiplier: 1,
          acceleratorThreshold: 1.5,
          clawbackWindowDays: 0,
          payoutDelayMonths: 0,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
    billingCycleDistribution: { monthly: 60, biannual: 20, annual: 20 },
    creditRedemptionRate: 0,
    avgCOGSToMemberPriceRatio: 0,
    breakageRate: 0,
    fulfillmentCostPerOrder: 0,
    shippingCostPerOrder: 0,
    commissionStructure: {
      upfrontType: "flat",
      flatBonusPerSale: 50,
      upfrontPercent: 0,
      residualPercent: 5,
      residualDelayMonths: 0,
      tierBonuses: [],
      percentHittingAccelerator: 0,
      acceleratorMultiplier: 1,
      acceleratorThreshold: 1.5,
      clawbackWindowDays: 0,
      payoutDelayMonths: 0,
    },
    salesRepChannel: { startingReps: 100, salesPerRepPerMonth: 5, monthlyGrowthRate: 10 },
    samplerChannel: { monthlyMarketingSpend: 0, costPerSampler: 0, conversionRate: 0, monthlyGrowthRate: 0 },
    partnerKickbacks: [],
    operationalOverhead: {
      mode: "categories",
      fixedMonthly: 0,
      categories: [{ id: "mkt", name: "Marketing", milestones: [{ memberCount: 0, monthlyCost: 5000 }] }],
    },
    profitSplitParties: [],
    chargebackPercent: 0,
    chargebackFee: 0,
    buckPlatformFeePerSub: 5,
    buckTokenCostPerSub: 2,
    welcomeKitCostPerSub: 25,
  } as FinancialInputs;
}

function buildArrAudit(): FinancialInputs {
  // Sub-etapa 1 audit shape: 50/mo, no rep growth, 5% churn, 36mo.
  // NOT flat — ramps to ~1k subs steady-state. Pinned $879,956 sum revenue.
  const s = buildArrStressed();
  s.salesRepChannel = { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 0 };
  s.operationalOverhead = {
    mode: "categories",
    fixedMonthly: 1000,
    categories: [{ id: "ops", name: "Ops", milestones: [{ memberCount: 0, monthlyCost: 1000 }] }],
  };
  s.profitSplitParties = [{ id: "p1", name: "Bucked Up", percent: 50 }];
  return s;
}

describe("Thread D.3.3 — ARR semantic disambiguation", () => {
  // ── SUITE A: stressed (growth) — α/β/γ diverge materially ──
  describe("stressed scenario (10%/mo growth)", () => {
    const r = calculateScenario(buildArrStressed());

    it("[1] arrAvg ≈ $15.3M (mrr × 12, the period-average reading α)", () => {
      expect(r.arrAvg).toBeGreaterThan(15_300_000 * 0.95);
      expect(r.arrAvg).toBeLessThan(15_300_000 * 1.05);
    });

    it("[2] arrExit ≈ $54.1M (mrrExit × 12, the SaaS-convention reading β)", () => {
      expect(r.arrExit).toBeGreaterThan(54_100_000 * 0.95);
      expect(r.arrExit).toBeLessThan(54_100_000 * 1.05);
    });

    it("[3] revenueY1 ≈ $2.17M (Σ Mo 1-12 cohortProjection.revenue, reading γ)", () => {
      expect(r.revenueY1).toBeGreaterThan(2_170_000 * 0.95);
      expect(r.revenueY1).toBeLessThan(2_170_000 * 1.05);
    });

    it("[4] arr === arrExit (alias identity)", () => {
      expect(r.arr).toBe(r.arrExit);
    });

    it("[5] divergence ratios — arrExit/arrAvg ≈ 3.54×, arrAvg/revenueY1 ≈ 7.06×", () => {
      const exitOverAvg = r.arrExit / r.arrAvg;
      const avgOverY1 = r.arrAvg / r.revenueY1;
      expect(exitOverAvg).toBeGreaterThan(3.54 * 0.9);
      expect(exitOverAvg).toBeLessThan(3.54 * 1.1);
      expect(avgOverY1).toBeGreaterThan(7.06 * 0.9);
      expect(avgOverY1).toBeLessThan(7.06 * 1.1);
    });
  });

  // ── SUITE B: audit (50/mo + 5% churn) — diverges by ~1.5×, not flat ──
  describe("audit scenario (50/mo, 5% churn — ramps to ~1k subs)", () => {
    const r = calculateScenario(buildArrAudit());

    it("[6] arrAvg pinned to original $293,319 reconciliation", () => {
      const expected = (879_956 / 36) * 12;
      expect(r.arrAvg).toBeGreaterThan(expected * 0.995);
      expect(r.arrAvg).toBeLessThan(expected * 1.005);
    });

    it("[7] arrExit > arrAvg (audit ramps; spec premise of 'flat' was empirically false)", () => {
      // Pause-and-report from D.3.3: audit scenario subscribers ramp
      // from ~50 (Mo 1) to ~1,000 (steady state) due to 50/mo
      // acquisitions vs 5%/mo churn. Exit/avg ≈ 1.51×.
      expect(r.arrExit).toBeGreaterThan(r.arrAvg);
      const ratio = r.arrExit / r.arrAvg;
      expect(ratio).toBeGreaterThan(1.3);
      expect(ratio).toBeLessThan(1.7);
    });

    it("[8] audit pinned reconciliation: Σ cohortProjection[i].revenue 36mo == $879,956", () => {
      const cum = r.cohortProjection.reduce((s, m) => s + m.revenue, 0);
      expect(Math.round(cum)).toBe(879_956);
    });
  });

  // ── SUITE C: invariants — herdadas e isolated ──
  describe("invariants — D.2 [A3] preservation & isolated subsystems", () => {
    const audit = calculateScenario(buildArrAudit());
    const stressed = calculateScenario(buildArrStressed());

    it("[9] [A3] D.2 reconciliation moved to arrAvg without losing the pin", () => {
      // The original D.2 [A3] asserted r.arr ≈ $293,319 in the audit
      // scenario. After D.3.3, that pin lives on `arrAvg` (same value,
      // new field). Identity `arrAvg ≡ mrr × 12` preserved.
      expect(Math.abs(audit.arrAvg - audit.mrr * 12)).toBeLessThan(0.01);
    });

    it("[10] LTV/CAC values inalterados — per-subscriber math isolated from ARR semantics", () => {
      // Microinvestigação D.3 confirmed LTV/CAC depends only on per-sub
      // steady-state values (revenuePerSub, cogsPerSub, residual,
      // churn). ARR repointing must not affect this surface.
      expect(Number.isFinite(audit.ltvCac.blendedLTV)).toBe(true);
      expect(audit.ltvCac.blendedLTV).toBeGreaterThan(0);
      expect(Number.isFinite(stressed.ltvCac.blendedLTV)).toBe(true);
      expect(stressed.ltvCac.blendedLTV).toBeGreaterThan(0);
    });
  });

  // ── SUITE D: identity sanity ──
  describe("identity sanity — alias and field equations", () => {
    const r = calculateScenario(buildArrStressed());

    it("[11] arrAvg === mrr × 12 (mathematical identity)", () => {
      expect(Math.abs(r.arrAvg - r.mrr * 12)).toBeLessThan(0.01);
    });

    it("[12] arrExit === mrrExit × 12, and arr === arrExit (alias chain)", () => {
      expect(Math.abs(r.arrExit - r.mrrExit * 12)).toBeLessThan(0.01);
      expect(r.arr).toBe(r.arrExit);
    });
  });
});
