// Financial calculation engine for HERD OS
// Pure functions — no server dependencies, usable client-side and server-side

import type { OpexCategoryData } from "./opex-resolver";
import { resolveOpexForMemberCount } from "./opex-resolver";

export interface BillingDistribution {
  // Percentage of subscribers paying with each cadence (sum to 100). The
  // `biannual` slice represents customers prepaying 6 months; `annual`
  // represents customers prepaying 12 months. There is no quarterly
  // billing — that cadence does not exist in this product.
  monthly: number; // percentage 0-100
  biannual: number;
  annual: number;
}

/**
 * Tier add-ons — third-party hardware/services bundled into specific plans
 * that introduce CFO-relevant unit economics (one-time payouts, leases that
 * convert to ownership, etc).
 */
export interface TierAddOns {
  /**
   * Path Scale add-on — third-party hardware (a smart scale) bundled
   * into specific plans. Three modes total:
   *
   *   • absent (`pathScale === undefined`) — NONE: plan ships no scale.
   *   • `purchase` — we BUY each unit from the supplier at acquisition.
   *     One-time cost per net new subscriber, paid at Mo 1 of life.
   *     We own the unit; no further payments regardless of subscriber
   *     churn or lifetime.
   *   • `lease` — we LEASE the unit from the supplier. Monthly fee per
   *     active subscriber for `leaseMonths`; after that the scale
   *     becomes ours (no further payments).
   *
   * Cost flows OUT of the company in both modes — these are operating
   * expenses we pay to the supplier.
   */
  pathScale?:
    | {
        mode: "purchase";
        purchaseAmount: number; // $ paid to supplier per net new sub at acquisition
      }
    | {
        mode: "lease";
        monthlyFee: number; // $/sub/mo paid to supplier during lease window
        leaseMonths: number; // length of the lease in months
      };
}

export interface TierFinancialInput {
  tierId: string;
  // Plan structure (read-only in UI — sourced from SubscriptionTier table)
  monthlyPrice: number;
  biannualPricePerMonth: number;
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
  // Per-tier add-ons (undefined = none)
  addOns?: TierAddOns;
  /**
   * Real product COGS per active subscriber per month for this tier — derived
   * from the reference package's per-tier variant (sum of `qty × costOfGoods`
   * of every product included). When set, OVERRIDES the generic
   * `apparelCOGSPerMonth` heuristic in COGS calculations. CFO-grade input:
   * the CFO trusts the catalog data over a flat-fee assumption.
   */
  packageCOGSPerSub?: number;
  /**
   * Per-tier shipping/handling/payment-processing costs — pulled directly
   * from the SubscriptionTier table. When provided, these REPLACE the
   * scenario-level `fulfillmentCostPerOrder + shippingCostPerOrder` flat
   * assumption AND add a payment-processing line that the global model
   * ignored. This is what the package detail's profitability card uses,
   * so wiring them through here makes projection margins reconcile to
   * the per-tier card numbers (instead of being ~10pp off because the
   * global flat shipping understates Elite/Legend).
   */
  avgShippingCost?: number;
  avgHandlingCost?: number;
  processingFeePct?: number;   // e.g. 2.9 → 2.9% of revenue
  processingFeeFlat?: number;  // $ per transaction
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
  percentHittingAccelerator: number; // % of reps that cross the accelerator threshold each month
  acceleratorMultiplier: number; // commission multiplier on the marginal sales above 1× baseline
  acceleratorThreshold?: number; // quota multiplier (e.g. 1.5 = rep must hit 150% of baseline). Defaults to 1.5 when omitted.
  // Clawback policy
  clawbackWindowDays?: number; // 0 = no clawback (rep keeps upfront on charged-back sales). >0 = upfront commission is reversed for sales that charge back within the window. Defaults to 60.
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
  // Buck platform fees — per-subscriber monthly cost paid to the platform
  // provider. Two components: a flat per-user license fee, plus an
  // estimated AI token cost per user per month. Applied to every active
  // subscriber every month.
  buckPlatformFeePerSub?: number; // $/sub/mo — flat license paid to the Buck provider
  buckTokenCostPerSub?: number; // $/sub/mo — estimated AI token consumption per user
  // Reference package — when set, each tier's COGS per subscriber is taken
  // from the package's per-tier variant (real product COGS) instead of the
  // generic `apparelCOGSPerMonth` assumption. UI-only state; the actual
  // resolved values live on `tier.packageCOGSPerSub`.
  referencePackageId?: string;
  // Welcome Kit — one-time cost shipped to every NEW subscriber on signup.
  // Treated as an acquisition cost (rolls into CAC) and paid on GROSS new
  // subs (the kit ships before any chargeback can occur, so the spend is
  // sunk regardless of chargeback outcome).
  welcomeKitCostPerSub?: number;
}

// --- Tier-level calculations ---

export function calculateBlendedRevenue(
  monthlyPrice: number,
  biannualPricePerMonth: number,
  annualPricePerMonth: number,
  billing: BillingDistribution
): number {
  return (
    (monthlyPrice * billing.monthly +
      biannualPricePerMonth * billing.biannual +
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

/**
 * Effective per-sale upfront commission given an accelerator structure.
 *
 * The accelerator only kicks in for sales ABOVE the rep's quota threshold:
 * a rep hitting threshold T sells `T × baseline` sales/mo, of which `(T-1) ×
 * baseline` are "marginal" sales eligible for the multiplier. The first
 * `1 × baseline` always pays flat. Reps not hitting threshold sell the
 * baseline only and earn flat on every sale.
 *
 * Across the whole rep population (X% hitting threshold), the share of total
 * sales that are marginal is:
 *
 *   marginalShare = X × (T − 1) / (1 + X × (T − 1))
 *
 * The blended per-sale commission is then:
 *
 *   flat × (1 − marginalShare) + flat × M × marginalShare
 *
 * Falls back to a plain flat bonus when the threshold is disabled (T ≤ 1) or
 * no reps are hitting (X = 0). The previous formula `flat × (1−X) + flat × M ×
 * X` ignored the threshold and over-paid by applying the multiplier to every
 * accelerator-rep's first 1× baseline of sales.
 */
export function calculateCommissionPerNewSub(
  flatBonus: number,
  percentHittingAccelerator: number,
  acceleratorMultiplier: number,
  acceleratorThreshold: number = 1.5,
): number {
  const x = percentHittingAccelerator / 100;
  if (x <= 0 || acceleratorThreshold <= 1 || acceleratorMultiplier <= 1) {
    return flatBonus;
  }
  const marginalShare =
    (x * (acceleratorThreshold - 1)) / (1 + x * (acceleratorThreshold - 1));
  return flatBonus * (1 - marginalShare) + flatBonus * acceleratorMultiplier * marginalShare;
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
  acceleratorMultiplier: number,
  acceleratorThreshold?: number,
): number {
  const effectiveBonus = calculateCommissionPerNewSub(
    avgFlatBonus,
    percentHittingAccelerator,
    acceleratorMultiplier,
    acceleratorThreshold,
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

  // Welcome Kit (one-time cost on every new subscriber)
  welcomeKitCostPerMonth: number;

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
    // Direct cost components — exposed so views don't have to derive them
    // by subtraction (which leaks chargeback expense into commissions or
    // produces inconsistent values across views).
    commissionExpense?: number; // upfront + residual
    chargebackCost?: number;    // chargeback COGS + processor fees
    cogsExpense?: number;       // subscriber COGS (currentSubs × costPerSub)
    buckPlatformCost?: number;  // currentSubs × (buckPlatformFee + buckTokenCost) — sum of the two below
    buckLicenseCost?: number;   // currentSubs × buckPlatformFeePerSub (smoothed in main view)
    buckTokenCost?: number;     // currentSubs × buckTokenCostPerSub (monthly recurring)
    addOnCost?: number;         // per-tier add-ons (Path Scale sale/lease)
    welcomeKitCost?: number;    // monthGrossNewSubs × welcomeKitCostPerSub (acquisition spend)
    // Per-tier breakdown of new subscribers this month
    newSubsByTier?: { tierId: string; count: number }[];
    // Per-billing-cycle revenue breakdown this month
    revenueByBillingCycle?: { monthly: number; biannual: number; annual: number };
  }[];

  /**
   * Per-acquisition-month cohort lifecycles. Each entry is a single
   * "safra" (acquisition month) followed forward through the 24-month
   * window — answering "if 150 subs joined in month M, how do *those
   * specific 150* evolve over time?" Distinct from `cohortProjection`,
   * which sums every active cohort each month.
   *
   * Direct costs (COGS, shipping, processing, welcome kit, commission,
   * chargebacks) are attributed to the cohort that incurred them.
   * Operational overhead and Buck platform fees are intentionally NOT
   * attributed — those are scenario-level fixed costs that don't scale
   * per-cohort, so dividing them across cohorts would be misleading.
   */
  cohortLifecycles: {
    acquisitionMonth: number;     // 1..24, calendar month the cohort entered
    grossNewSubs: number;         // pre-chargeback acquisitions
    chargebacks: number;
    netNewSubs: number;           // grossNewSubs - chargebacks
    /**
     * Per-tier breakdown of the cohort's GROSS acquisitions (sums to
     * `grossNewSubs`). Counts use the largest-remainder method so the
     * sum reconciles exactly with the cohort total. `subscriberPercent`
     * is the structural mix from the scenario tier configuration —
     * shown alongside the count so the per-cohort UI can label rows
     * with both the absolute count and the share.
     */
    grossNewSubsByTier: {
      tierId: string;
      count: number;
      subscriberPercent: number;
      /**
       * How the tier's `count` distributes across billing cycles. Uses
       * largest-remainder rounding so the three values sum exactly to
       * `count`. Cycle mix is constant across the cohort's lifetime —
       * the engine doesn't model differential churn rates per cycle —
       * so these counts are good for the entire 24-month window.
       */
      subsByCycle: { monthly: number; biannual: number; annual: number };
    }[];
    months: {
      monthIndex: number;         // calendar month within the 24-month window
      monthOfLife: number;        // 1 = acquisition month, 2 = first month after, …
      survivingSubs: number;      // remaining active subs from this cohort
      churned: number;            // subs lost since previous month-of-life
      revenue: number;
      /**
       * Per-billing-cycle revenue breakdown — CASH FLOW VIEW:
       *   monthly: every month, surviving monthly subs × monthly rate.
       *   biannual: lump sum at Mo 1/7/13/19, surviving biannual subs ×
       *     biannual rate × 6 (the customer prepaid 6 months at once;
       *     between renewals there's no biannual cash inflow).
       *   annual: lump sum at Mo 1/13, surviving annual subs × annual
       *     rate × 12.
       * Sums to `revenue`. Values OUTSIDE the lump months are zero.
       */
      revenueByBillingCycle: { monthly: number; biannual: number; annual: number };
      /**
       * Per-tier × per-cycle revenue breakdown — same cash-flow timing
       * as `revenueByBillingCycle` (zero outside the lump months for
       * biannual/annual). Sum across tiers of `monthly` reconciles
       * exactly with `revenueByBillingCycle.monthly`, etc.
       */
      revenueByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
      /**
       * Cost-of-goods broken out into the three pieces the projection
       * actually pays for. Sum is the legacy `productCost` field.
       */
      productCogsCost: number;        // package products / apparel COGS, recurring per active sub
      shippingHandlingCost: number;   // per-tier shipping + handling, recurring per active sub
      paymentProcessingCost: number;  // pct + flat fee per transaction — lumps with cash inflow above
      productCost: number;        // sum of the three above (kept for backwards compat)
      /**
       * Buck platform expense, split into the two components that reach
       * the platform on different cadences:
       *   buckLicenseCost: license fee paid to Buck. Lumpy — follows the
       *     subscriber's billing cadence. Monthly subs contribute every
       *     month; biannual lump at Mo 1/7/13/19 (subscriber pays Buck
       *     6 months at signup and at every renewal); annual lump at
       *     Mo 1/13. Outside lump months, biannual/annual subs contribute
       *     $0 license — that's the cash-flow truth, not a bug.
       *   buckTokenCost: AI token cost. Monthly recurring on every active
       *     sub regardless of billing cycle, since token consumption
       *     happens continuously.
       * `buckCost` is the sum, kept for backwards compat with views that
       * read the combined line.
       */
      buckLicenseCost: number;
      buckTokenCost: number;
      buckCost: number;           // buckLicenseCost + buckTokenCost
      welcomeKitCost: number;     // one-time, only on month-of-life 1
      chargebackCost: number;     // one-time, only on month-of-life 1
      commissionUpfront: number;  // applied at acquisition (or after payoutDelay)
      commissionResidual: number; // ongoing, after residualDelay
      addOnCost: number;          // Path Scale lease/sale per cohort lifecycle
      netProfit: number;          // revenue − all attributed costs above
      cumulativeProfit: number;   // running total within this lifecycle
    }[];
    /** Lifetime totals across all months in this lifecycle (≤ 24). */
    totals: {
      revenue: number;
      revenueByBillingCycle: { monthly: number; biannual: number; annual: number };
      revenueByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
      productCogsCost: number;
      shippingHandlingCost: number;
      paymentProcessingCost: number;
      productCost: number;
      buckLicenseCost: number;
      buckTokenCost: number;
      buckCost: number;
      welcomeKitCost: number;
      chargebackCost: number;
      commissionUpfront: number;
      commissionResidual: number;
      addOnCost: number;
      netProfit: number;
      paybackMonth: number | null; // month-of-life when cumulativeProfit first ≥ 0; null = not yet paid back
    };
  }[];

  // Profit split between parties
  profitSplit: {
    parties: { id: string; name: string; percent: number; monthlyAmount: number; annualAmount: number }[];
    totalDistributedPercent: number;
    undistributedPercent: number;
    /** When parties sum to >100%, the engine cannot honor every share. This
     * field surfaces the overage so the UI can flag it. 0 when balanced or
     * under-allocated. */
    overAllocatedPercent: number;
    /** "balanced" (=100), "under" (<100, residual goes to operator),
     * "over" (>100, parties cannot all be paid). */
    status: "balanced" | "under" | "over";
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
  const buckPlatformFeePerSub = inputs.buckPlatformFeePerSub ?? 0;
  const buckTokenCostPerSub = inputs.buckTokenCostPerSub ?? 0;
  const buckCostPerSub = buckPlatformFeePerSub + buckTokenCostPerSub;
  const welcomeKitCostPerSub = inputs.welcomeKitCostPerSub ?? 0;

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
      tier.biannualPricePerMonth,
      tier.annualPricePerMonth,
      tier.billingDistribution ?? billingCycleDistribution
    );
    const tierRedemptionRate = tier.creditRedemptionRate ?? creditRedemptionRate;
    // CRITICAL: when a reference package is selected, `packageCOGSPerSub`
    // IS the cost of the credit-redeemed products — the heuristic
    // `creditCOGS` (monthlyCredits × redemptionRate × cogsRatio) was a
    // stand-in for exactly the same shipment. Adding both double-counts
    // the package and inflates COGS by ~30–50%, dragging gross margin
    // from the package's true ~60% down to ~22%. When the user picks a
    // real package, only `packageCOGSPerSub` counts.
    const hasReferencePackage = tier.packageCOGSPerSub != null;
    const creditCOGS = hasReferencePackage
      ? 0
      : calculateCreditCOGS(
          tier.monthlyCredits,
          tierRedemptionRate,
          avgCOGSToMemberPriceRatio
        );
    // Real product COGS from the reference package (when chosen) takes
    // precedence over the generic apparel/COGS assumption. Falls back to
    // `apparelCOGSPerMonth` when no reference package is selected.
    const productCOGS = tier.packageCOGSPerSub ?? tier.apparelCOGSPerMonth;

    // Shipping/handling/payment-processing — prefer per-tier values from
    // the SubscriptionTier table when available. Higher tiers ship more
    // (and bigger) products, so a flat global shipping cost dramatically
    // misrepresents Elite/Legend economics. Falling back to global only
    // when per-tier data is absent keeps backward compatibility with
    // older snapshots.
    //
    // This change is what makes the projection's blended gross margin
    // reconcile to the package detail card's per-tier gross margins
    // (which use the same per-tier inputs). Without it, projection
    // margin sits ~10pp below the per-tier average.
    const tierShippingHandling =
      tier.avgShippingCost != null && tier.avgHandlingCost != null
        ? (tier.avgShippingCost ?? 0) + (tier.avgHandlingCost ?? 0)
        : fulfillmentCostPerOrder + shippingCostPerOrder;
    const tierPaymentProcessing =
      revenuePerSub * ((tier.processingFeePct ?? 0) / 100) +
      (tier.processingFeeFlat ?? 0);

    const totalCOGS =
      creditCOGS + productCOGS + tierShippingHandling + tierPaymentProcessing;
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
    commissionStructure.acceleratorMultiplier,
    commissionStructure.acceleratorThreshold,
  );
  const commissionPerSubscriber =
    totalSubscribers > 0 ? totalCommissionExpense / totalSubscribers : 0;
  const commissionPercentOfRevenue =
    mrr > 0 ? (totalCommissionExpense / mrr) * 100 : 0;

  // Partners
  const totalKickbackRevenue =
    calculatePartnerKickbackRevenue(partnerKickbacks);

  // Breakage — always derived from redemption rate (breakageRate field is deprecated).
  // CRITICAL: breakage = "money saved when subscribers don't redeem all their
  // credits". When a reference package is selected, we already pay the FULL
  // package COGS regardless of redemption (the package ships as a bundle), so
  // there's nothing to save — breakage doesn't apply for that tier. Suppress
  // it to avoid an information line that misleads the CFO into thinking they
  // recover revenue they actually shipped against.
  const totalBreakageProfit = tiers.reduce((sum, tier) => {
    if (tier.packageCOGSPerSub != null) return sum;
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
  // Welcome Kit cost — one-time spend on every new sub. Paid on GROSS new
  // subs because the kit ships before any chargeback can occur (the spend
  // is sunk regardless). Folds into the month-1 P&L as an acquisition
  // cost that hits net margin.
  const welcomeKitCostPerMonth = month1GrossNewSubs * welcomeKitCostPerSub;
  const netMarginDollars =
    grossMarginDollars -
    totalCommissionExpense +
    totalKickbackRevenue -
    chargebackCostPerMonth -
    welcomeKitCostPerMonth -
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
    commissionStructure.acceleratorMultiplier,
    commissionStructure.acceleratorThreshold,
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

    // CAC = upfront commission + first-month COGS + welcome kit (one-time
    // freebie shipped at acquisition). Welcome kit is the same scalar for
    // every tier (it's the kit's retail-cost cap, not tier-specific), so
    // the same `welcomeKitCostPerSub` applies across the loop.
    const cac = effectiveFlatBonus + td.cogsPerSub + welcomeKitCostPerSub;

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

  // ─── Billing-cycle revenue shares ─────────────────────────────────
  // Precompute the share of subscription revenue that flows through each
  // billing cycle, weighted by tier mix and per-tier overrides. This is held
  // constant across months (matching the assumption baked into
  // blendedRevenuePerSub), so the three cycle rows ALWAYS reconcile to
  // currentSubs × blendedRevenuePerSub. Without this, mixing rounded vs.
  // unrounded tier subscriber counts produced a drift between the headline
  // monthRevenue and its per-cycle breakdown — a CFO-grade reconciliation bug.
  const blendedRevenuePerCycleAcrossTiers = (() => {
    let mo = 0;
    let bi = 0;
    let an = 0;
    for (const tier of tiers) {
      const tb = tier.billingDistribution ?? billingCycleDistribution;
      const sf = tier.subscriberPercent / 100;
      mo += sf * tier.monthlyPrice * (tb.monthly / 100);
      bi += sf * tier.biannualPricePerMonth * (tb.biannual / 100);
      an += sf * tier.annualPricePerMonth * (tb.annual / 100);
    }
    return { monthly: mo, biannual: bi, annual: an };
  })();
  const totalCycleRev =
    blendedRevenuePerCycleAcrossTiers.monthly +
    blendedRevenuePerCycleAcrossTiers.biannual +
    blendedRevenuePerCycleAcrossTiers.annual;
  const cycleShare = {
    monthly: totalCycleRev > 0 ? blendedRevenuePerCycleAcrossTiers.monthly / totalCycleRev : 0,
    biannual: totalCycleRev > 0 ? blendedRevenuePerCycleAcrossTiers.biannual / totalCycleRev : 0,
    annual: totalCycleRev > 0 ? blendedRevenuePerCycleAcrossTiers.annual / totalCycleRev : 0,
  };

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
      // Apply clawback policy: when the structure has a clawback window
      // (default 60 days), upfront commission paid on charged-back sales is
      // reversed. Since this engine models chargebacks as occurring within
      // the same month as the acquisition (always inside any realistic
      // window), the cleanest treatment is to pay upfront on the NET
      // (post-chargeback) sales. Setting clawbackWindowDays = 0 turns the
      // clawback off and reverts to paying on gross sales.
      const clawbackWindow = commissionStructure.clawbackWindowDays ?? 60;
      const commissionableSales =
        clawbackWindow > 0
          ? Math.round(delayedMonthGrossSales * (1 - chargebackRate))
          : delayedMonthGrossSales;
      monthUpfrontCommission = commissionableSales * effectiveFlatBonus;
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

    // Buck platform fees — per-active-subscriber monthly cost (flat license
    // + estimated AI token consumption). Applied every month to every
    // active subscriber.
    // Buck platform fees — split into LICENSE and TOKENS (different cash
    // patterns the platform receives them on). The MAIN projection view
    // smooths revenue across cycles, so it smooths the license cost too —
    // the lumpy cash-flow pattern (license paid upfront for biannual /
    // annual subs) is visible on the per-cohort lifecycle view, where
    // revenue also lumps. Tokens accrue monthly on every active sub.
    const monthBuckLicenseCost = currentSubs * buckPlatformFeePerSub;
    const monthBuckTokenCost = currentSubs * buckTokenCostPerSub;
    const monthBuckCost = monthBuckLicenseCost + monthBuckTokenCost;

    // Per-tier add-ons (e.g. Path Scale) — operating expense paid to the
    // supplier. Two modes drive different cost shapes:
    //
    //   purchase: ONE-TIME cost at acquisition — we buy the unit from the
    //   supplier when the customer signs up. Paid on net new subs of the
    //   cohort entering THIS month, regardless of subsequent churn (we
    //   already paid the supplier on delivery; we own the unit).
    //
    //   lease: RECURRING cost while the customer is active during the
    //   lease window. Stops when the lease term ends OR the customer
    //   churns out (whichever comes first).
    let monthAddOnCost = 0;
    for (const tier of tiers) {
      const pathScale = tier.addOns?.pathScale;
      if (!pathScale) continue;
      const tierShare = tier.subscriberPercent / 100;

      if (pathScale.mode === "purchase") {
        // Purchase fires only on this month's acquisition cohort —
        // `monthNetNewSubs × tierShare × purchaseAmount`. Paid once per
        // unit; later months don't re-trigger for the same cohort.
        monthAddOnCost += monthNetNewSubs * tierShare * pathScale.purchaseAmount;
      } else if (pathScale.mode === "lease") {
        // Lease: walk every active cohort, count surviving subs in
        // their lease window, charge `monthlyFee × tierShare`.
        for (let m = 0; m < month; m++) {
          const monthsActive = month - m; // 1-based: cohort acquired in month (m+1) → monthsActive=1 at acquisition
          if (monthsActive < 1 || monthsActive > pathScale.leaseMonths) continue;
          const churnPeriods = Math.max(0, monthsActive - 1 - commitMonths + 1);
          const surviving =
            netNewSubsByMonth[m] * Math.pow(1 - avgChurn, churnPeriods);
          monthAddOnCost += surviving * tierShare * pathScale.monthlyFee;
        }
      }
    }

    // Welcome Kit — one-time cost per gross new sub (kit ships before any
    // chargeback could occur, so the spend is sunk regardless). Treated
    // here as an acquisition cost that lives alongside commissions and
    // chargebacks in the monthly cost stack — but reported on its own
    // line so views can separate "recurring opex" from "acquisition spend."
    const monthWelcomeKitCost = monthGrossNewSubs * welcomeKitCostPerSub;

    const monthCosts =
      currentSubs * costPerSubscriber +
      monthTotalCommission +
      monthChargebackCost +
      monthOverhead +
      monthBuckCost +
      monthAddOnCost +
      monthWelcomeKitCost;
    const monthProfit = monthRevenue - monthCosts + totalKickbackRevenue;
    cumulativeProfit += monthProfit;

    // Tentative breakeven: first month cumulative profit goes positive.
    // If a later milestone jump in auto-scaled overhead pushes the curve
    // back negative, we'll reset below and re-detect — so the final
    // operationBreakevenMonth reflects SUSTAINED breakeven, not a brief
    // crossover that gets undone by the next overhead step.
    if (operationBreakevenMonth === 0 && cumulativeProfit > 0) {
      operationBreakevenMonth = month;
    } else if (operationBreakevenMonth > 0 && cumulativeProfit < 0) {
      operationBreakevenMonth = 0;
    }

    // Per-tier breakdown of new subscribers this month — use the largest-
    // remainder method so the per-tier counts always sum exactly to
    // `monthNetNewSubs` (a plain Math.round per tier produces 38+38+38+38=
    // 152 when total=150, breaking reconciliation).
    const exactCounts = tiers.map((t) => monthNetNewSubs * (t.subscriberPercent / 100));
    const floored = exactCounts.map((c) => Math.floor(c));
    const leftover = monthNetNewSubs - floored.reduce((s, c) => s + c, 0);
    const remainders = exactCounts
      .map((c, i) => ({ i, frac: c - Math.floor(c) }))
      .sort((a, b) => b.frac - a.frac);
    const counts = floored.slice();
    for (let k = 0; k < leftover && k < remainders.length; k++) counts[remainders[k].i] += 1;
    const newSubsByTier = tiers.map((tier, i) => ({
      tierId: tier.tierId,
      count: counts[i],
    }));

    // Per-billing-cycle revenue breakdown — derived proportionally from
    // monthRevenue using the precomputed cycle shares so the three rows
    // always sum exactly to monthRevenue (CFO-grade reconciliation).
    const monthlyBillingRevenue = monthRevenue * cycleShare.monthly;
    const biannualBillingRevenue = monthRevenue * cycleShare.biannual;
    const annualBillingRevenue = monthRevenue * cycleShare.annual;

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
      commissionExpense: monthTotalCommission,
      chargebackCost: monthChargebackCost,
      cogsExpense: currentSubs * costPerSubscriber,
      buckPlatformCost: monthBuckCost,
      buckLicenseCost: monthBuckLicenseCost,
      buckTokenCost: monthBuckTokenCost,
      addOnCost: monthAddOnCost,
      welcomeKitCost: monthWelcomeKitCost,
      newSubsByTier,
      revenueByBillingCycle: {
        monthly: monthlyBillingRevenue,
        biannual: biannualBillingRevenue,
        annual: annualBillingRevenue,
      },
    });
  }

  if (operationBreakevenMonth === 0 && cumulativeProfit <= 0) {
    operationBreakevenMonth = Infinity;
  }

  // --- Scenario-level blended constants for cohort lifecycle math ---
  // These compute the structural cohort numbers used by the per-safra
  // cash-flow view: how many subs in any cohort are on each billing
  // cycle, what rate each cycle pays, and the per-sub cost components
  // broken out (product / shipping+handling / processing). Computed
  // once per scenario; applied in the lifecycle loop below.
  let subShareMonthly_blend = 0;
  let subShareBiannual_blend = 0;
  let subShareAnnual_blend = 0;
  let monthlyRateWeighted = 0;
  let biannualRateWeighted = 0;
  let annualRateWeighted = 0;
  let blendedProductCogsPerSub = 0;
  let blendedShippingHandlingPerSub = 0;
  let blendedProcessingPct = 0;
  let blendedProcessingFlat = 0;
  for (const tier of tiers) {
    const tb = tier.billingDistribution ?? billingCycleDistribution;
    const sf = tier.subscriberPercent / 100;
    const monShare = (sf * tb.monthly) / 100;
    const biShare = (sf * tb.biannual) / 100;
    const anShare = (sf * tb.annual) / 100;
    subShareMonthly_blend += monShare;
    subShareBiannual_blend += biShare;
    subShareAnnual_blend += anShare;
    monthlyRateWeighted += monShare * tier.monthlyPrice;
    biannualRateWeighted += biShare * tier.biannualPricePerMonth;
    annualRateWeighted += anShare * tier.annualPricePerMonth;

    // Per-tier cost components — mirrors the engine's main-loop calc.
    const tierRedemption =
      tier.creditRedemptionRate ?? creditRedemptionRate;
    const hasReferencePackage = tier.packageCOGSPerSub != null;
    const tierCreditCogs = hasReferencePackage
      ? 0
      : calculateCreditCOGS(
          tier.monthlyCredits,
          tierRedemption,
          avgCOGSToMemberPriceRatio,
        );
    const tierProductCogs = tier.packageCOGSPerSub ?? tier.apparelCOGSPerMonth;
    const hasPerTierShipping =
      tier.avgShippingCost != null && tier.avgHandlingCost != null;
    const tierShippingHandling = hasPerTierShipping
      ? (tier.avgShippingCost ?? 0) + (tier.avgHandlingCost ?? 0)
      : fulfillmentCostPerOrder + shippingCostPerOrder;
    blendedProductCogsPerSub += sf * (tierCreditCogs + tierProductCogs);
    blendedShippingHandlingPerSub += sf * tierShippingHandling;
    blendedProcessingPct += sf * (tier.processingFeePct ?? 0);
    blendedProcessingFlat += sf * (tier.processingFeeFlat ?? 0);
  }
  // Average rate paid by a sub on a given cycle (weighted across tiers).
  const avgMonthlyRate =
    subShareMonthly_blend > 0
      ? monthlyRateWeighted / subShareMonthly_blend
      : 0;
  const avgBiannualRate =
    subShareBiannual_blend > 0
      ? biannualRateWeighted / subShareBiannual_blend
      : 0;
  const avgAnnualRate =
    subShareAnnual_blend > 0 ? annualRateWeighted / subShareAnnual_blend : 0;

  // --- Per-cohort lifecycle tracking ---
  // For each acquisition month (the "safra"), project that specific
  // group of subs forward to the end of the 24-month window. Revenue
  // is modeled in CASH-FLOW view: monthly subs pay every month;
  // biannual subs lump-pay 6 months at Mo 1, 7, 13, 19; annual subs
  // lump-pay 12 months at Mo 1, 13. Costs split into the recurring
  // pieces (product COGS, shipping+handling, Buck) and the lump pieces
  // (payment processing, which fires when revenue does).
  const cohortLifecycles: ScenarioResults["cohortLifecycles"] = [];
  for (let acqM = 1; acqM <= 24; acqM++) {
    const grossNewSubs = grossNewSubsByMonth[acqM - 1];
    const netNewSubs = netNewSubsByMonth[acqM - 1];
    const chargebacks = grossNewSubs - netNewSubs;
    if (grossNewSubs <= 0) continue;

    const months: ScenarioResults["cohortLifecycles"][number]["months"] = [];
    let cohortCumulativeProfit = 0;
    let paybackMonth: number | null = null;

    // Cumulative totals for the cohort lifetime (capped at month 24).
    let totalRevenue = 0;
    let totalRevByMonthly = 0;
    let totalRevByBiannual = 0;
    let totalRevByAnnual = 0;
    // Per-tier accumulators for revenueByTierAndCycle totals row.
    const totalRevByTierAndCycle = tiers.map((tier) => ({
      tierId: tier.tierId,
      monthly: 0,
      biannual: 0,
      annual: 0,
    }));
    let totalProductCogsCost = 0;
    let totalShippingHandlingCost = 0;
    let totalPaymentProcessingCost = 0;
    let totalBuckLicenseCost = 0;
    let totalBuckTokenCost = 0;
    let totalBuckCost = 0;
    let totalWelcomeKit = 0;
    let totalChargeback = 0;
    let totalCommissionUpfront = 0;
    let totalCommissionResidual = 0;
    let totalAddOnCost = 0;
    let totalNetProfit = 0;

    let prevSurviving = netNewSubs;
    for (let calM = acqM; calM <= 24; calM++) {
      const monthOfLife = calM - acqM + 1;
      const monthsActive = monthOfLife - 1; // 0 in acquisition month
      const churnPeriods = Math.max(0, monthsActive - commitMonths + 1);
      const survivingExact = netNewSubs * Math.pow(1 - avgChurn, churnPeriods);
      const survivingSubs = Math.round(survivingExact);
      const churned = monthOfLife === 1 ? 0 : Math.max(0, prevSurviving - survivingSubs);

      // CASH-FLOW REVENUE — split by billing cycle so prepaid customers
      // show as a lump in the month they actually pay (Mo 1, 7, 13, 19
      // for biannual; Mo 1, 13 for annual). Customers on monthly billing
      // contribute revenue every month.
      //
      // Distribute the cohort's surviving subs across cycles using the
      // scenario's blended subscriber-share. (Cycle mix is held constant
      // across the cohort's lifetime — the engine doesn't model
      // differential churn rates per cycle.)
      const subsMonthly = survivingSubs * subShareMonthly_blend;
      const subsBiannual = survivingSubs * subShareBiannual_blend;
      const subsAnnual = survivingSubs * subShareAnnual_blend;

      const isBiannualPaymentMonth = (monthOfLife - 1) % 6 === 0; // Mo 1, 7, 13, 19
      const isAnnualPaymentMonth = (monthOfLife - 1) % 12 === 0;  // Mo 1, 13

      const revenueByMonthly = subsMonthly * avgMonthlyRate;
      const revenueByBiannual = isBiannualPaymentMonth
        ? subsBiannual * avgBiannualRate * 6
        : 0;
      const revenueByAnnual = isAnnualPaymentMonth
        ? subsAnnual * avgAnnualRate * 12
        : 0;
      const revenue = revenueByMonthly + revenueByBiannual + revenueByAnnual;

      // Per-tier × per-cycle breakdown — sum reconciles exactly with the
      // blended totals above (each tier's contribution to monthly is
      // `survivingSubs × tierShare × tb.monthly/100 × monthlyPrice`,
      // which sums to `subsMonthly × avgMonthlyRate`).
      const revenueByTierAndCycle = tiers.map((tier) => {
        const tb = tier.billingDistribution ?? billingCycleDistribution;
        const sf = tier.subscriberPercent / 100;
        const tierSurvivingSubs = survivingSubs * sf;
        const tierMonthlySubs = tierSurvivingSubs * (tb.monthly / 100);
        const tierBiannualSubs = tierSurvivingSubs * (tb.biannual / 100);
        const tierAnnualSubs = tierSurvivingSubs * (tb.annual / 100);
        return {
          tierId: tier.tierId,
          monthly: tierMonthlySubs * tier.monthlyPrice,
          biannual: isBiannualPaymentMonth
            ? tierBiannualSubs * tier.biannualPricePerMonth * 6
            : 0,
          annual: isAnnualPaymentMonth
            ? tierAnnualSubs * tier.annualPricePerMonth * 12
            : 0,
        };
      });
      // Accumulate per-tier totals for the lifetime row.
      for (let i = 0; i < revenueByTierAndCycle.length; i++) {
        totalRevByTierAndCycle[i].monthly += revenueByTierAndCycle[i].monthly;
        totalRevByTierAndCycle[i].biannual += revenueByTierAndCycle[i].biannual;
        totalRevByTierAndCycle[i].annual += revenueByTierAndCycle[i].annual;
      }

      // Cost-of-goods broken into 3 components.
      // Product COGS and shipping/handling are RECURRING — we ship
      // product every month to every active sub regardless of their
      // billing cycle.
      const productCogsCost = survivingSubs * blendedProductCogsPerSub;
      const shippingHandlingCost =
        survivingSubs * blendedShippingHandlingPerSub;

      // Payment processing is PER-TRANSACTION — fires only when money
      // actually moves. So it lump-aligns with the revenue cash flow:
      // monthly subs every month; biannual subs at Mo 1/7/13/19;
      // annual subs at Mo 1/13. Fee = revenue × pct + flat (per
      // transaction × number of subs paying).
      const procMonthly =
        subsMonthly *
        (avgMonthlyRate * (blendedProcessingPct / 100) + blendedProcessingFlat);
      const procBiannual = isBiannualPaymentMonth
        ? subsBiannual *
          (avgBiannualRate * 6 * (blendedProcessingPct / 100) +
            blendedProcessingFlat)
        : 0;
      const procAnnual = isAnnualPaymentMonth
        ? subsAnnual *
          (avgAnnualRate * 12 * (blendedProcessingPct / 100) +
            blendedProcessingFlat)
        : 0;
      const paymentProcessingCost = procMonthly + procBiannual + procAnnual;

      const productCost =
        productCogsCost + shippingHandlingCost + paymentProcessingCost;

      // Buck platform fees — split into LICENSE (lumpy, follows the
      // subscriber's billing cadence — Buck gets paid the full window
      // upfront) and TOKENS (monthly recurring on every active sub,
      // since AI consumption happens continuously regardless of
      // billing cycle).
      //
      // Example: a biannual subscriber paying $5/mo license generates
      // a $30 lump for Buck at Mo 1/7/13/19; the same subscriber
      // contributes $2/mo in tokens every month they remain active.
      const buckLicenseMonthly =
        subsMonthly * buckPlatformFeePerSub;
      const buckLicenseBiannual = isBiannualPaymentMonth
        ? subsBiannual * buckPlatformFeePerSub * 6
        : 0;
      const buckLicenseAnnual = isAnnualPaymentMonth
        ? subsAnnual * buckPlatformFeePerSub * 12
        : 0;
      const buckLicenseCost =
        buckLicenseMonthly + buckLicenseBiannual + buckLicenseAnnual;
      const buckTokenCost = survivingSubs * buckTokenCostPerSub;
      const buckCost = buckLicenseCost + buckTokenCost;

      // One-time at acquisition: welcome kit on every gross new sub
      // (kit ships before chargeback can occur), chargeback cost on
      // the subs that bounced.
      const welcomeKitCost =
        monthOfLife === 1 ? grossNewSubs * welcomeKitCostPerSub : 0;
      const chargebackCost =
        monthOfLife === 1
          ? chargebacks * (costPerSubscriber + chargebackFeePerIncident)
          : 0;

      // Upfront commission lands on the payout-delay month for this
      // cohort; clawback policy mirrors the main loop's rule (paid on
      // net sales when window > 0, gross otherwise).
      const payoutDelay = commissionStructure.payoutDelayMonths ?? 0;
      const clawbackWindow = commissionStructure.clawbackWindowDays ?? 60;
      const commissionableSales =
        clawbackWindow > 0 ? netNewSubs : grossNewSubs;
      const commissionUpfront =
        monthOfLife === 1 + payoutDelay
          ? commissionableSales * effectiveFlatBonus
          : 0;

      // Residual: kicks in after `residualDelay` months past acquisition.
      const commissionResidual =
        monthsActive >= residualDelay
          ? survivingSubs *
            blendedRevenuePerSub *
            (commissionStructure.residualPercent / 100)
          : 0;

      // Per-cohort add-on cost (Path Scale):
      //   purchase: one-time cost at Mo 1 of life on every NET NEW SUB
      //     of the cohort (regardless of survival — we paid the supplier
      //     at delivery, that money is sunk).
      //   lease: recurring `monthlyFee × tierShare × survivingSubs` for
      //     every month-of-life inside the lease window.
      let cohortAddOnCost = 0;
      for (const tier of tiers) {
        const pathScale = tier.addOns?.pathScale;
        if (!pathScale) continue;
        const tierShare = tier.subscriberPercent / 100;
        if (pathScale.mode === "purchase") {
          if (monthOfLife === 1) {
            cohortAddOnCost += netNewSubs * tierShare * pathScale.purchaseAmount;
          }
        } else if (pathScale.mode === "lease") {
          if (monthOfLife >= 1 && monthOfLife <= pathScale.leaseMonths) {
            cohortAddOnCost += survivingSubs * tierShare * pathScale.monthlyFee;
          }
        }
      }

      const netProfit =
        revenue -
        productCost -
        buckCost -
        welcomeKitCost -
        chargebackCost -
        commissionUpfront -
        commissionResidual -
        cohortAddOnCost;

      cohortCumulativeProfit += netProfit;
      if (paybackMonth == null && cohortCumulativeProfit >= 0) {
        paybackMonth = monthOfLife;
      }

      totalRevenue += revenue;
      totalRevByMonthly += revenueByMonthly;
      totalRevByBiannual += revenueByBiannual;
      totalRevByAnnual += revenueByAnnual;
      totalProductCogsCost += productCogsCost;
      totalShippingHandlingCost += shippingHandlingCost;
      totalPaymentProcessingCost += paymentProcessingCost;
      totalBuckLicenseCost += buckLicenseCost;
      totalBuckTokenCost += buckTokenCost;
      totalBuckCost += buckCost;
      totalWelcomeKit += welcomeKitCost;
      totalChargeback += chargebackCost;
      totalCommissionUpfront += commissionUpfront;
      totalCommissionResidual += commissionResidual;
      totalAddOnCost += cohortAddOnCost;
      totalNetProfit += netProfit;

      months.push({
        monthIndex: calM,
        monthOfLife,
        survivingSubs,
        churned,
        revenue,
        revenueByBillingCycle: {
          monthly: revenueByMonthly,
          biannual: revenueByBiannual,
          annual: revenueByAnnual,
        },
        revenueByTierAndCycle,
        productCogsCost,
        shippingHandlingCost,
        paymentProcessingCost,
        productCost,
        buckLicenseCost,
        buckTokenCost,
        buckCost,
        welcomeKitCost,
        chargebackCost,
        commissionUpfront,
        commissionResidual,
        addOnCost: cohortAddOnCost,
        netProfit,
        cumulativeProfit: cohortCumulativeProfit,
      });

      prevSurviving = survivingSubs;
    }

    // Per-tier breakdown of the cohort's GROSS acquisitions — uses the
    // largest-remainder method so the per-tier counts always sum
    // exactly to `grossNewSubs` (a plain `Math.round` per tier breaks
    // reconciliation when tier shares don't divide evenly).
    const exactGrossPerTier = tiers.map(
      (t) => grossNewSubs * (t.subscriberPercent / 100),
    );
    const flooredGrossPerTier = exactGrossPerTier.map((c) => Math.floor(c));
    const leftoverGross =
      grossNewSubs - flooredGrossPerTier.reduce((s, c) => s + c, 0);
    const remaindersGross = exactGrossPerTier
      .map((c, i) => ({ i, frac: c - Math.floor(c) }))
      .sort((a, b) => b.frac - a.frac);
    const grossCounts = flooredGrossPerTier.slice();
    for (let k = 0; k < leftoverGross && k < remaindersGross.length; k++) {
      grossCounts[remaindersGross[k].i] += 1;
    }
    // Per-tier per-cycle subscriber counts — same largest-remainder
    // method so the three cycle slots sum exactly to the tier's
    // `count`. Without this, a tier with 34 subs and a 30/30/40 mix
    // could render as 10/10/13 (sum=33) and the user notices.
    const grossNewSubsByTier = tiers.map((tier, i) => {
      const tb = tier.billingDistribution ?? billingCycleDistribution;
      const tierCount = grossCounts[i];
      const exactByCycle = {
        monthly: tierCount * (tb.monthly / 100),
        biannual: tierCount * (tb.biannual / 100),
        annual: tierCount * (tb.annual / 100),
      };
      const cycleKeys = ["monthly", "biannual", "annual"] as const;
      const flooredByCycle = cycleKeys.map((k) => Math.floor(exactByCycle[k]));
      const leftover =
        tierCount - flooredByCycle.reduce((s, c) => s + c, 0);
      const remainders = cycleKeys
        .map((k, j) => ({ j, frac: exactByCycle[k] - flooredByCycle[j] }))
        .sort((a, b) => b.frac - a.frac);
      const counts = flooredByCycle.slice();
      for (let k = 0; k < leftover && k < remainders.length; k++) {
        counts[remainders[k].j] += 1;
      }
      return {
        tierId: tier.tierId,
        count: tierCount,
        subscriberPercent: tier.subscriberPercent,
        subsByCycle: {
          monthly: counts[0],
          biannual: counts[1],
          annual: counts[2],
        },
      };
    });

    cohortLifecycles.push({
      acquisitionMonth: acqM,
      grossNewSubs,
      chargebacks,
      netNewSubs,
      grossNewSubsByTier,
      months,
      totals: {
        revenue: totalRevenue,
        revenueByBillingCycle: {
          monthly: totalRevByMonthly,
          biannual: totalRevByBiannual,
          annual: totalRevByAnnual,
        },
        revenueByTierAndCycle: totalRevByTierAndCycle,
        productCogsCost: totalProductCogsCost,
        shippingHandlingCost: totalShippingHandlingCost,
        paymentProcessingCost: totalPaymentProcessingCost,
        productCost:
          totalProductCogsCost +
          totalShippingHandlingCost +
          totalPaymentProcessingCost,
        buckLicenseCost: totalBuckLicenseCost,
        buckTokenCost: totalBuckTokenCost,
        buckCost: totalBuckCost,
        welcomeKitCost: totalWelcomeKit,
        chargebackCost: totalChargeback,
        commissionUpfront: totalCommissionUpfront,
        commissionResidual: totalCommissionResidual,
        addOnCost: totalAddOnCost,
        netProfit: totalNetProfit,
        paybackMonth,
      },
    });
  }

  // --- Profit split between parties ---
  // Surface allocation drift explicitly: <100 leaves residual for the
  // operator; >100 means the configured shares can't all be paid (UI
  // should flag this). Status simplifies the consumer's branch.
  const totalSplitPercent = (profitSplitParties ?? []).reduce((s, p) => s + p.percent, 0);
  const splitStatus: "balanced" | "under" | "over" =
    Math.abs(totalSplitPercent - 100) < 0.01
      ? "balanced"
      : totalSplitPercent < 100
        ? "under"
        : "over";
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
    overAllocatedPercent: Math.max(0, totalSplitPercent - 100),
    status: splitStatus,
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
    welcomeKitCostPerMonth,
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
    cohortLifecycles,
    profitSplit,
    operationBreakevenMonth,
  };
}

// --- Tier-level preview (used in tier editor) ---

export interface TierPreviewInput {
  monthlyPrice: number;
  biannualPrice: number;
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
    input.biannualPrice,
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
  // Derive directly from redemptionRate so the preview matches the scenario
  // engine when a tier has an overridden redemption rate (the legacy
  // `breakageRate` input is deprecated and won't reflect the override).
  const breakageProfit = calculateBreakageProfit(
    input.monthlyCredits,
    1 - input.creditRedemptionRate,
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
