// Financial calculation engine for HERD OS
// Pure functions — no server dependencies, usable client-side and server-side

import type { OpexCategoryData } from "./opex-resolver";
import { resolveOpexForMemberCount } from "./opex-resolver";

export interface BillingDistribution {
  monthly: number; // percentage 0-100
  quarterly: number;
  annual: number;
}

export interface TierFinancialInput {
  tierId: string;
  // Plan structure (read-only in UI — sourced from SubscriptionTier table)
  monthlyPrice: number;
  quarterlyPricePerMonth: number;
  annualPricePerMonth: number;
  monthlyCredits: number;
  apparelCOGSPerMonth: number;
  // Performance assumptions (editable in projections)
  subscriberPercent: number; // percentage 0-100
  churnRateMonthly: number; // percentage 0-100
  minimumCommitMonths: number; // minimum contract months before subscriber can cancel (churn delayed)
  // Per-tier overrides (undefined = use global value from FinancialInputs)
  billingDistribution?: BillingDistribution;
  creditRedemptionRate?: number; // 0.0-1.0 scale, overrides global creditRedemptionRate
}

export interface CommissionCalcInput {
  // Upfront commission
  upfrontType: "flat" | "percent"; // flat $ per sale OR % of plan monthly price
  flatBonusPerSale: number; // $ amount when upfrontType === "flat"
  upfrontPercent: number; // % of plan monthly price when upfrontType === "percent"
  // Residual (ongoing monthly)
  residualPercent: number; // ongoing monthly % of subscriber revenue
  residualDelayMonths: number; // 0 = starts immediately, N = residual begins N months after the sale
  // Accelerator
  percentHittingAccelerator: number;
  acceleratorMultiplier: number;
  // Payout timing
  payoutDelayMonths: number; // 0 = immediate, 1+ = deferred upfront payout (months after sale)
  // Legacy / backward compat
  tierBonuses: { tierId: string; flatBonus: number }[];
}

export interface SalesRepChannel {
  startingReps: number;
  salesPerRepPerMonth: number;
  monthlyGrowthRate: number; // percentage 0-100 (e.g., 10 = 10% more reps each month)
}

export interface SamplerChannel {
  monthlyMarketingSpend: number; // $ spent on sampler distribution per month
  costPerSampler: number; // $ cost to produce and distribute one sampler
  conversionRate: number; // percentage 0-100 of sampler recipients who convert
  monthlyGrowthRate: number; // percentage 0-100 spend growth per month
}

export interface PartnerKickbackInput {
  partnerId: string;
  estimatedMonthlyReferrals: number;
  kickbackType: string;
  kickbackValue: number;
}

export interface OperationalOverhead {
  mode: "fixed" | "milestone-scaled";
  fixedMonthly: number;
  opexData?: OpexCategoryData[];
}

export interface ProfitSplitParty {
  id: string;
  name: string;
  percent: number; // 0-100
}

export interface FinancialInputs {
  tiers: TierFinancialInput[];
  billingCycleDistribution: BillingDistribution;
  creditRedemptionRate: number; // 0.0-1.0
  avgCOGSToMemberPriceRatio: number; // typically 0.15-0.30
  breakageRate: number; // 0.0-1.0 — DEPRECATED: now derived as (1 - creditRedemptionRate). Kept for saved snapshot compat.
  fulfillmentCostPerOrder: number;
  shippingCostPerOrder: number;
  commissionStructure: CommissionCalcInput;
  salesRepChannel: SalesRepChannel;
  samplerChannel?: SamplerChannel; // DEPRECATED — sampler channel removed. Kept for saved snapshot compat.
  partnerKickbacks: PartnerKickbackInput[];
  operationalOverhead: OperationalOverhead;
  profitSplitParties: ProfitSplitParty[];
  // Chargebacks
  chargebackPercent: number; // percentage 0-100 of new subscribers that chargeback
  chargebackFee: number; // $ fee per chargeback (processor fee, typically $15-25)
}

// --- Tier-level calculations ---

export function calculateBlendedRevenue(
  monthlyPrice: number,
  quarterlyPricePerMonth: number,
  annualPricePerMonth: number,
  billing: BillingDistribution
): number {
  return (
    (monthlyPrice * billing.monthly +
      quarterlyPricePerMonth * billing.quarterly +
      annualPricePerMonth * billing.annual) /
    100
  );
}

export function calculateCreditCOGS(
  monthlyCredits: number,
  redemptionRate: number,
  cogsToMemberPriceRatio: number
): number {
  return monthlyCredits * redemptionRate * cogsToMemberPriceRatio;
}

export function calculateTotalCOGSPerSub(
  creditCOGS: number,
  apparelCOGS: number,
  fulfillmentCost: number,
  shippingCost: number
): number {
  return creditCOGS + apparelCOGS + fulfillmentCost + shippingCost;
}

export function calculateBreakageProfit(
  monthlyCredits: number,
  breakageRate: number,
  cogsToMemberPriceRatio: number
): number {
  // COGS saved from unredeemed credits
  return monthlyCredits * breakageRate * cogsToMemberPriceRatio;
}

export function calculateGrossMargin(
  revenue: number,
  totalCOGS: number
): { dollars: number; percent: number } {
  const dollars = revenue - totalCOGS;
  const percent = revenue > 0 ? (dollars / revenue) * 100 : 0;
  return { dollars, percent };
}

export function calculateBreakeven(
  fixedCostMonthly: number,
  marginPerSubscriber: number
): number {
  if (marginPerSubscriber <= 0) return Infinity;
  return Math.ceil(fixedCostMonthly / marginPerSubscriber);
}

// --- Commission calculations ---

export function calculateCommissionPerNewSub(
  flatBonus: number,
  percentHittingAccelerator: number,
  acceleratorMultiplier: number
): number {
  const normalRate = 1 - percentHittingAccelerator / 100;
  const acceleratedRate = percentHittingAccelerator / 100;
  return flatBonus * normalRate + flatBonus * acceleratorMultiplier * acceleratedRate;
}

export function calculateResidualCost(
  totalSubscribers: number,
  blendedRevenuePerSub: number,
  residualPercent: number
): number {
  return totalSubscribers * blendedRevenuePerSub * (residualPercent / 100);
}

export function calculateTotalMonthlyCommission(
  newSubscribers: number,
  avgFlatBonus: number,
  totalSubscribers: number,
  blendedRevenuePerSub: number,
  residualPercent: number,
  percentHittingAccelerator: number,
  acceleratorMultiplier: number
): number {
  const effectiveBonus = calculateCommissionPerNewSub(
    avgFlatBonus,
    percentHittingAccelerator,
    acceleratorMultiplier
  );
  const upfrontCost = newSubscribers * effectiveBonus;
  const residualCost = calculateResidualCost(
    totalSubscribers,
    blendedRevenuePerSub,
    residualPercent
  );
  return upfrontCost + residualCost;
}

// --- Fully-loaded commission calculation (D2D plan-aware) ---

export interface FullyLoadedCommissionInput {
  plan: {
    residualPercent: number;
    rates: { tierId: string; roleType: string; upfrontBonus: number; residualPercent: number }[];
  };
  overrides: { roleType: string; overrideType: string; overrideValue: number }[];
  performanceTiers: { minSales: number; maxSales: number | null; bonusMultiplier: number; bonusFlat: number }[];
  orgStructure: {
    totalReps: number;
    totalTeamLeads: number;
    totalRegionalLeaders: number;
    avgSalesPerRep: number;
  };
  tierDistribution: { tierId: string; percent: number }[]; // percent 0-100
  blendedRevenuePerSub: number;
}

export function calculateFullyLoadedCommission(input: FullyLoadedCommissionInput): {
  repUpfront: number;
  repResidual: number;
  teamLeadOverrides: number;
  regionalLeaderOverrides: number;
  accelerators: number;
  totalFullyLoaded: number;
  costPerNewSub: number;
  percentOfRevenue: number;
} {
  const { plan, overrides, performanceTiers, orgStructure, tierDistribution, blendedRevenuePerSub } = input;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { totalReps, totalTeamLeads, totalRegionalLeaders, avgSalesPerRep } = orgStructure;
  const totalNewSales = totalReps * avgSalesPerRep;

  // 1. Rep upfront cost — weighted by tier distribution
  let weightedUpfrontPerSale = 0;
  for (const td of tierDistribution) {
    const repRate = plan.rates.find(r => r.tierId === td.tierId && r.roleType === "REP");
    if (repRate) {
      weightedUpfrontPerSale += repRate.upfrontBonus * (td.percent / 100);
    }
  }
  const repUpfront = totalNewSales * weightedUpfrontPerSale;

  // 2. Rep residual — based on existing subscriber base (estimate: assume totalNewSales as proxy)
  const avgResidualPercent = plan.rates
    .filter(r => r.roleType === "REP")
    .reduce((sum, r) => sum + r.residualPercent, 0) / Math.max(plan.rates.filter(r => r.roleType === "REP").length, 1);
  const repResidual = totalNewSales * blendedRevenuePerSub * (avgResidualPercent / 100);

  // 3. Override costs
  const tlOverride = overrides.find(o => o.roleType === "TEAM_LEAD");
  let teamLeadOverrides = 0;
  if (tlOverride) {
    if (tlOverride.overrideType === "FLAT") {
      teamLeadOverrides = totalNewSales * tlOverride.overrideValue;
    } else if (tlOverride.overrideType === "PERCENT_OF_BONUS") {
      teamLeadOverrides = repUpfront * (tlOverride.overrideValue / 100);
    } else if (tlOverride.overrideType === "PERCENT_OF_REVENUE") {
      teamLeadOverrides = totalNewSales * blendedRevenuePerSub * (tlOverride.overrideValue / 100);
    }
  }

  const rlOverride = overrides.find(o => o.roleType === "REGIONAL_LEADER");
  let regionalLeaderOverrides = 0;
  if (rlOverride) {
    if (rlOverride.overrideType === "FLAT") {
      regionalLeaderOverrides = totalNewSales * rlOverride.overrideValue;
    } else if (rlOverride.overrideType === "PERCENT_OF_BONUS") {
      regionalLeaderOverrides = repUpfront * (rlOverride.overrideValue / 100);
    } else if (rlOverride.overrideType === "PERCENT_OF_REVENUE") {
      regionalLeaderOverrides = totalNewSales * blendedRevenuePerSub * (rlOverride.overrideValue / 100);
    }
  }

  // 4. Accelerator costs — estimate based on performance tier distribution
  let accelerators = 0;
  if (performanceTiers.length > 0 && totalReps > 0) {
    // Distribute reps across performance tiers based on sales volume
    for (const pt of performanceTiers) {
      // Simple estimate: what fraction of reps fall in this tier
      void ((pt.minSales + (pt.maxSales ?? pt.minSales + 10)) / 2); // tierSalesPerRep
      if (avgSalesPerRep >= pt.minSales && (pt.maxSales === null || avgSalesPerRep <= pt.maxSales)) {
        // Most reps are in this tier — apply multiplier delta + flat bonus
        const multiplierDelta = pt.bonusMultiplier - 1.0;
        accelerators = totalNewSales * weightedUpfrontPerSale * multiplierDelta + totalReps * pt.bonusFlat;
        break;
      }
    }
  }

  const totalFullyLoaded = repUpfront + repResidual + teamLeadOverrides + regionalLeaderOverrides + accelerators;
  const costPerNewSub = totalNewSales > 0 ? totalFullyLoaded / totalNewSales : 0;
  const totalRevenue = totalNewSales * blendedRevenuePerSub;
  const percentOfRevenue = totalRevenue > 0 ? (totalFullyLoaded / totalRevenue) * 100 : 0;

  return {
    repUpfront,
    repResidual,
    teamLeadOverrides,
    regionalLeaderOverrides,
    accelerators,
    totalFullyLoaded,
    costPerNewSub,
    percentOfRevenue,
  };
}

// --- Partner calculations ---

export function calculatePartnerKickbackRevenue(
  partners: PartnerKickbackInput[]
): number {
  return partners.reduce((sum, p) => {
    if (p.kickbackType === "NONE") return sum;
    return sum + p.estimatedMonthlyReferrals * p.kickbackValue;
  }, 0);
}

// --- Customer LTV ---

export function calculateLTV(
  netMarginPerMonth: number,
  monthlyChurnRate: number
): number {
  if (monthlyChurnRate <= 0) return Infinity;
  const churnDecimal = monthlyChurnRate / 100;
  return netMarginPerMonth / churnDecimal;
}

// --- Operational overhead resolution ---

export function resolveOverhead(overhead: OperationalOverhead, memberCount: number): number {
  if (overhead.mode === "milestone-scaled" && overhead.opexData) {
    return resolveOpexForMemberCount(overhead.opexData, memberCount).total;
  }
  return overhead.fixedMonthly;
}

// --- Full scenario calculation ---

export interface ScenarioResults {
  // Revenue
  mrr: number;
  arr: number;
  revenueByTier: { tierId: string; revenue: number; subscribers: number }[];

  // COGS
  totalProductCost: number;
  totalFulfillmentCost: number;
  costPerSubscriber: number;

  // Commissions
  totalCommissionExpense: number;
  commissionPerSubscriber: number;
  commissionPercentOfRevenue: number;

  // Partners
  totalKickbackRevenue: number;

  // Breakage
  totalBreakageProfit: number;

  // Margins
  grossMarginDollars: number;
  grossMarginPercent: number;
  netMarginDollars: number;
  netMarginPercent: number;

  // Chargebacks
  chargebacksPerMonth: number;
  chargebackCostPerMonth: number;

  // Acquisition channels (month 1)
  newSubsFromReps: number;
  newSubsFromSamplers: number;
  newSubscribersPerMonth: number;
  month1Reps: number;
  month1SamplerSpend: number;
  month1SamplersDistributed: number;

  // LTV / CAC
  ltvCac: {
    blendedLTV: number;
    blendedCAC: number;
    ltvCacRatio: number;
    monthsToPayback: number;
    perTier: {
      tierId: string;
      ltv: number;
      cac: number;
      ltvCacRatio: number;
      monthsToPayback: number;
      avgLifetimeMonths: number;
    }[];
  };

  // Per-tier details
  tierDetails: {
    tierId: string;
    subscribers: number;
    revenuePerSub: number;
    cogsPerSub: number;
    marginPerSub: number;
    marginPercent: number;
    ltv: number;
  }[];

  // Cohort projection (24 months)
  cohortProjection: {
    month: number;
    subscribers: number;
    newSubsFromReps: number;
    newSubsFromSamplers: number;
    chargebacks: number;
    activeReps: number;
    samplerSpend: number;
    revenue: number;
    costs: number;
    operationalOverhead: number;
    netProfit: number;
    cumulativeProfit: number;
    // Per-tier breakdown of new subscribers this month
    newSubsByTier?: { tierId: string; count: number }[];
    // Per-billing-cycle revenue breakdown this month
    revenueByBillingCycle?: { monthly: number; quarterly: number; annual: number };
  }[];

  // Profit split between parties
  profitSplit: {
    parties: { id: string; name: string; percent: number; monthlyAmount: number; annualAmount: number }[];
    totalDistributedPercent: number;
    undistributedPercent: number;
  };

  // Operation breakeven month (0 = already profitable, Infinity = never)
  operationBreakevenMonth: number;

  // Optional: fully-loaded commission breakdown (when D2D plan data is available)
  commissionBreakdown?: {
    repUpfront: number;
    repResidual: number;
    teamLeadOverrides: number;
    regionalLeaderOverrides: number;
    accelerators: number;
    totalFullyLoaded: number;
    costPerNewSub: number;
    percentOfRevenue: number;
  };
}

export function calculateScenario(inputs: FinancialInputs): ScenarioResults {
  const {
    tiers,
    billingCycleDistribution,
    creditRedemptionRate,
    avgCOGSToMemberPriceRatio,
    breakageRate,
    fulfillmentCostPerOrder,
    shippingCostPerOrder,
    commissionStructure,
    salesRepChannel,
    partnerKickbacks,
    operationalOverhead,
    profitSplitParties,
  } = inputs;

  const chargebackRate = (inputs.chargebackPercent ?? 0) / 100;
  const chargebackFeePerIncident = inputs.chargebackFee ?? 0;

  // Resolve month-1 overhead for static calculations
  const operationalOverheadMonthly = resolveOverhead(operationalOverhead, 0);

  // --- Month 1 acquisition ---
  const month1Reps = salesRepChannel.startingReps;
  const month1GrossNewSubs = Math.round(month1Reps * salesRepChannel.salesPerRepPerMonth);
  const month1Chargebacks = Math.round(month1GrossNewSubs * chargebackRate);
  const month1NewSubsFromReps = month1GrossNewSubs - month1Chargebacks;

  const totalSubscribers = month1NewSubsFromReps;
  const newSubscribersPerMonth = totalSubscribers;

  // Per-tier calculations (using month 1 total)
  const tierDetails = tiers.map((tier) => {
    const subscribers = Math.round(
      totalSubscribers * (tier.subscriberPercent / 100)
    );
    const revenuePerSub = calculateBlendedRevenue(
      tier.monthlyPrice,
      tier.quarterlyPricePerMonth,
      tier.annualPricePerMonth,
      tier.billingDistribution ?? billingCycleDistribution
    );
    const tierRedemptionRate = tier.creditRedemptionRate ?? creditRedemptionRate;
    const creditCOGS = calculateCreditCOGS(
      tier.monthlyCredits,
      tierRedemptionRate,
      avgCOGSToMemberPriceRatio
    );
    const totalCOGS = calculateTotalCOGSPerSub(
      creditCOGS,
      tier.apparelCOGSPerMonth,
      fulfillmentCostPerOrder,
      shippingCostPerOrder
    );
    const margin = calculateGrossMargin(revenuePerSub, totalCOGS);
    const ltv = calculateLTV(margin.dollars, tier.churnRateMonthly);

    return {
      tierId: tier.tierId,
      subscribers,
      revenuePerSub,
      cogsPerSub: totalCOGS,
      marginPerSub: margin.dollars,
      marginPercent: margin.percent,
      ltv,
    };
  });

  // Aggregated metrics
  const mrr = tierDetails.reduce(
    (sum, t) => sum + t.subscribers * t.revenuePerSub,
    0
  );
  const arr = mrr * 12;

  const totalProductCost = tierDetails.reduce(
    (sum, t) => sum + t.subscribers * t.cogsPerSub,
    0
  );
  const totalFulfillmentCost =
    totalSubscribers * (fulfillmentCostPerOrder + shippingCostPerOrder);
  const costPerSubscriber =
    totalSubscribers > 0 ? totalProductCost / totalSubscribers : 0;

  // Commission (only on rep-acquired subs — samplers have no commission)
  const blendedRevenuePerSub =
    totalSubscribers > 0 ? mrr / totalSubscribers : 0;

  // Resolve upfront bonus based on commission type
  const resolvedUpfrontBonus =
    (commissionStructure.upfrontType ?? "flat") === "percent"
      ? blendedRevenuePerSub * ((commissionStructure.upfrontPercent ?? 0) / 100)
      : commissionStructure.flatBonusPerSale > 0
        ? commissionStructure.flatBonusPerSale
        : commissionStructure.tierBonuses.length > 0
          ? commissionStructure.tierBonuses.reduce((s, b) => s + b.flatBonus, 0) /
            commissionStructure.tierBonuses.length
          : 0;

  // Static month-1 commission: if residualDelay > 0, no subscribers have cleared
  // the delay yet (they were all just acquired), so residual is 0 in month 1.
  const month1ResidualPercent =
    (commissionStructure.residualDelayMonths ?? 0) > 0
      ? 0
      : commissionStructure.residualPercent;
  const totalCommissionExpense = calculateTotalMonthlyCommission(
    month1NewSubsFromReps, // only rep sales get commission
    resolvedUpfrontBonus,
    totalSubscribers,
    blendedRevenuePerSub,
    month1ResidualPercent,
    commissionStructure.percentHittingAccelerator,
    commissionStructure.acceleratorMultiplier
  );
  const commissionPerSubscriber =
    totalSubscribers > 0 ? totalCommissionExpense / totalSubscribers : 0;
  const commissionPercentOfRevenue =
    mrr > 0 ? (totalCommissionExpense / mrr) * 100 : 0;

  // Partners
  const totalKickbackRevenue =
    calculatePartnerKickbackRevenue(partnerKickbacks);

  // Breakage — always derived from redemption rate (breakageRate field is deprecated)
  const totalBreakageProfit = tiers.reduce((sum, tier) => {
    const subs = Math.round(totalSubscribers * (tier.subscriberPercent / 100));
    const tierRedemption = tier.creditRedemptionRate ?? creditRedemptionRate;
    const tierBreakageRate = 1 - tierRedemption;
    return (
      sum +
      subs *
        calculateBreakageProfit(
          tier.monthlyCredits,
          tierBreakageRate,
          avgCOGSToMemberPriceRatio
        )
    );
  }, 0);

  // Margins
  // NOTE: totalProductCost already includes reduced COGS from breakage (credit
  // COGS uses redemptionRate). Breakage profit is NOT added to net margin — it's
  // already captured in the lower COGS. It's reported separately for visibility.
  const grossMarginDollars = mrr - totalProductCost;
  const grossMarginPercent = mrr > 0 ? (grossMarginDollars / mrr) * 100 : 0;
  // Chargeback cost: lost COGS on shipped product + processor fee
  const chargebackCostPerMonth = month1Chargebacks * (costPerSubscriber + chargebackFeePerIncident);
  const netMarginDollars =
    grossMarginDollars -
    totalCommissionExpense +
    totalKickbackRevenue -
    chargebackCostPerMonth -
    operationalOverheadMonthly;
  const netMarginPercent = mrr > 0 ? (netMarginDollars / mrr) * 100 : 0;

  // Revenue by tier
  const revenueByTier = tierDetails.map((t) => ({
    tierId: t.tierId,
    revenue: t.subscribers * t.revenuePerSub,
    subscribers: t.subscribers,
  }));

  // --- LTV / CAC per tier ---
  const effectiveFlatBonus = calculateCommissionPerNewSub(
    resolvedUpfrontBonus,
    commissionStructure.percentHittingAccelerator,
    commissionStructure.acceleratorMultiplier
  );

  const avgChurn =
    tiers.length > 0
      ? tiers.reduce(
          (s, t) => s + t.churnRateMonthly * (t.subscriberPercent / 100),
          0
        ) / 100
      : 0.06;

  const ltvCacPerTier = tiers.map((tier, idx) => {
    const td = tierDetails[idx];
    const churnDecimal = tier.churnRateMonthly / 100;
    // With minimum commitment: subscriber is locked in for commitMonths, then churn starts.
    // Expected lifetime = commitMonths + (1/churnRate) for the post-commitment period.
    const tierCommit = Math.max(1, tier.minimumCommitMonths ?? 1);
    const postCommitLifetime = churnDecimal > 0 ? 1 / churnDecimal : Infinity;
    const avgLifetimeMonths = postCommitLifetime === Infinity
      ? Infinity
      : (tierCommit - 1) + postCommitLifetime; // commitMonths guaranteed + expected churn period

    const cac = effectiveFlatBonus + td.cogsPerSub;

    // Residual cost per sub — adjusted for delay. During the delay period the rep
    // earns nothing, so effective residual across the subscriber's lifetime is reduced.
    const resDelay = commissionStructure.residualDelayMonths ?? 0;
    let residualPerSub: number;
    if (resDelay === 0 || avgLifetimeMonths === Infinity) {
      residualPerSub = td.revenuePerSub * (commissionStructure.residualPercent / 100);
    } else {
      // Effective residual = residual% × (lifetime - delay) / lifetime
      const residualMonths = Math.max(0, avgLifetimeMonths - resDelay);
      residualPerSub = td.revenuePerSub * (commissionStructure.residualPercent / 100) * (residualMonths / avgLifetimeMonths);
    }
    // NOTE: breakage savings are already captured in td.cogsPerSub (reduced COGS from
    // partial redemption). Do NOT add breakageProfit here — it would double-count.
    const netPerMonth = td.revenuePerSub - td.cogsPerSub - residualPerSub;
    const ltv = avgLifetimeMonths === Infinity ? Infinity : netPerMonth * avgLifetimeMonths;
    const ltvCacRatio = cac > 0 ? ltv / cac : Infinity;
    const monthsToPayback = netPerMonth > 0 ? cac / netPerMonth : Infinity;

    return {
      tierId: td.tierId,
      ltv,
      cac,
      ltvCacRatio,
      monthsToPayback,
      avgLifetimeMonths,
    };
  });

  // Blended LTV/CAC
  const blendedCAC = ltvCacPerTier.length > 0
    ? ltvCacPerTier.reduce((s, t, i) => s + t.cac * (tiers[i].subscriberPercent / 100), 0)
    : 0;
  const blendedLTV = ltvCacPerTier.length > 0
    ? ltvCacPerTier.reduce((s, t, i) => {
        if (t.ltv === Infinity) return Infinity;
        return s + t.ltv * (tiers[i].subscriberPercent / 100);
      }, 0)
    : 0;
  const blendedLTVCACRatio = blendedCAC > 0 && blendedLTV !== Infinity ? blendedLTV / blendedCAC : Infinity;
  const blendedPayback = ltvCacPerTier.length > 0
    ? ltvCacPerTier.reduce((s, t, i) => {
        if (t.monthsToPayback === Infinity) return Infinity;
        return s + t.monthsToPayback * (tiers[i].subscriberPercent / 100);
      }, 0)
    : Infinity;

  // --- 24-month cohort projection with true cohort tracking ---
  // Each month's acquisitions are tracked as a separate cohort. Churn only starts
  // AFTER the minimum commitment period expires. Chargebacks reduce new subs immediately.
  const cohortProjection: ScenarioResults["cohortProjection"] = [];
  let cumulativeProfit = 0;
  let operationBreakevenMonth = 0;
  const repGrowth = salesRepChannel.monthlyGrowthRate / 100;

  // Weighted average minimum commitment months across tiers
  const blendedCommitMonths = tiers.length > 0
    ? tiers.reduce((s, t) => s + (t.minimumCommitMonths ?? 1) * (t.subscriberPercent / 100), 0)
    : 1;
  // Round to nearest integer for cohort math
  const commitMonths = Math.max(1, Math.round(blendedCommitMonths));

  // Track per-month net new subscribers (after chargebacks) for cohort survival
  const netNewSubsByMonth: number[] = [];
  const grossNewSubsByMonth: number[] = [];
  const residualDelay = commissionStructure.residualDelayMonths ?? 0;

  for (let month = 1; month <= 24; month++) {
    // Reps compound: startingReps × (1 + growthRate)^(month-1)
    const monthReps = salesRepChannel.startingReps * Math.pow(1 + repGrowth, month - 1);
    const monthGrossNewSubs = Math.round(monthReps * salesRepChannel.salesPerRepPerMonth);
    const monthChargebacks = Math.round(monthGrossNewSubs * chargebackRate);
    const monthNetNewSubs = monthGrossNewSubs - monthChargebacks;
    const monthChargebackCost = monthChargebacks * (costPerSubscriber + chargebackFeePerIncident);

    grossNewSubsByMonth.push(monthGrossNewSubs);
    netNewSubsByMonth.push(monthNetNewSubs);

    // Compute surviving subscribers from ALL past cohorts using commitment-aware churn
    // Cohort m (0-indexed) was acquired in month (m+1). At current month, monthsActive = month - (m+1).
    // Churn only applies after commitment period: churnPeriods = max(0, monthsActive - commitMonths + 1)
    let currentSubs = monthNetNewSubs; // new subs this month (0 months active, no churn yet)
    for (let m = 0; m < month - 1; m++) {
      const acquisitionMonth = m + 1;
      const monthsActive = month - acquisitionMonth;
      const churnPeriods = Math.max(0, monthsActive - commitMonths + 1);
      const surviving = netNewSubsByMonth[m] * Math.pow(1 - avgChurn, churnPeriods);
      currentSubs += surviving;
    }
    currentSubs = Math.round(currentSubs);

    const monthRevenue = currentSubs * blendedRevenuePerSub;

    // Commission only on rep-acquired subs
    // Payout delay: upfront commission from N months ago hits this month's costs
    const payoutDelay = commissionStructure.payoutDelayMonths ?? 0;
    const delayedMonth = month - payoutDelay;
    let monthUpfrontCommission = 0;
    if (delayedMonth >= 1) {
      const delayedMonthReps = salesRepChannel.startingReps * Math.pow(1 + repGrowth, delayedMonth - 1);
      const delayedMonthGrossSales = Math.round(delayedMonthReps * salesRepChannel.salesPerRepPerMonth);
      // Commission is on gross sales (chargebacks happen after the sale)
      monthUpfrontCommission = delayedMonthGrossSales * effectiveFlatBonus;
    }

    // Residual commission — only on subscribers past the residual delay period.
    let residualEligibleSubs = 0;
    for (let m = 0; m < month; m++) {
      const acquisitionMonth = m + 1;
      const monthsSinceAcquisition = month - acquisitionMonth;
      if (monthsSinceAcquisition >= residualDelay) {
        const churnPeriods = Math.max(0, monthsSinceAcquisition - commitMonths + 1);
        residualEligibleSubs += netNewSubsByMonth[m] * Math.pow(1 - avgChurn, churnPeriods);
      }
    }
    residualEligibleSubs = Math.round(residualEligibleSubs);

    const monthResidualCommission = residualEligibleSubs * blendedRevenuePerSub * (commissionStructure.residualPercent / 100);
    const monthTotalCommission = monthUpfrontCommission + monthResidualCommission;

    // Resolve overhead dynamically based on current subscriber count
    const monthOverhead = resolveOverhead(operationalOverhead, currentSubs);

    const monthCosts =
      currentSubs * costPerSubscriber +
      monthTotalCommission +
      monthChargebackCost +
      monthOverhead;
    const monthProfit = monthRevenue - monthCosts + totalKickbackRevenue;
    cumulativeProfit += monthProfit;

    if (operationBreakevenMonth === 0 && cumulativeProfit > 0) {
      operationBreakevenMonth = month;
    }

    // Per-tier breakdown of new subscribers this month
    const newSubsByTier = tiers.map((tier) => ({
      tierId: tier.tierId,
      count: Math.round(monthNetNewSubs * (tier.subscriberPercent / 100)),
    }));

    // Per-billing-cycle revenue breakdown this month
    let monthlyBillingRevenue = 0;
    let quarterlyBillingRevenue = 0;
    let annualBillingRevenue = 0;
    for (const tier of tiers) {
      const tierBilling = tier.billingDistribution ?? billingCycleDistribution;
      const tierSubs = currentSubs * (tier.subscriberPercent / 100);
      monthlyBillingRevenue += tierSubs * tier.monthlyPrice * (tierBilling.monthly / 100);
      quarterlyBillingRevenue += tierSubs * tier.quarterlyPricePerMonth * (tierBilling.quarterly / 100);
      annualBillingRevenue += tierSubs * tier.annualPricePerMonth * (tierBilling.annual / 100);
    }

    cohortProjection.push({
      month,
      subscribers: currentSubs,
      newSubsFromReps: monthNetNewSubs,
      newSubsFromSamplers: 0,
      chargebacks: monthChargebacks,
      activeReps: Math.round(monthReps),
      samplerSpend: 0,
      revenue: monthRevenue,
      costs: monthCosts,
      operationalOverhead: monthOverhead,
      netProfit: monthProfit,
      cumulativeProfit,
      newSubsByTier,
      revenueByBillingCycle: {
        monthly: monthlyBillingRevenue,
        quarterly: quarterlyBillingRevenue,
        annual: annualBillingRevenue,
      },
    });
  }

  if (operationBreakevenMonth === 0 && cumulativeProfit <= 0) {
    operationBreakevenMonth = Infinity;
  }

  // --- Profit split between parties ---
  const totalSplitPercent = (profitSplitParties ?? []).reduce((s, p) => s + p.percent, 0);
  const profitSplit = {
    parties: (profitSplitParties ?? []).map((party) => ({
      id: party.id,
      name: party.name,
      percent: party.percent,
      monthlyAmount: netMarginDollars > 0 ? netMarginDollars * (party.percent / 100) : 0,
      annualAmount: netMarginDollars > 0 ? netMarginDollars * 12 * (party.percent / 100) : 0,
    })),
    totalDistributedPercent: totalSplitPercent,
    undistributedPercent: Math.max(0, 100 - totalSplitPercent),
  };

  return {
    mrr,
    arr,
    revenueByTier,
    totalProductCost,
    totalFulfillmentCost,
    costPerSubscriber,
    totalCommissionExpense,
    commissionPerSubscriber,
    commissionPercentOfRevenue,
    totalKickbackRevenue,
    totalBreakageProfit,
    grossMarginDollars,
    grossMarginPercent,
    netMarginDollars,
    netMarginPercent,
    chargebacksPerMonth: month1Chargebacks,
    chargebackCostPerMonth,
    newSubsFromReps: month1NewSubsFromReps,
    newSubsFromSamplers: 0,
    newSubscribersPerMonth,
    month1Reps,
    month1SamplerSpend: 0,
    month1SamplersDistributed: 0,
    ltvCac: {
      blendedLTV: blendedLTV,
      blendedCAC: blendedCAC,
      ltvCacRatio: blendedLTVCACRatio,
      monthsToPayback: blendedPayback,
      perTier: ltvCacPerTier,
    },
    tierDetails,
    cohortProjection,
    profitSplit,
    operationBreakevenMonth,
  };
}

// --- Tier-level preview (used in tier editor) ---

export interface TierPreviewInput {
  monthlyPrice: number;
  quarterlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  apparelCOGSPerMonth: number;
  billingDistribution: BillingDistribution;
  creditRedemptionRate: number;
  avgCOGSToMemberPriceRatio: number;
  breakageRate: number;
  fulfillmentCost: number;
  shippingCost: number;
  commissionFlatBonus: number;
  commissionResidualPercent: number;
  operationalOverheadPerSub: number;
}

export interface TierPreviewResult {
  revenuePerSub: number;
  creditCOGS: number;
  totalCOGS: number;
  grossMarginDollars: number;
  grossMarginPercent: number;
  commissionCost: number;
  breakageProfit: number;
  netMarginDollars: number;
  netMarginPercent: number;
  breakeven: number;
}

export function calculateTierPreview(
  input: TierPreviewInput
): TierPreviewResult {
  const revenuePerSub = calculateBlendedRevenue(
    input.monthlyPrice,
    input.quarterlyPrice,
    input.annualPrice,
    input.billingDistribution
  );

  const creditCOGS = calculateCreditCOGS(
    input.monthlyCredits,
    input.creditRedemptionRate,
    input.avgCOGSToMemberPriceRatio
  );

  const totalCOGS = calculateTotalCOGSPerSub(
    creditCOGS,
    input.apparelCOGSPerMonth,
    input.fulfillmentCost,
    input.shippingCost
  );

  const grossMargin = calculateGrossMargin(revenuePerSub, totalCOGS);

  const commissionResidual =
    revenuePerSub * (input.commissionResidualPercent / 100);

  // Breakage savings are already captured in reduced creditCOGS (which uses
  // redemptionRate). This is informational only — NOT added to net margin.
  const breakageProfit = calculateBreakageProfit(
    input.monthlyCredits,
    input.breakageRate,
    input.avgCOGSToMemberPriceRatio
  );

  const netMarginDollars =
    grossMargin.dollars -
    commissionResidual -
    input.operationalOverheadPerSub;
  const netMarginPercent =
    revenuePerSub > 0 ? (netMarginDollars / revenuePerSub) * 100 : 0;

  const breakeven = calculateBreakeven(10000, netMarginDollars); // default $10k fixed

  return {
    revenuePerSub,
    creditCOGS,
    totalCOGS,
    grossMarginDollars: grossMargin.dollars,
    grossMarginPercent: grossMargin.percent,
    commissionCost: commissionResidual,
    breakageProfit,
    netMarginDollars,
    netMarginPercent,
    breakeven,
  };
}
