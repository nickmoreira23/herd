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
// Effective rate per level = mix-weighted average of its qualifications (S8.1):
//   local    = (2·3 + 1·2)/3 = 2.6667%
//   regional = (1·1.5 + 1·1)/2 = 1.25%
//   Σ        = 3.9167% ⇒ rate ≈ 0.039167
const PLAN: LeadershipCompPlan = {
  enabled: true,
  base: "revenue",
  levels: [
    { id: "local", name: "Local", span: 1, baseRatePct: 0, baseMixPct: 0, qualifications: [
      { id: "l-b", name: "Bronze", ratePct: 3, mixPct: 2 },
      { id: "l-p", name: "Prata", ratePct: 2, mixPct: 1 },
    ] },
    { id: "regional", name: "Regional", span: 1, baseRatePct: 0, baseMixPct: 0, qualifications: [
      { id: "r-b", name: "Bronze", ratePct: 1.5, mixPct: 1 },
      { id: "r-p", name: "Prata", ratePct: 1, mixPct: 1 },
    ] },
  ],
};

// Recomputed from the fixture so the pin tracks the plan, not a hardcoded const.
const RATE = PLAN.levels.reduce((s, lvl) => {
  const mix = lvl.qualifications.reduce((m, q) => m + q.mixPct, 0);
  return s + lvl.qualifications.reduce((r, q) => r + q.mixPct * q.ratePct, 0) / mix / 100;
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
    { id: "local", name: "Local", span: 20, baseRatePct: 0, baseMixPct: 0, qualifications: [
      { id: "l-b", name: "Bronze", ratePct: 3, mixPct: 2 },
      { id: "l-p", name: "Prata", ratePct: 2, mixPct: 1 },
    ] },
    { id: "regional", name: "Regional", span: 2, baseRatePct: 0, baseMixPct: 0, qualifications: [
      { id: "r-b", name: "Bronze", ratePct: 1.5, mixPct: 1 },
      { id: "r-p", name: "Prata", ratePct: 1, mixPct: 1 },
    ] },
  ],
};
// Mirror the engine's per-level effective rate + cumulative-span threshold.
const RAMP_LEVELS = (() => {
  let cum = 1;
  return RAMP_PLAN.levels.map((lvl) => {
    const mix = lvl.qualifications.reduce((m, q) => m + q.mixPct, 0);
    const effectiveRate = lvl.qualifications.reduce((r, q) => r + q.mixPct * q.ratePct, 0) / mix / 100;
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
        levels: [{ id: "local", name: "Local", span: 100_000, baseRatePct: 0, baseMixPct: 0, qualifications: [
          { id: "l-b", name: "Bronze", ratePct: 3, mixPct: 2 },
          { id: "l-p", name: "Prata", ratePct: 2, mixPct: 1 },
        ] }],
      },
    });
    expect(accrualLeadership(neverActive)).toBe(0);
    expect(cashLeadership(neverActive)).toBe(0);
    // Full-active (span:1) reproduces total coverage = revenue × RATE.
    const full = calculateScenario({ ...buildAuditScenario(PARTIES), leadershipCompPlan: PLAN });
    const revAccrual = sum(full.cohortProjection.map((m) => m.revenue));
    expect(Math.abs(accrualLeadership(full) - revAccrual * RATE)).toBeLessThan(TOL);
  });

  it("[S8.2-P1] base rate is the level's effective rate with no qualifications", () => {
    // No qualifications + base rate 0 ⇒ cost 0.
    const zeroBase = calculateScenario({
      ...buildAuditScenario(PARTIES),
      leadershipCompPlan: {
        enabled: true,
        base: "revenue",
        levels: [{ id: "local", name: "Local", span: 1, baseRatePct: 0, baseMixPct: 100, qualifications: [] }],
      },
    });
    expect(accrualLeadership(zeroBase)).toBe(0);
    expect(cashLeadership(zeroBase)).toBe(0);
    // No qualifications + base rate 5% ⇒ effective rate = 5% (base is 100%).
    const baseOnly = calculateScenario({
      ...buildAuditScenario(PARTIES),
      leadershipCompPlan: {
        enabled: true,
        base: "revenue",
        levels: [{ id: "local", name: "Local", span: 1, baseRatePct: 5, baseMixPct: 100, qualifications: [] }],
      },
    });
    const rev = sum(baseOnly.cohortProjection.map((m) => m.revenue));
    expect(Math.abs(accrualLeadership(baseOnly) - rev * 0.05)).toBeLessThan(TOL);
  });

  it("[S8.2-P2] base + qualification blend by mix into the effective rate", () => {
    // Base 4% @ 60% mix + a qualification 10% @ 40% mix ⇒ effective rate
    // = (60·4 + 40·10)/100 / 100 = 6.4% = 0.064.
    const r = calculateScenario({
      ...buildAuditScenario(PARTIES),
      leadershipCompPlan: {
        enabled: true,
        base: "revenue",
        levels: [{ id: "local", name: "Local", span: 1, baseRatePct: 4, baseMixPct: 60, qualifications: [
          { id: "q1", name: "Bronze", ratePct: 10, mixPct: 40 },
        ] }],
      },
    });
    const rev = sum(r.cohortProjection.map((m) => m.revenue));
    expect(Math.abs(accrualLeadership(r) - rev * 0.064)).toBeLessThan(TOL);
  });
});

describe("[sales-team] headcount per level over the projection window", () => {
  // Two levels above the reps: Local (span 5 ⇒ threshold 5) and Regional
  // (span 4 ⇒ cumulative threshold 20). Reps grow so headcount crosses spans.
  const PLAN_ST: LeadershipCompPlan = {
    enabled: true,
    base: "revenue",
    levels: [
      { id: "local", name: "Local", span: 5, baseRatePct: 5, baseMixPct: 100, qualifications: [] },
      { id: "regional", name: "Regional", span: 4, baseRatePct: 3, baseMixPct: 100, qualifications: [] },
    ],
  };
  const inputs: FinancialInputs = {
    ...buildAuditScenario(PARTIES),
    salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 10 },
    leadershipCompPlan: PLAN_ST,
  };

  it("[ST-P1] levels are ordered TOP → BASE with cumulative-span thresholds", () => {
    const st = calculateScenario(inputs).salesTeam;
    expect(st.levels.map((l) => l.id)).toEqual(["regional", "local"]);
    expect(st.levels.map((l) => l.threshold)).toEqual([20, 5]);
  });

  it("[ST-P2] headcount = floor(activeReps / threshold) every month; reps row mirrors activeReps", () => {
    const r = calculateScenario(inputs);
    const st = r.salesTeam;
    r.cohortProjection.forEach((m, i) => {
      expect(st.repsByMonth[i]).toBe(m.activeReps);
      for (const lvl of st.levels) {
        expect(lvl.headcountByMonth[i]).toBe(Math.floor(m.activeReps / lvl.threshold));
      }
    });
  });

  it("[ST-P3] headcount is non-decreasing while reps grow (growth ≥ 0, no rep churn)", () => {
    const st = calculateScenario(inputs).salesTeam;
    for (const lvl of st.levels) {
      for (let i = 1; i < lvl.headcountByMonth.length; i++) {
        expect(lvl.headcountByMonth[i]).toBeGreaterThanOrEqual(lvl.headcountByMonth[i - 1]);
      }
    }
  });

  it("[ST-P4] no leadership plan ⇒ no levels, reps row still present", () => {
    const st = calculateScenario(buildAuditScenario(PARTIES)).salesTeam;
    expect(st.levels).toEqual([]);
    expect(st.repsByMonth.length).toBeGreaterThan(0);
    expect(st.repsByMonth.every((n) => n >= 0)).toBe(true);
  });
});

describe("[member-earnings] individual career-trajectory earnings", () => {
  // Flat reps from month 1 (startingReps 10, growth 0) ⇒ the channel is exactly
  // 10 identical reps, so channel commission must equal reps × single-rep earning.
  const flat = buildAuditScenario(PARTIES); // no leadership plan

  it("[PM-P1] rep accrual reconciles with the channel (flat reps ⇒ channel = reps × rep)", () => {
    const r = calculateScenario(flat);
    const me = r.memberEarnings;
    const channelTotal = sum(r.cohortProjection.map((m) => m.commissionExpense ?? 0));
    const reps = r.cohortProjection[0].activeReps; // flat across the window
    const repTotal = sum(me.reps.accrual.total);
    expect(reps).toBe(10);
    expect(Math.abs(channelTotal - reps * repTotal) / channelTotal).toBeLessThan(0.01);
  });

  it("[PM-P2] rep upfront is steady (no payout delay), residual ramps then stays positive", () => {
    const me = calculateScenario(flat).memberEarnings.reps.accrual;
    // Audit: flatBonus 50 × 5 sales/mo, no chargeback ⇒ 250/mo upfront, every month.
    for (const u of me.upfront) expect(Math.abs(u - 250)).toBeLessThan(1);
    // Residual builds as the book grows: month 6 > month 1, and is positive late.
    expect(me.residual[5]).toBeGreaterThan(me.residual[0]);
    expect(me.residual[me.residual.length - 1]).toBeGreaterThan(0);
  });

  it("[PM-P3] cash total = upfront + cash residual; upfront identical across bases", () => {
    const me = calculateScenario(flat).memberEarnings.reps;
    expect(me.cash.upfront).toEqual(me.accrual.upfront);
    me.cash.total.forEach((tot, i) => {
      expect(Math.abs(tot - (me.cash.upfront[i] + me.cash.residual[i]))).toBeLessThan(1e-6);
    });
  });

  it("[PM-P4] manager per-member = level override × threshold / reps; zero before activation; top→base", () => {
    const plan: LeadershipCompPlan = {
      enabled: true,
      base: "revenue",
      levels: [
        { id: "local", name: "Local", span: 5, baseRatePct: 5, baseMixPct: 100, qualifications: [] },
        { id: "regional", name: "Regional", span: 4, baseRatePct: 3, baseMixPct: 100, qualifications: [] },
      ],
    };
    // Growth so reps cross thresholds (5 and 20) over the window.
    const r = calculateScenario({
      ...flat,
      salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 10 },
      leadershipCompPlan: plan,
    });
    const me = r.memberEarnings;
    // Order top→base mirrors salesTeam.levels.
    expect(me.levels.map((l) => l.id)).toEqual(r.salesTeam.levels.map((l) => l.id));
    expect(me.levels.map((l) => l.id)).toEqual(["regional", "local"]);
    const regional = me.levels.find((l) => l.id === "regional")!;
    r.cohortProjection.forEach((m, i) => {
      if (m.activeReps < 20) expect(regional.accrual[i]).toBe(0); // not yet activated (threshold 20)
      else expect(regional.accrual[i]).toBeGreaterThan(0);
    });
  });

  it("[PM-P5] no leadership plan ⇒ no manager rows, rep series present on both bases", () => {
    const me = calculateScenario(flat).memberEarnings;
    expect(me.levels).toEqual([]);
    expect(me.reps.accrual.total.length).toBe(me.reps.cash.total.length);
    expect(me.reps.accrual.total.length).toBeGreaterThan(0);
  });

  it("[PM-P6] single-rep production reconciles with the channel (flat reps ⇒ channel = reps × rep)", () => {
    const r = calculateScenario(flat); // flat 10 reps from month 1
    const reps = r.cohortProjection[0].activeReps;
    expect(reps).toBe(10);
    // Active subscribers: channel ≈ reps × one rep's book, month by month.
    r.cohortProjection.forEach((m, i) => {
      const channel = m.subscribers;
      const fromOne = reps * r.memberEarnings.reps.subscribers[i];
      expect(Math.abs(channel - fromOne) / Math.max(1, channel)).toBeLessThan(0.02);
    });
    // Accrual revenue: same reconciliation over the window.
    const channelRev = sum(r.cohortProjection.map((m) => m.revenue));
    const repRev = reps * sum(r.memberEarnings.reps.revenue.accrual);
    expect(Math.abs(channelRev - repRev) / channelRev).toBeLessThan(0.02);
    // New subscribers per month are positive and present.
    expect(r.memberEarnings.reps.newSubscribers.length).toBe(r.cohortProjection.length);
    expect(r.memberEarnings.reps.newSubscribers[0]).toBeGreaterThan(0);
  });

  it("[PM-P7] single-rep gross/chargebacks reconcile to net (gross − chargebacks = net new)", () => {
    const r = calculateScenario(flat);
    const { grossNewSubs, chargebacks, newSubscribers } = r.memberEarnings.reps;
    expect(grossNewSubs.length).toBe(r.cohortProjection.length);
    expect(chargebacks.length).toBe(r.cohortProjection.length);
    grossNewSubs.forEach((gross, i) => {
      // net = gross − chargebacks, month by month.
      expect(gross - chargebacks[i]).toBeCloseTo(newSubscribers[i], 6);
      expect(gross).toBeGreaterThanOrEqual(newSubscribers[i]);
    });
  });
});
