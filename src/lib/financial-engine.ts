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
  monthlyPrice: number;
  quarterlyPricePerMonth: number;
  annualPricePerMonth: number;
  monthlyCredits: number;
  apparelCOGSPerMonth: number;
  subscriberPercent: number; // percentage 0-100
  churnRateMonthly: number; // percentage 0-100
}

export interface CommissionCalcInput {
  flatBonusPerSale: number; // one-time $ paid per new subscription sold
  residualPercent: number; // ongoing monthly % of subscriber revenue
  tierBonuses: { tierId: string; flatBonus: number }[];
  percentHittingAccelerator: number;
  acceleratorMultiplier: number;
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

export interface FinancialInputs {
  tiers: TierFinancialInput[];
  billingCycleDistribution: BillingDistribution;
  creditRedemptionRate: number; // 0.0-1.0
  avgCOGSToMemberPriceRatio: number; // typically 0.15-0.30
  breakageRate: number; // 0.0-1.0
  fulfillmentCostPerOrder: number;
  shippingCostPerOrder: number;
  commissionStructure: CommissionCalcInput;
  salesRepChannel: SalesRepChannel;
  samplerChannel: SamplerChannel;
  partnerKickbacks: PartnerKickbackInput[];
  operationalOverhead: OperationalOverhead;
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
    activeReps: number;
    samplerSpend: number;
    revenue: number;
    costs: number;
    operationalOverhead: number;
    netProfit: number;
    cumulativeProfit: number;
  }[];

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
    samplerChannel,
    partnerKickbacks,
    operationalOverhead,
  } = inputs;

  // Resolve month-1 overhead for static calculations
  const operationalOverheadMonthly = resolveOverhead(operationalOverhead, 0);

  // --- Month 1 acquisition from both channels ---
  const month1Reps = salesRepChannel.startingReps;
  const month1NewSubsFromReps = Math.round(month1Reps * salesRepChannel.salesPerRepPerMonth);

  const month1SamplerSpend = samplerChannel.monthlyMarketingSpend;
  const month1SamplersDistributed =
    samplerChannel.costPerSampler > 0
      ? Math.round(month1SamplerSpend / samplerChannel.costPerSampler)
      : 0;
  const month1NewSubsFromSamplers = Math.round(
    month1SamplersDistributed * (samplerChannel.conversionRate / 100)
  );

  const totalSubscribers = month1NewSubsFromReps + month1NewSubsFromSamplers;
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
      billingCycleDistribution
    );
    const creditCOGS = calculateCreditCOGS(
      tier.monthlyCredits,
      creditRedemptionRate,
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
  const avgFlatBonus =
    commissionStructure.flatBonusPerSale > 0
      ? commissionStructure.flatBonusPerSale
      : commissionStructure.tierBonuses.length > 0
        ? commissionStructure.tierBonuses.reduce((s, b) => s + b.flatBonus, 0) /
          commissionStructure.tierBonuses.length
        : 0;
  const blendedRevenuePerSub =
    totalSubscribers > 0 ? mrr / totalSubscribers : 0;
  const totalCommissionExpense = calculateTotalMonthlyCommission(
    month1NewSubsFromReps, // only rep sales get commission
    avgFlatBonus,
    totalSubscribers,
    blendedRevenuePerSub,
    commissionStructure.residualPercent,
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

  // Breakage
  const totalBreakageProfit = tiers.reduce((sum, tier) => {
    const subs = Math.round(totalSubscribers * (tier.subscriberPercent / 100));
    return (
      sum +
      subs *
        calculateBreakageProfit(
          tier.monthlyCredits,
          breakageRate,
          avgCOGSToMemberPriceRatio
        )
    );
  }, 0);

  // Margins
  const grossMarginDollars = mrr - totalProductCost;
  const grossMarginPercent = mrr > 0 ? (grossMarginDollars / mrr) * 100 : 0;
  const netMarginDollars =
    grossMarginDollars -
    totalCommissionExpense +
    totalKickbackRevenue +
    totalBreakageProfit -
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
    avgFlatBonus,
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
    const avgLifetimeMonths = churnDecimal > 0 ? 1 / churnDecimal : Infinity;

    const cac = effectiveFlatBonus + td.cogsPerSub;

    const residualPerSub = td.revenuePerSub * (commissionStructure.residualPercent / 100);
    const breakagePerSub = calculateBreakageProfit(
      tier.monthlyCredits,
      breakageRate,
      avgCOGSToMemberPriceRatio
    );
    const netPerMonth = td.revenuePerSub - td.cogsPerSub - residualPerSub + breakagePerSub;
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

  // --- 24-month cohort projection with compounding channels ---
  const cohortProjection: ScenarioResults["cohortProjection"] = [];
  let currentSubs = 0;
  let cumulativeProfit = 0;
  let operationBreakevenMonth = 0;
  const repGrowth = salesRepChannel.monthlyGrowthRate / 100;
  const samplerGrowth = samplerChannel.monthlyGrowthRate / 100;

  for (let month = 1; month <= 24; month++) {
    // Reps compound: startingReps × (1 + growthRate)^(month-1)
    const monthReps = salesRepChannel.startingReps * Math.pow(1 + repGrowth, month - 1);
    const monthNewSubsFromReps = Math.round(monthReps * salesRepChannel.salesPerRepPerMonth);

    // Sampler spend compounds: startingSpend × (1 + growthRate)^(month-1)
    const monthSamplerSpend = samplerChannel.monthlyMarketingSpend * Math.pow(1 + samplerGrowth, month - 1);
    const monthSamplersDistributed =
      samplerChannel.costPerSampler > 0
        ? Math.round(monthSamplerSpend / samplerChannel.costPerSampler)
        : 0;
    const monthNewSubsFromSamplers = Math.round(
      monthSamplersDistributed * (samplerChannel.conversionRate / 100)
    );

    const monthTotalNewSubs = monthNewSubsFromReps + monthNewSubsFromSamplers;

    // Subscribers = surviving subs + new subs
    currentSubs = Math.round(currentSubs * (1 - avgChurn) + monthTotalNewSubs);

    const monthRevenue = currentSubs * blendedRevenuePerSub;

    // Commission only on rep-acquired subs
    const monthUpfrontCommission = monthNewSubsFromReps * effectiveFlatBonus;
    const monthResidualCommission = currentSubs * blendedRevenuePerSub * (commissionStructure.residualPercent / 100);
    const monthTotalCommission = monthUpfrontCommission + monthResidualCommission;

    // Resolve overhead dynamically based on current subscriber count
    const monthOverhead = resolveOverhead(operationalOverhead, currentSubs);

    const monthCosts =
      currentSubs * costPerSubscriber +
      monthTotalCommission +
      monthSamplerSpend + // sampler distribution is a cost
      monthOverhead;
    const monthProfit = monthRevenue - monthCosts + totalKickbackRevenue;
    cumulativeProfit += monthProfit;

    if (operationBreakevenMonth === 0 && cumulativeProfit > 0) {
      operationBreakevenMonth = month;
    }

    cohortProjection.push({
      month,
      subscribers: currentSubs,
      newSubsFromReps: monthNewSubsFromReps,
      newSubsFromSamplers: monthNewSubsFromSamplers,
      activeReps: Math.round(monthReps),
      samplerSpend: Math.round(monthSamplerSpend),
      revenue: monthRevenue,
      costs: monthCosts,
      operationalOverhead: monthOverhead,
      netProfit: monthProfit,
      cumulativeProfit,
    });
  }

  if (operationBreakevenMonth === 0 && cumulativeProfit <= 0) {
    operationBreakevenMonth = Infinity;
  }

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
    newSubsFromReps: month1NewSubsFromReps,
    newSubsFromSamplers: month1NewSubsFromSamplers,
    newSubscribersPerMonth,
    month1Reps,
    month1SamplerSpend,
    month1SamplersDistributed,
    ltvCac: {
      blendedLTV: blendedLTV,
      blendedCAC: blendedCAC,
      ltvCacRatio: blendedLTVCACRatio,
      monthsToPayback: blendedPayback,
      perTier: ltvCacPerTier,
    },
    tierDetails,
    cohortProjection,
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

  const breakageProfit = calculateBreakageProfit(
    input.monthlyCredits,
    input.breakageRate,
    input.avgCOGSToMemberPriceRatio
  );

  const netMarginDollars =
    grossMargin.dollars -
    commissionResidual +
    breakageProfit -
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
