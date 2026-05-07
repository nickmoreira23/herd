import { describe, it, expect } from "vitest";
import { summarizeReconciliation } from "./accounting-basis-reconciliation";
import {
  calculateScenario,
  type FinancialInputs,
} from "@/lib/financial-engine";

/**
 * Sub-etapa 2 — verifies the reconciliation derivation against the audit
 * scenario from sub-etapa 1. The acceptance criteria fix the expected
 * totals at $879,956 / $990,498 / $110,542; this test pins them so any
 * future engine change that drifts the math gets flagged.
 */
describe("summarizeReconciliation", () => {
  it("delta = cash − accrual on a hand-checked window", () => {
    const accrual = [100, 200, 300]; // sum 600
    const cash = [120, 220, 360]; // sum 700
    const r = summarizeReconciliation(accrual, cash, { start: 1, end: 3 });
    expect(r.accrualTotal).toBe(600);
    expect(r.cashTotal).toBe(700);
    expect(r.deferred).toBe(100);
  });

  it("respects monthRange (1-indexed inclusive)", () => {
    const accrual = [10, 20, 30, 40, 50];
    const cash = [11, 22, 33, 44, 55];
    const r = summarizeReconciliation(accrual, cash, { start: 2, end: 4 });
    expect(r.accrualTotal).toBe(20 + 30 + 40);
    expect(r.cashTotal).toBe(22 + 33 + 44);
    expect(r.deferred).toBe(99 - 90);
  });

  it("matches the audit scenario totals exactly ($879,956 / $990,498 / $110,542)", () => {
    // Same inputs as the audit script (sub-etapa 1).
    const inputs: FinancialInputs = {
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
        fixedMonthly: 1000,
        categories: [
          {
            id: "ops",
            name: "Ops",
            milestones: [{ memberCount: 0, monthlyCost: 1000 }],
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

    const r = calculateScenario(inputs);

    // Accrual series: cohortProjection.revenue (smoothed per-sub blend).
    const accrualSeries = r.cohortProjection.map((m) => m.revenue);

    // Cash series: aggregate-from-cohorts by calendar month.
    const cashSeries: number[] = Array.from(
      { length: r.cohortProjection.length },
      (_, i) => {
        const K = i + 1;
        return r.cohortLifecycles.reduce((sum, c) => {
          const e = c.months.find((m) => m.monthIndex === K);
          return sum + (e?.revenue ?? 0);
        }, 0);
      },
    );

    const summary = summarizeReconciliation(accrualSeries, cashSeries, {
      start: 1,
      end: 36,
    });

    // Expected pinned by the audit (sub-etapa 1).
    expect(Math.round(summary.accrualTotal)).toBe(879_956);
    expect(Math.round(summary.cashTotal)).toBe(990_498);
    expect(Math.round(summary.deferred)).toBe(110_542);
  });

  it("deferred is non-negative when cash > accrual (prepayment property)", () => {
    // Deferred should always be ≥ 0 in well-formed projections — cash
    // collected leads recognized revenue because biannual/annual subs
    // prepay. If this ever flips, the engine has a bug.
    const accrualSeries = [100, 100, 100];
    const cashSeries = [120, 100, 100]; // one prepayment
    const r = summarizeReconciliation(accrualSeries, cashSeries, {
      start: 1,
      end: 3,
    });
    expect(r.deferred).toBeGreaterThanOrEqual(0);
  });
});
