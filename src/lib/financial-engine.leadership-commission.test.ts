import { describe, it, expect } from "vitest";
import {
  calculateScenario,
  type FinancialInputs,
  type ProfitSplitParty,
  type LeadershipCompPlan,
  type ScenarioResults,
} from "./financial-engine";

// Same audit scenario pinned across the engine suite (revenue 879,956 accrual
// / 990,498 cash). Leadership commission is a COST — it never moves revenue.
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

const PARTIES: ProfitSplitParty[] = [
  { id: "bu", name: "Bucked Up", percent: 60 },
  { id: "mitch", name: "Mitch", percent: 30 }, // Σ = 90 ⇒ 10% undistributed
];

// Two-level leadership chain. Effective rate per level = headcount-weighted
// average of bronze/prata tier rates. The engine SUMS the effective rates.
//   local    = (2·3 + 1·2)/3 = 2.6667%
//   regional = (1·1.5 + 1·1)/2 = 1.25%
//   Σ        = 3.9167% ⇒ rate ≈ 0.039167
const PLAN: LeadershipCompPlan = {
  enabled: true,
  base: "revenue",
  levels: [
    { id: "local", name: "Local", tiers: { bronze: { ratePct: 3 }, prata: { ratePct: 2 } }, headcount: { bronze: 2, prata: 1 } },
    { id: "regional", name: "Regional", tiers: { bronze: { ratePct: 1.5 }, prata: { ratePct: 1 } }, headcount: { bronze: 1, prata: 1 } },
  ],
};

// Recomputed from the fixture so the pin tracks the plan, not a hardcoded const.
const RATE = PLAN.levels.reduce((s, lvl) => {
  const hc = lvl.headcount.bronze + lvl.headcount.prata;
  return s + (lvl.headcount.bronze * lvl.tiers.bronze.ratePct + lvl.headcount.prata * lvl.tiers.prata.ratePct) / hc / 100;
}, 0);

const TOL = 0.5;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const accrualLeadership = (r: ScenarioResults) => sum(r.cohortProjection.map((m) => m.leadershipCommissionCost ?? 0));
const cashLeadership = (r: ScenarioResults) => sum(r.cohortLifecycles.flatMap((c) => c.months.map((mo) => mo.leadershipCommissionCost)));

describe("S6 — leadership commission engine (static headcount)", () => {
  it("[S6-P1] cost = base × Σ effective rate, per basis; revenue pins unmoved", () => {
    const r = calculateScenario({ ...buildAuditScenario(PARTIES), leadershipCompPlan: PLAN });
    const revAccrual = sum(r.cohortProjection.map((m) => m.revenue));
    const revCash = sum(r.cohortLifecycles.map((c) => c.totals.revenue));
    // Revenue is untouched (cost-only change).
    expect(Math.round(revAccrual)).toBe(879_956);
    expect(Math.round(revCash)).toBe(990_498);
    // Accrual leadership = recognized-revenue × rate; cash = collected-revenue × rate.
    expect(Math.abs(accrualLeadership(r) - revAccrual * RATE)).toBeLessThan(TOL);
    expect(Math.abs(cashLeadership(r) - revCash * RATE)).toBeLessThan(TOL);
    // Sanity: the cost is materially non-zero.
    expect(accrualLeadership(r)).toBeGreaterThan(30_000);
  });

  it("[S6-P2] plan absent or enabled:false ⇒ cost 0 ⇒ identical behavior", () => {
    const off = calculateScenario(buildAuditScenario(PARTIES));
    const disabled = calculateScenario({
      ...buildAuditScenario(PARTIES),
      leadershipCompPlan: { enabled: false, base: "revenue", levels: PLAN.levels },
    });
    expect(accrualLeadership(off)).toBe(0);
    expect(accrualLeadership(disabled)).toBe(0);
    expect(cashLeadership(off)).toBe(0);
    expect(cashLeadership(disabled)).toBe(0);
    // netProfit series byte-identical between absent and disabled.
    off.cohortProjection.forEach((m, i) =>
      expect(Math.abs(m.netProfit - disabled.cohortProjection[i].netProfit)).toBeLessThan(1e-9),
    );
    // Revenue pins intact with the feature wired but off.
    expect(Math.round(sum(off.cohortProjection.map((m) => m.revenue)))).toBe(879_956);
  });

  it("[S6-P3] channelResult ≡ netProfit holds with the cost present (shared AND party)", () => {
    const base = { ...buildAuditScenario(PARTIES), leadershipCompPlan: PLAN, lossHandling: "proportional" as const };
    const shared = calculateScenario(base);
    shared.profitDistribution.accrual.forEach((d, i) =>
      expect(Math.abs(d.channelResult - shared.cohortProjection[i].netProfit)).toBeLessThan(TOL),
    );
    const attr = calculateScenario({ ...base, costAttribution: { leadershipCommission: { partyId: "bu" } } });
    attr.profitDistribution.accrual.forEach((d, i) =>
      expect(Math.abs(d.channelResult - attr.cohortProjection[i].netProfit)).toBeLessThan(TOL),
    );
  });

  it("[S6-P4] attributing leadership to a party follows the [S2-P4] economy", () => {
    const base = { ...buildAuditScenario(PARTIES), leadershipCompPlan: PLAN, lossHandling: "proportional" as const };
    const shared = calculateScenario(base);
    const attr = calculateScenario({ ...base, costAttribution: { leadershipCommission: { partyId: "bu" } } });
    const C = accrualLeadership(shared); // total cost (attribution-independent)
    const net = (r: ScenarioResults, id: string) =>
      r.profitDistribution.totals.accrual.find((p) => p.partyId === id)!.netTotal;
    // owner: −(1−%)·C ; other: +%·C
    expect(Math.abs((net(attr, "bu") - net(shared, "bu")) - -(1 - 0.6) * C)).toBeLessThan(TOL);
    expect(Math.abs((net(attr, "mitch") - net(shared, "mitch")) - 0.3 * C)).toBeLessThan(TOL);
    // channel unchanged (canal 0)
    const ch = (r: ScenarioResults) => sum(r.profitDistribution.accrual.map((d) => d.channelResult));
    expect(Math.abs(ch(attr) - ch(shared))).toBeLessThan(TOL);
  });

  it("[S6-P5] base variants (smoke): repCommission + margin track their base × rate", () => {
    const rep = calculateScenario({ ...buildAuditScenario(PARTIES), leadershipCompPlan: { ...PLAN, base: "repCommission" } });
    const expectedRep = sum(rep.cohortProjection.map((m) => m.commissionExpense ?? 0)) * RATE;
    expect(Math.abs(accrualLeadership(rep) - expectedRep)).toBeLessThan(TOL);
    const margin = calculateScenario({ ...buildAuditScenario(PARTIES), leadershipCompPlan: { ...PLAN, base: "margin" } });
    const expectedMargin = sum(margin.cohortProjection.map((m) => m.revenue - (m.cogsExpense ?? 0))) * RATE;
    expect(Math.abs(accrualLeadership(margin) - expectedMargin)).toBeLessThan(TOL);
  });
});
