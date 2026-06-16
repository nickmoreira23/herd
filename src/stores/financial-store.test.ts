import { describe, it, expect } from "vitest";
import { useFinancialStore } from "./financial-store";
import type { FinancialInputs } from "@/lib/financial-engine";

// Minimal valid scenario. 10 reps × 5 sales/mo with $1k overhead + $50 upfront
// commission means early months run at a channel loss — so both the
// cost-attribution and loss-handling round-trips have signal. Σpercent = 100
// (so the proportional residual is 0 and absorbed-vs-proportional diverge
// cleanly on the undistributed line).
function baseScenario(): FinancialInputs {
  const commission = {
    upfrontType: "flat" as const,
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
  };
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
        avgShippingCost: 0,
        avgHandlingCost: 0,
        processingFeePct: 0,
        processingFeeFlat: 0,
        commissionStructure: commission,
      },
    ],
    billingCycleDistribution: { monthly: 100, biannual: 0, annual: 0 },
    creditRedemptionRate: 0,
    avgCOGSToMemberPriceRatio: 0,
    breakageRate: 0,
    fulfillmentCostPerOrder: 0,
    shippingCostPerOrder: 0,
    commissionStructure: commission,
    salesRepChannel: { startingReps: 10, salesPerRepPerMonth: 5, monthlyGrowthRate: 0 },
    partnerKickbacks: [],
    operationalOverhead: { mode: "fixed", fixedMonthly: 1000 },
    profitSplitParties: [
      { id: "bu", name: "Bucked Up", percent: 60 },
      { id: "mitch", name: "Mitch", percent: 40 },
    ],
    chargebackPercent: 0,
    chargebackFee: 0,
    buckPlatformFeePerSub: 5,
    buckTokenCostPerSub: 2,
    welcomeKitCostPerSub: 25,
    // Explicit defaults so each setInputs() is a full reset (no leak across tests).
    costAttribution: {},
    lossHandling: "absorbed",
    lossBearerPartyId: undefined,
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const run = (overrides: Partial<FinancialInputs>) => {
  useFinancialStore.getState().setInputs({ ...baseScenario(), ...overrides });
  return useFinancialStore.getState().results!;
};

describe("financial-store — S3.5 attribution/loss-handling write-through", () => {
  it("setInputs recalculates results (cascade plumbing present)", () => {
    const r = run({});
    expect(r.profitDistribution.accrual.length).toBeGreaterThan(0);
    expect(r.profitDistribution.totals.accrual.map((p) => p.partyId)).toEqual(["bu", "mitch"]);
  });

  it("costAttribution round-trip: attributing a rubric to a party shows in that party's partyCostTotal", () => {
    const shared = run({ costAttribution: {} });
    const buShared = shared.profitDistribution.totals.accrual.find((p) => p.partyId === "bu")!;
    expect(buShared.partyCostTotal).toBe(0);

    const attributed = run({ costAttribution: { buckPlatform: { partyId: "bu" } } });
    const buAttr = attributed.profitDistribution.totals.accrual.find((p) => p.partyId === "bu")!;
    const mitchAttr = attributed.profitDistribution.totals.accrual.find((p) => p.partyId === "mitch")!;
    expect(buAttr.partyCostTotal).toBeGreaterThan(0); // buck cost now charged to bu
    expect(mitchAttr.partyCostTotal).toBe(0); // other party unaffected
  });

  it("lossHandling round-trip: proportional vs absorbed diverge on the undistributed line", () => {
    // Σpercent = 100 → proportional leaves nothing undistributed; absorbed (no
    // bearer) dumps each loss month's channel loss into undistributed.
    const prop = run({ lossHandling: "proportional" });
    const abs = run({ lossHandling: "absorbed" });
    const undProp = sum(prop.profitDistribution.accrual.map((m) => m.undistributed));
    const undAbs = sum(abs.profitDistribution.accrual.map((m) => m.undistributed));
    expect(Math.abs(undProp)).toBeLessThan(0.5); // ~0 under proportional
    expect(undAbs).toBeLessThan(-1); // absorbed losses land here (negative)
  });

  it("lossBearerPartyId round-trip: bearer absorbs the loss instead of undistributed", () => {
    // Channel is net-profitable over 36mo (early losses, later gains), so the
    // bearer's net stays positive overall — the signal is comparative: with a
    // bearer set, each loss month's loss moves OFF `undistributed` ONTO the
    // bearer, so undistributed → ~0 and the bearer's net drops vs. no-bearer.
    const noBearer = run({ lossHandling: "absorbed" });
    const bearer = run({ lossHandling: "absorbed", lossBearerPartyId: "bu" });
    const buNetAt = (r: typeof noBearer) =>
      r.profitDistribution.totals.accrual.find((p) => p.partyId === "bu")!.netTotal;

    const undNoBearer = sum(noBearer.profitDistribution.accrual.map((m) => m.undistributed));
    const undBearer = sum(bearer.profitDistribution.accrual.map((m) => m.undistributed));
    expect(undNoBearer).toBeLessThan(-1); // losses pool in undistributed when no bearer
    expect(Math.abs(undBearer)).toBeLessThan(0.5); // with a bearer, nothing is left undistributed
    expect(buNetAt(bearer)).toBeLessThan(buNetAt(noBearer)); // bu now carries those losses
  });
});
