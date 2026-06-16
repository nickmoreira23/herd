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

// FULL-ACTIVE config: span:1 ⇒ threshold 1 ⇒ every level active from month 1
// (the audit scenario holds activeReps = 10 flat). This reproduces S6's
// total-coverage cost (cost = base × Σ effective rate every month) under the
// S7 activation model — the equivalence used to migrate the S6 pins.
// Effective rate per level = tier-mix-weighted average of bronze/prata rates:
//   local    = (2·3 + 1·2)/3 = 2.6667%
//   regional = (1·1.5 + 1·1)/2 = 1.25%
//   Σ        = 3.9167% ⇒ rate ≈ 0.039167
const PLAN: LeadershipCompPlan = {
  enabled: true,
  base: "revenue",
  levels: [
    { id: "local", name: "Local", tiers: { bronze: { ratePct: 3 }, prata: { ratePct: 2 } }, tierMix: { bronze: 2, prata: 1 }, span: 1 },
    { id: "regional", name: "Regional", tiers: { bronze: { ratePct: 1.5 }, prata: { ratePct: 1 } }, tierMix: { bronze: 1, prata: 1 }, span: 1 },
  ],
};

// Recomputed from the fixture so the pin tracks the plan, not a hardcoded const.
const RATE = PLAN.levels.reduce((s, lvl) => {
  const mix = lvl.tierMix.bronze + lvl.tierMix.prata;
  return s + (lvl.tierMix.bronze * lvl.tiers.bronze.ratePct + lvl.tierMix.prata * lvl.tiers.prata.ratePct) / mix / 100;
}, 0);

const TOL = 0.5;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const accrualLeadership = (r: ScenarioResults) => sum(r.cohortProjection.map((m) => m.leadershipCommissionCost ?? 0));
const cashLeadership = (r: ScenarioResults) => sum(r.cohortLifecycles.flatMap((c) => c.months.map((mo) => mo.leadershipCommissionCost)));

describe("S6/S7 — leadership commission, FULL-ACTIVE config (== total coverage)", () => {
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

// ── S7: dynamic threshold activation via activeReps ──────────────────────────
// A rep ramp (10 reps growing 50%/mo): 10, 15, 22.5, 33.75, 50.6, … crosses
// the local threshold (span 20) then the regional threshold (span 20×2 = 40),
// so coverage climbs 0 → local → local+regional over time.
const RAMP_PLAN: LeadershipCompPlan = {
  enabled: true,
  base: "revenue",
  levels: [
    { id: "local", name: "Local", tiers: { bronze: { ratePct: 3 }, prata: { ratePct: 2 } }, tierMix: { bronze: 2, prata: 1 }, span: 20 },
    { id: "regional", name: "Regional", tiers: { bronze: { ratePct: 1.5 }, prata: { ratePct: 1 } }, tierMix: { bronze: 1, prata: 1 }, span: 2 },
  ],
};
// Mirror the engine's per-level effective rate + cumulative-span threshold.
const RAMP_LEVELS = (() => {
  let cum = 1;
  return RAMP_PLAN.levels.map((lvl) => {
    const mix = lvl.tierMix.bronze + lvl.tierMix.prata;
    const effectiveRate = (lvl.tierMix.bronze * lvl.tiers.bronze.ratePct + lvl.tierMix.prata * lvl.tiers.prata.ratePct) / mix / 100;
    cum *= lvl.span;
    return { effectiveRate, threshold: cum };
  });
})();
const rateAt = (reps: number) => RAMP_LEVELS.reduce((s, l) => s + (reps >= l.threshold ? l.effectiveRate : 0), 0);
const rampScenario = () => ({
  ...buildAuditScenario(PARTIES),
  salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 50 },
  leadershipCompPlan: RAMP_PLAN,
});

describe("S7 — leadership commission, dynamic threshold activation", () => {
  it("[S7-P1] activation timeline: cost = revenue × rate of ACTIVE levels each month; steps up", () => {
    const r = calculateScenario(rampScenario());
    const distinctRates = new Set<number>();
    r.cohortProjection.forEach((m) => {
      const expected = m.revenue * rateAt(m.activeReps);
      expect(Math.abs((m.leadershipCommissionCost ?? 0) - expected)).toBeLessThan(TOL);
      distinctRates.add(Number(rateAt(m.activeReps).toFixed(8)));
    });
    // The ramp crosses both thresholds ⇒ 3 coverage levels: none / local / local+regional.
    expect(distinctRates.size).toBeGreaterThanOrEqual(3);
  });

  it("[S7-P2] partial coverage: a local-only month costs revenue × localRate (regional excluded)", () => {
    const r = calculateScenario(rampScenario());
    const localOnly = r.cohortProjection.find(
      (m) => m.activeReps >= RAMP_LEVELS[0].threshold && m.activeReps < RAMP_LEVELS[1].threshold,
    );
    expect(localOnly).toBeDefined();
    expect(
      Math.abs((localOnly!.leadershipCommissionCost ?? 0) - localOnly!.revenue * RAMP_LEVELS[0].effectiveRate),
    ).toBeLessThan(TOL);
    // And an early month below the local threshold is exactly zero.
    const none = r.cohortProjection.find((m) => m.activeReps < RAMP_LEVELS[0].threshold);
    expect(none).toBeDefined();
    expect(none!.leadershipCommissionCost ?? 0).toBe(0);
  });

  it("[S7-P3] channelResult ≡ netProfit holds despite activation discontinuities (shared AND party)", () => {
    const base = { ...rampScenario(), lossHandling: "proportional" as const };
    const shared = calculateScenario(base);
    shared.profitDistribution.accrual.forEach((d, i) =>
      expect(Math.abs(d.channelResult - shared.cohortProjection[i].netProfit)).toBeLessThan(TOL),
    );
    // Cash basis: channelResult must stay ≡ distributable − Σ partyCost (the
    // ADD-BACK identity) with the dynamic leadership cost present per month.
    shared.profitDistribution.cash.forEach((d) =>
      expect(Math.abs(d.channelResult - (d.distributable - sum(d.byParty.map((b) => b.partyCost))))).toBeLessThan(TOL),
    );
    const attr = calculateScenario({ ...base, costAttribution: { leadershipCommission: { partyId: "bu" } } });
    attr.profitDistribution.accrual.forEach((d, i) =>
      expect(Math.abs(d.channelResult - attr.cohortProjection[i].netProfit)).toBeLessThan(TOL),
    );
  });

  it("[S7-P4] regression: off ⇒ 0; never-active spans ⇒ 0; full-active ⇒ total coverage", () => {
    // Off (no plan).
    const off = calculateScenario(buildAuditScenario(PARTIES));
    expect(accrualLeadership(off)).toBe(0);
    expect(cashLeadership(off)).toBe(0);
    // Enabled but thresholds never crossed (huge spans) ⇒ no level activates ⇒ 0.
    const neverActive = calculateScenario({
      ...buildAuditScenario(PARTIES),
      leadershipCompPlan: {
        enabled: true,
        base: "revenue",
        levels: [{ id: "local", name: "Local", tiers: { bronze: { ratePct: 3 }, prata: { ratePct: 2 } }, tierMix: { bronze: 2, prata: 1 }, span: 100_000 }],
      },
    });
    expect(accrualLeadership(neverActive)).toBe(0);
    expect(cashLeadership(neverActive)).toBe(0);
    // Full-active (span:1) reproduces total coverage = revenue × RATE.
    const full = calculateScenario({ ...buildAuditScenario(PARTIES), leadershipCompPlan: PLAN });
    const revAccrual = sum(full.cohortProjection.map((m) => m.revenue));
    expect(Math.abs(accrualLeadership(full) - revAccrual * RATE)).toBeLessThan(TOL);
  });
});
