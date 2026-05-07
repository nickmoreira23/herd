import { describe, it, expect } from "vitest";
import {
  calculateScenario,
  type FinancialInputs,
} from "./financial-engine";

/**
 * Thread A.3.2 regression suite — pins the post-fix welcome-kit numbers
 * for the same stressed scenario A.2 used.
 *
 * Pre-fix bug: `welcomeKitCostPerMonth` was `month1GrossNewSubs ×
 * welcomeKitCostPerSub` (Mo 1 acquisitions only, frozen at the lowest
 * month of any growth scenario). The 2 consumers that did `× multiplier`
 * (P&L Statement OpEx, engine internal `netMarginDollars`) thus
 * under-reported by up to 1,655% in Year 3 (~$2.5M Year 3 alone) and
 * ~$3.29M cumulative over 36 months.
 *
 * Post-fix: scalar `welcomeKitCostPerMonth` is the AVERAGE of
 * `cohortProjection[i].welcomeKitCost` across the projection window;
 * Statement OpEx welcome-kit line sums the first `multiplier` months
 * directly. Mirror of the Thread A.2 fix for overhead.
 *
 * If any of those 2 sites regresses to the old `× multiplier` pattern,
 * one or more assertions below break.
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
      // Aggressive: 100 reps × 5 sales × 10%/mo growth — same as A.2.
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
          milestones: [{ memberCount: 0, monthlyCost: 5000 }],
        },
      ],
    },
    profitSplitParties: [],
    chargebackPercent: 0,
    chargebackFee: 0,
    buckPlatformFeePerSub: 5,
    buckTokenCostPerSub: 2,
    welcomeKitCostPerSub: 25,
  };
}

function buildDefaultSeedScenario(): FinancialInputs {
  // welcomeKitCostPerSub: 0 — bug dormant by construction.
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
      fixedMonthly: 0,
      categories: [
        {
          id: "mkt",
          name: "Marketing",
          milestones: [{ memberCount: 0, monthlyCost: 5000 }],
        },
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

describe("Thread A.3.2 — welcome-kit linearization fix", () => {
  describe("stressed scenario (acquisitions ramp 10%/mo)", () => {
    const r = calculateScenario(buildStressedScenario());

    // Three yearly assertions, same logic as A.2: each fails by a
    // different root cause if a regression occurs.
    //   • Year 1 ($267,325) catches the RAMP — 12% × 12 cumulative.
    //   • Year 2 ($838,900) catches mid-window growth.
    //   • Year 3 ($2,632,875) catches late-window growth — the
    //     dominant contributor to the cumulative gap.
    it("Year 1 (Mo 1-12) ramp sums to ~$267,325 of welcome kit", () => {
      const y1 = r.cohortProjection
        .slice(0, 12)
        .reduce((s, m) => s + (m.welcomeKitCost ?? 0), 0);
      expect(y1).toBeGreaterThan(267_325 * 0.995);
      expect(y1).toBeLessThan(267_325 * 1.005);
    });
    it("Year 2 (Mo 13-24) sums to ~$838,900 of welcome kit", () => {
      const y2 = r.cohortProjection
        .slice(12, 24)
        .reduce((s, m) => s + (m.welcomeKitCost ?? 0), 0);
      expect(y2).toBeGreaterThan(838_900 * 0.995);
      expect(y2).toBeLessThan(838_900 * 1.005);
    });
    it("Year 3 (Mo 25-36) sums to ~$2,632,875 of welcome kit", () => {
      const y3 = r.cohortProjection
        .slice(24, 36)
        .reduce((s, m) => s + (m.welcomeKitCost ?? 0), 0);
      expect(y3).toBeGreaterThan(2_632_875 * 0.995);
      expect(y3).toBeLessThan(2_632_875 * 1.005);
    });
    it("36-month cumulative cohortProjection.welcomeKitCost is ~$3,739,100", () => {
      const cum = r.cohortProjection.reduce(
        (s, m) => s + (m.welcomeKitCost ?? 0),
        0,
      );
      expect(cum).toBeGreaterThan(3_739_100 * 0.995);
      expect(cum).toBeLessThan(3_739_100 * 1.005);
    });

    it("welcomeKitCostPerMonth scalar is the average (~$103,864), NOT Mo 1 ($12,500)", () => {
      // Pre-fix: scalar = month1GrossNewSubs × welcomeKitCostPerSub
      //        = 500 × $25 = $12,500 (Mo 1 only — buggy)
      // Post-fix: scalar = average of cohortProjection.welcomeKitCost
      //         = $3,739,100 / 36 ≈ $103,864
      expect(r.welcomeKitCostPerMonth).toBeGreaterThan(103_864 * 0.995);
      expect(r.welcomeKitCostPerMonth).toBeLessThan(103_864 * 1.005);
      // Strictly greater than the pre-fix Mo-1-only value. If a
      // regression points the scalar back at Mo 1, this fails.
      expect(r.welcomeKitCostPerMonth).toBeGreaterThan(12_500 * 5);
    });

    it("Statement OpEx welcome-kit at multiplier=12 sums to ~$267,325 (year 1)", () => {
      // Direct mirror of pl-statement.tsx's new computation.
      const stmtYearOneWelcomeKit = r.cohortProjection
        .slice(0, 12)
        .reduce((s, m) => s + (m.welcomeKitCost ?? 0), 0);
      expect(stmtYearOneWelcomeKit).toBeGreaterThan(267_325 * 0.995);
      expect(stmtYearOneWelcomeKit).toBeLessThan(267_325 * 1.005);
    });
  });

  describe("default-seed scenario (welcomeKitCostPerSub: 0 — bug dormant)", () => {
    it("post-fix produces zero welcome kit everywhere (degenerate case)", () => {
      const r = calculateScenario(buildDefaultSeedScenario());
      expect(r.welcomeKitCostPerMonth).toBe(0);
      for (const mo of r.cohortProjection) {
        expect(mo.welcomeKitCost ?? 0).toBe(0);
      }
      const cum = r.cohortProjection.reduce(
        (s, m) => s + (m.welcomeKitCost ?? 0),
        0,
      );
      expect(cum).toBe(0);
    });
  });
});
