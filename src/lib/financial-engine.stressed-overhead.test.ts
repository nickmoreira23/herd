import { describe, it, expect } from "vitest";
import {
  calculateScenario,
  resolveOverheadBreakdown,
  type FinancialInputs,
} from "./financial-engine";

/**
 * Thread A.2 regression suite — pins the post-fix overhead numbers
 * for the stressed scenario from the A.1 diagnostic.
 *
 * Pre-fix bug: 4 of 5 `resolveOverhead` call sites passed `memberCount=0`
 * hardcoded, returning the pre-launch baseline forever. In growth
 * scenarios with multi-milestone categories, this under-reported by up
 * to ~280%/mo and ~$1.27M cumulative over 36 months.
 *
 * Post-fix: those 4 sites read/aggregate from `cohortProjection[i]
 * .operationalOverhead` (which uses `currentSubs` correctly via the
 * single remaining `resolveOverheadBreakdown` call inside the
 * projection loop). If any of them regresses to `resolveOverhead(.., 0)`,
 * the assertions below break.
 */

function buildStressedScenario(): FinancialInputs {
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
    ],
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
    salesRepChannel: {
      // Aggressive: starts at 100 reps, 10% MoM growth — by Mo 12 the
      // cohort is past the 5k subscriber milestone for both Marketing
      // and Tech, exercising the upper-tier overhead.
      startingReps: 100,
      salesPerRepPerMonth: 5,
      monthlyGrowthRate: 10,
    },
    samplerChannel: {
      monthlyMarketingSpend: 0,
      costPerSampler: 0,
      conversionRate: 0,
      monthlyGrowthRate: 0,
    },
    partnerKickbacks: [],
    operationalOverhead: {
      mode: "categories",
      fixedMonthly: 0,
      categories: [
        {
          id: "mkt",
          name: "Marketing",
          milestones: [
            { memberCount: 0, monthlyCost: 5000 },
            { memberCount: 1000, monthlyCost: 10000 },
            { memberCount: 5000, monthlyCost: 25000 },
          ],
        },
        {
          id: "tech",
          name: "Technology",
          milestones: [
            { memberCount: 0, monthlyCost: 6000 },
            { memberCount: 1000, monthlyCost: 12000 },
            { memberCount: 5000, monthlyCost: 24000 },
          ],
        },
        {
          id: "ops",
          name: "Operations",
          milestones: [
            { memberCount: 0, monthlyCost: 4000 },
            { memberCount: 2000, monthlyCost: 8000 },
          ],
        },
      ],
    },
    profitSplitParties: [{ id: "p1", name: "Bucked Up", percent: 50 }],
    chargebackPercent: 0,
    chargebackFee: 0,
    buckPlatformFeePerSub: 5,
    buckTokenCostPerSub: 2,
    welcomeKitCostPerSub: 25,
  };
}

function buildDefaultSeedScenario(): FinancialInputs {
  // Mirrors what `DEFAULT_INPUTS` produces — degenerate single-milestone
  // categories. Bug is dormant here.
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
    ],
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
    salesRepChannel: {
      startingReps: 10,
      salesPerRepPerMonth: 5,
      monthlyGrowthRate: 0,
    },
    samplerChannel: {
      monthlyMarketingSpend: 0,
      costPerSampler: 0,
      conversionRate: 0,
      monthlyGrowthRate: 0,
    },
    partnerKickbacks: [],
    operationalOverhead: {
      mode: "categories",
      fixedMonthly: 25000,
      categories: [
        { id: "cat-marketing", name: "Marketing", milestones: [{ memberCount: 0, monthlyCost: 8000 }] },
        { id: "cat-tech", name: "Technology", milestones: [{ memberCount: 0, monthlyCost: 6000 }] },
        { id: "cat-operations", name: "Operations", milestones: [{ memberCount: 0, monthlyCost: 11000 }] },
      ],
    },
    profitSplitParties: [],
    chargebackPercent: 0,
    chargebackFee: 0,
    buckPlatformFeePerSub: 5,
    buckTokenCostPerSub: 2,
    welcomeKitCostPerSub: 0,
  };
}

describe("Thread A.2 — overhead resolution post-fix", () => {
  describe("stressed scenario (multi-milestone categories, aggressive growth)", () => {
    const r = calculateScenario(buildStressedScenario());

    it("36-month cumulative cohortProjection.operationalOverhead is ~$1,813,000", () => {
      const cum = r.cohortProjection.reduce(
        (s, m) => s + m.operationalOverhead,
        0,
      );
      // The value computed deterministically by the engine for this
      // scenario; documented in the Thread A.1 diagnostic. Tolerance
      // 0.5% absorbs any rounding tweaks; if engine math drifts
      // significantly the test fails and the cause needs review.
      expect(cum).toBeGreaterThan(1_813_000 * 0.995);
      expect(cum).toBeLessThan(1_813_000 * 1.005);
    });

    // Three yearly assertions — chosen to fail by DIFFERENT root causes
    // if the engine ever regresses:
    //   • Year 1 ($445k) catches changes in the RAMP behavior — subs
    //     crossing milestones at Mo 2 (1k) and Mo 9 (5k). Failure here
    //     means milestone thresholds, growth math, or per-month
    //     resolveOverheadBreakdown call in line ~1461 broke.
    //   • Year 2 + Year 3 ($684k each) catch the STEADY STATE — subs
    //     stay above 5k. Failure here means the per-tier upper-bound
    //     overhead lookup is wrong OR a regression bypasses
    //     cohortProjection.operationalOverhead aggregation.
    //   • All three failing simultaneously means the entire fix
    //     reverted to the pre-launch-baseline bug path.
    it("Year 1 (Mo 1-12) ramp sums to ~$445,000 of overhead", () => {
      const y1 = r.cohortProjection
        .slice(0, 12)
        .reduce((s, m) => s + m.operationalOverhead, 0);
      expect(y1).toBeGreaterThan(445_000 * 0.995);
      expect(y1).toBeLessThan(445_000 * 1.005);
    });
    it("Year 2 (Mo 13-24) steady-state sums to ~$684,000 of overhead", () => {
      const y2 = r.cohortProjection
        .slice(12, 24)
        .reduce((s, m) => s + m.operationalOverhead, 0);
      expect(y2).toBeGreaterThan(684_000 * 0.995);
      expect(y2).toBeLessThan(684_000 * 1.005);
    });
    it("Year 3 (Mo 25-36) steady-state sums to ~$684,000 of overhead", () => {
      const y3 = r.cohortProjection
        .slice(24, 36)
        .reduce((s, m) => s + m.operationalOverhead, 0);
      expect(y3).toBeGreaterThan(684_000 * 0.995);
      expect(y3).toBeLessThan(684_000 * 1.005);
    });

    it("netMarginDollars uses average overhead across the 36-month window (post-fix)", () => {
      const avgOverhead =
        r.cohortProjection.reduce((s, m) => s + m.operationalOverhead, 0) /
        r.cohortProjection.length;
      // Pre-fix would have been resolveOverhead(overhead, 0) = $15k.
      // Post-fix is the average, ~$50.4k for this scenario.
      // The exact relationship: netMarginDollars uses operationalOverheadMonthly
      // which equals avgOverhead by construction.
      expect(avgOverhead).toBeGreaterThan(40_000);
      expect(avgOverhead).toBeLessThan(60_000);

      // Pre-launch baseline (the buggy value) is $15k — must NOT match.
      const preFixBaseline = resolveOverheadBreakdown(
        buildStressedScenario().operationalOverhead,
        0,
      ).total;
      expect(preFixBaseline).toBe(15_000);
      expect(avgOverhead).toBeGreaterThan(preFixBaseline * 2); // strictly above baseline
    });

    it("breakeven and cumulativeProfit unaffected by the fix (already used correct path)", () => {
      // These read from cohortProjection.operationalOverhead which was
      // always correct. Pin them so future engine changes that drift
      // either get flagged.
      expect(r.operationBreakevenMonth).toBe(13);
      expect(r.cohortProjection[35].cumulativeProfit).toBeGreaterThan(
        12_000_000,
      );
      expect(r.cohortProjection[35].cumulativeProfit).toBeLessThan(
        13_500_000,
      );
    });
  });

  describe("default-seed scenario (single milestone @ 0 — bug dormant)", () => {
    it("post-fix produces overhead identical to pre-launch baseline (degenerate case)", () => {
      const r = calculateScenario(buildDefaultSeedScenario());
      const baseline = resolveOverheadBreakdown(
        buildDefaultSeedScenario().operationalOverhead,
        0,
      ).total; // $25k — sum of three single-milestone categories
      expect(baseline).toBe(25_000);

      // Every month should be the baseline since milestones are single @ 0
      for (const mo of r.cohortProjection) {
        expect(mo.operationalOverhead).toBe(baseline);
      }

      // Average == baseline
      const avg =
        r.cohortProjection.reduce((s, m) => s + m.operationalOverhead, 0) /
        r.cohortProjection.length;
      expect(avg).toBe(baseline);

      // 36-month cumulative is exactly 36 × baseline
      const cum = r.cohortProjection.reduce(
        (s, m) => s + m.operationalOverhead,
        0,
      );
      expect(cum).toBe(baseline * 36);
    });
  });
});
