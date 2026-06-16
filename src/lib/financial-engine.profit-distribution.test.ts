import { describe, it, expect } from "vitest";
import {
  calculateScenario,
  PROJECTION_MONTHS,
  type FinancialInputs,
  type ProfitSplitParty,
  type MonthlyPartyDistribution,
} from "./financial-engine";

// Same audit scenario pinned across the engine suite (aggregate-scalars),
// parameterized by profit-split parties. Parties do NOT enter the
// revenue/cost math, so the historical pins ($879,956 accrual / $990,498
// cash) hold for ANY party set — verified by [P4] below.
function buildAuditScenario(parties: ProfitSplitParty[]): FinancialInputs {
  return {
    tiers: [{ tierId: "Solo", monthlyPrice: 50, biannualPricePerMonth: 40, annualPricePerMonth: 30, monthlyCredits: 0, apparelCOGSPerMonth: 0, packageCOGSPerSub: 5, subscriberPercent: 100, churnRateMonthly: 5, minimumCommitMonths: 1, avgShippingCost: 3, avgHandlingCost: 2, processingFeePct: 0, processingFeeFlat: 0, commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 } }],
    billingCycleDistribution: { monthly: 60, biannual: 20, annual: 20 }, creditRedemptionRate: 0, avgCOGSToMemberPriceRatio: 0, breakageRate: 0, fulfillmentCostPerOrder: 0, shippingCostPerOrder: 0,
    commissionStructure: { upfrontType: "flat", flatBonusPerSale: 50, upfrontPercent: 0, residualPercent: 5, residualDelayMonths: 0, tierBonuses: [], percentHittingAccelerator: 0, acceleratorMultiplier: 1, acceleratorThreshold: 1.5, clawbackWindowDays: 0, payoutDelayMonths: 0 },
    salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 0 },
    samplerChannel: { monthlyMarketingSpend: 0, costPerSampler: 0, conversionRate: 0, monthlyGrowthRate: 0 }, partnerKickbacks: [],
    operationalOverhead: { mode: "categories", fixedMonthly: 1000, categories: [{ id: "ops", name: "Ops", milestones: [{ memberCount: 0, monthlyCost: 1000 }] }] },
    profitSplitParties: parties,
    chargebackPercent: 0, chargebackFee: 0, buckPlatformFeePerSub: 5, buckTokenCostPerSub: 2, welcomeKitCostPerSub: 25,
  };
}

// Under-allocated set (Σ = 90) so `undistributed` (10%) is exercised.
const PARTIES: ProfitSplitParty[] = [
  { id: "bu", name: "Bucked Up", percent: 60 },
  { id: "mitch", name: "Mitch", percent: 30 },
];

const TOL = 0.4;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("S1 — monthly profit distribution per basis (additive plumbing)", () => {
  const r = calculateScenario(buildAuditScenario(PARTIES));
  const pd = r.profitDistribution;

  it("populates accrual + cash for every month (1..36)", () => {
    expect(pd.accrual).toHaveLength(PROJECTION_MONTHS);
    expect(pd.cash).toHaveLength(PROJECTION_MONTHS);
    expect(pd.accrual.map((m) => m.month)).toEqual(pd.cash.map((m) => m.month));
    expect(pd.accrual[0].month).toBe(1);
    expect(pd.accrual[PROJECTION_MONTHS - 1].month).toBe(36);
  });

  it("[P1] Σ accrual distributable == Σ cohortProjection.netProfit", () => {
    const distributable = sum(pd.accrual.map((m) => m.distributable));
    const netProfit = sum(r.cohortProjection.map((m) => m.netProfit));
    expect(Math.abs(distributable - netProfit)).toBeLessThan(TOL);
  });

  it("[P2] Σ cash distributable == (Σ cohort lifecycle netProfit − Σ overhead)", () => {
    const cashDistributable = sum(pd.cash.map((m) => m.distributable));
    const cohortNet = sum(
      r.cohortLifecycles.flatMap((c) => c.months.map((mo) => mo.netProfit)),
    );
    const overhead = sum(r.cohortProjection.map((m) => m.operationalOverhead));
    expect(Math.abs(cashDistributable - (cohortNet - overhead))).toBeLessThan(TOL);
  });

  it("[P3] conservation: Σ byParty.amount + Σ undistributed == Σ distributable (both bases)", () => {
    for (const basis of [pd.accrual, pd.cash]) {
      const distributable = sum(basis.map((m) => m.distributable));
      const distributed = sum(basis.flatMap((m) => m.byParty.map((b) => b.amount)));
      const undistributed = sum(basis.map((m) => m.undistributed));
      expect(Math.abs(distributed + undistributed - distributable)).toBeLessThan(TOL);
    }
  });

  it("[P4] historical pins unchanged: 879,956 accrual / 990,498 cash / 110,542 deferred", () => {
    const accrual = sum(r.cohortProjection.map((m) => m.revenue));
    const cash = sum(r.cohortLifecycles.map((c) => c.totals.revenue));
    expect(Math.round(accrual)).toBe(879_956);
    expect(Math.round(cash)).toBe(990_498);
    expect(Math.round(cash - accrual)).toBe(110_542);
  });

  it("[P5] new accrual totals reconcile with legacy profitSplit per party", () => {
    // Audit scenario is profitable on average, so the legacy clamp
    // (netMarginDollars > 0) is inactive and legacy.monthlyAmount × 36
    // equals the new path's Σ-of-months accrual total.
    expect(r.netMarginDollars).toBeGreaterThan(0);
    for (const legacy of r.profitSplit.parties) {
      const fresh = pd.totals.accrual.find((p) => p.partyId === legacy.id)!;
      expect(fresh).toBeDefined();
      expect(Math.abs(fresh.amount - legacy.monthlyAmount * PROJECTION_MONTHS)).toBeLessThan(TOL);
    }
  });

  it("undistributed reflects the 10% residual share (Σ = 90)", () => {
    const distributable = sum(pd.accrual.map((m) => m.distributable));
    const undistributed = sum(pd.accrual.map((m) => m.undistributed));
    expect(Math.abs(undistributed - distributable * 0.1)).toBeLessThan(TOL);
  });
});

describe("S2 — cost attribution cascade (shared/party)", () => {
  // Same audit scenario, parameterized by attribution. Σpercent = 90 (PARTIES)
  // keeps `undistributed` (10%) live so its share of attribution is exercised.
  const baseInputs = buildAuditScenario(PARTIES);
  const allShared = calculateScenario(baseInputs).profitDistribution;
  // buckPlatform → "bu" (a real party); single rubric so the add-back is clean.
  const attributed = calculateScenario({
    ...baseInputs,
    costAttribution: { buckPlatform: { partyId: "bu" } },
  }).profitDistribution;

  const partyNet = (basis: MonthlyPartyDistribution[], partyId: string) =>
    sum(basis.map((m) => m.byParty.find((b) => b.partyId === partyId)?.net ?? 0));

  it("[S2-P1] all-shared ⇒ S1: channelResult=distributable, partyCost=0, net=amount", () => {
    for (const basis of [allShared.accrual, allShared.cash]) {
      for (const m of basis) {
        expect(Math.abs(m.channelResult - m.distributable)).toBeLessThan(TOL);
        for (const b of m.byParty) {
          expect(b.partyCost).toBe(0);
          expect(Math.abs(b.net - b.amount)).toBeLessThan(TOL);
        }
      }
    }
  });

  it("[S2-P2] channel invariant: Σ channelResult == Σ netProfit_S1 (both bases), with costs attributed", () => {
    const r = calculateScenario({
      ...baseInputs,
      costAttribution: { buckPlatform: { partyId: "bu" }, welcomeKit: { partyId: "mitch" } },
    });
    const accrualNet = sum(r.cohortProjection.map((m) => m.netProfit));
    const accrualChannel = sum(r.profitDistribution.accrual.map((m) => m.channelResult));
    expect(Math.abs(accrualChannel - accrualNet)).toBeLessThan(TOL);

    const cohortNet = sum(r.cohortLifecycles.flatMap((c) => c.months.map((mo) => mo.netProfit)));
    const overhead = sum(r.cohortProjection.map((m) => m.operationalOverhead));
    const cashChannel = sum(r.profitDistribution.cash.map((m) => m.channelResult));
    expect(Math.abs(cashChannel - (cohortNet - overhead))).toBeLessThan(TOL);
  });

  it("[S2-P3] conservation per month/basis: Σ net + undistributed == channelResult", () => {
    for (const basis of [attributed.accrual, attributed.cash]) {
      for (const m of basis) {
        const netSum = sum(m.byParty.map((b) => b.net));
        expect(Math.abs(netSum + m.undistributed - m.channelResult)).toBeLessThan(TOL);
      }
    }
  });

  it("[S2-P4] economics of attribution: channel unchanged; net[bu] −(1−%)·c; net[other] +%·c; undist +undistPct·c", () => {
    for (const key of ["accrual", "cash"] as const) {
      const base = allShared[key];
      const attr = attributed[key];
      // The add-back equals the buckPlatform cost per month → its sum.
      const cTotal = sum(attr.map((m, i) => m.distributable - base[i].distributable));
      expect(cTotal).toBeGreaterThan(1); // buckPlatform is materially nonzero

      const channelDelta = sum(attr.map((m, i) => m.channelResult - base[i].channelResult));
      expect(Math.abs(channelDelta)).toBeLessThan(TOL);

      expect(Math.abs(partyNet(attr, "bu") - partyNet(base, "bu") - -(1 - 0.6) * cTotal)).toBeLessThan(TOL);
      expect(Math.abs(partyNet(attr, "mitch") - partyNet(base, "mitch") - 0.3 * cTotal)).toBeLessThan(TOL);

      const undDelta = sum(attr.map((m) => m.undistributed)) - sum(base.map((m) => m.undistributed));
      expect(Math.abs(undDelta - 0.1 * cTotal)).toBeLessThan(TOL);
    }
  });

  it("[S2-P5] migration: absent == empty map == ghost partyId (all collapse to S1)", () => {
    const absent = allShared;
    const empty = calculateScenario({ ...baseInputs, costAttribution: {} }).profitDistribution;
    const ghost = calculateScenario({
      ...baseInputs,
      costAttribution: { cogs: { partyId: "ghost" } },
    }).profitDistribution;
    for (const key of ["accrual", "cash"] as const) {
      const netOf = (pd: typeof absent) => sum(pd[key].flatMap((m) => m.byParty.map((b) => b.net)));
      expect(Math.abs(netOf(empty) - netOf(absent))).toBeLessThan(TOL);
      expect(Math.abs(netOf(ghost) - netOf(absent))).toBeLessThan(TOL);
      // ghost partyId is treated as shared → no party is charged
      for (const m of ghost[key]) for (const b of m.byParty) expect(b.partyCost).toBe(0);
    }
  });
});
