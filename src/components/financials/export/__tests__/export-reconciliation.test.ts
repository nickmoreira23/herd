import { describe, it, expect } from "vitest";
import { calculateScenario, type FinancialInputs } from "@/lib/financial-engine";
import { buildProjectionSheet } from "../build-projection-sheet";
import { buildCohortAggregateSheet } from "../build-cohort-aggregate-sheet";
import type { ExportSheet } from "../types";

// Stub translator — echoes the key so rows can be located by their i18n key.
// Numeric assertions are label-agnostic, so this is sufficient.
const t = (key: string) => key;

// Identical to the audit scenario pinned across the engine test suite
// (financial-engine.aggregate-scalars.test.ts). 50 acquisitions/mo, no rep
// growth, 5%/mo churn, 36 months → $879,956 accrual / $990,498 cash.
function buildAuditScenario(): FinancialInputs {
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

function sumRow(sheet: ExportSheet, label: string): number {
  for (const section of sheet.sections) {
    const row = section.rows.find((r) => r.label === label);
    if (row) return row.values.reduce((a, b) => a + b, 0);
  }
  throw new Error(`row not found: ${label}`);
}

describe("Projections export — audit reconciliation (anti-drift)", () => {
  const results = calculateScenario(buildAuditScenario());

  it("projection sheet Subscription Revenue Σ = $879,956 (accrual pin)", () => {
    const sheet = buildProjectionSheet(results, buildAuditScenario(), 36, t);
    const sum = sumRow(sheet, "financials.projection.row.subscription_revenue");
    expect(Math.round(sum)).toBe(879_956);
  });

  it("cohort aggregate sheet Subscription Revenue Σ = $990,498 (cash pin)", () => {
    const sheet = buildCohortAggregateSheet(results, buildAuditScenario(), 36, t);
    const sum = sumRow(sheet, "financials.projection.row.subscription_revenue");
    expect(Math.round(sum)).toBe(990_498);
  });

  it("cohort aggregate cash exceeds projection accrual by deferred revenue ($110,542)", () => {
    const proj = buildProjectionSheet(results, buildAuditScenario(), 36, t);
    const agg = buildCohortAggregateSheet(results, buildAuditScenario(), 36, t);
    const accrual = sumRow(proj, "financials.projection.row.subscription_revenue");
    const cash = sumRow(agg, "financials.projection.row.subscription_revenue");
    expect(Math.round(cash - accrual)).toBe(110_542);
  });
});
