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
  /**
   * Per-tier commission structure. When set, OVERRIDES the scenario-
   * level `inputs.commissionStructure` for this tier — used for
   * upfront bonus, residual %, payout/residual delays, accelerator,
   * clawback. Lets each plan pay reps differently (Starter might pay
   * a flat $50 while Legend pays 15% of plan price). When undefined,
   * the engine falls back to the scenario-level commission.
   */
  commissionStructure?: CommissionCalcInput;
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

/** Period length, in months, for a sales-rep schedule override. */
export type SalesRepOverrideFrequency = "quarterly" | "biannual" | "annual";

export const SALES_REP_OVERRIDE_PERIOD_MONTHS: Record<
  SalesRepOverrideFrequency,
  number
> = { quarterly: 3, biannual: 6, annual: 12 };

export interface SalesRepChannel {
  startingReps: number;
  salesPerRepPerMonth: number;
  monthlyGrowthRate: number; // percentage 0-100 (e.g., 10 = 10% more reps each month)
  /**
   * Schedule override. When set, the engine IGNORES `salesPerRepPerMonth`
   * and `monthlyGrowthRate` above and reads both values per period from
   * the schedule. Period length is `quarterly` (3 mo), `biannual` (6 mo),
   * or `annual` (12 mo) — the user picks the one that matches how they
   * actually plan the team.
   *
   * Growth-rate semantics: `monthlyGrowthRate` is the % growth across
   * the WHOLE PERIOD (e.g. "Y1 = 10%" means reps grow 10% over Y1, NOT
   * 10% every month within Y1). The engine compounds this into a
   * per-month rate via (1 + periodRate)^(1/periodMonths) - 1 so growth
   * is smooth within the period. Switching frequencies therefore
   * meaningfully changes the projection: the same "10%" applied across
   * 3 months (quarterly) is much steeper than 10% across 12 months
   * (annual).
   *
   * `periods[i]` covers months `i*L+1 .. (i+1)*L` where L is the period
   * length. Periods are indexed from 1; missing entries fall back to
   * the scalar defaults at the SCALAR level — but the UI always renders
   * every period, so missing entries are an edge case.
   */
  override?: {
    frequency: SalesRepOverrideFrequency;
    periods: {
      period: number;             // 1 = first period, … N = last period in window
      /** % growth across the whole period (NOT per-month). The engine
       *  compounds it into a per-month rate based on the frequency. */
      monthlyGrowthRate: number;
      salesPerRepPerMonth: number;
    }[];
  };
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

/**
 * One overhead category (e.g. Marketing, Technology, Operations) — the
 * monthly budget steps up as the company grows past subscriber
 * milestones. The lowest-`memberCount` entry is the pre-launch /
 * low-volume budget; each next entry replaces the budget once active
 * subs cross its threshold. Milestones are stored sorted ascending by
 * `memberCount`.
 */
export interface OverheadCategoryInput {
  id: string;
  name: string;
  milestones: { memberCount: number; monthlyCost: number }[];
}

export interface OperationalOverhead {
  /**
   * "fixed" — single flat monthly cost, irrespective of subscribers.
   * "milestone-scaled" — legacy: opexData (3-level: category > item > milestones).
   * "categories" — current model: overhead split into named categories,
   *   each scaling on subscriber milestones. This is the canonical shape
   *   for new scenarios; the others stay for backward compatibility.
   */
  mode: "fixed" | "milestone-scaled" | "categories";
  fixedMonthly: number;
  opexData?: OpexCategoryData[];          // legacy
  categories?: OverheadCategoryInput[];   // new
}

export interface ProfitSplitParty {
  id: string;
  name: string;
  percent: number; // 0-100
}

/**
 * The cost rubrics the projection emits each month (see the `monthCosts`
 * block in the projection loop). Each can be left `shared` or attributed to a
 * party in the S2 cascade. Attribution is at rubric level; per-category
 * overhead attribution is deferred (tech debt with trigger).
 */
export type CostRubric =
  | "cogs"
  | "commission"
  | "chargeback"
  | "operationalOverhead"
  | "buckPlatform"
  | "addOn"
  | "welcomeKit"
  | "leadershipCommission";

/**
 * Leadership commission plan (S6). A hierarchy of leadership levels (e.g.
 * local / regional / VP); each level earns an override on its downline's
 * production. S6 assumes full coverage (the whole channel sits under the full
 * chain), so each level's base is the channel's monthly production. The
 * stacked cost is `base_month × Σ_levels(effectiveRate_level)` — the engine
 * only SUMS effective rates (agnostic to level order/sign). A level's
 * `effectiveRate` is the mix-weighted average of its qualifications' rates
 * (S8.1: qualifications are dynamic and named — no longer fixed bronze/prata).
 * Qualification mix is STATIC (dynamic 1-per-N activation is S7; tier
 * progression over time is the D5 follow-up). The result is a derived,
 * attributable cost rubric (`leadershipCommission`, default shared) flowing
 * through the S2 cascade.
 */
export interface LeadershipQualification {
  id: string;
  name: string;
  /** Override % this qualification earns on the level's base production. */
  ratePct: number;
  /** Relative share of managers at this qualification — weights the level's
   *  effective rate. The qualifications blend by mix into one level rate
   *  (generalizes S6's bronze/prata tierMix to N named qualifications). */
  mixPct: number;
}

export interface LeadershipLevel {
  id: string;
  name: string;
  /** Base override rate for this level — what someone at this level earns with
   *  NO qualification. Always present (a level has a base rate from creation). */
  baseRatePct: number;
  /** Mix weight of the base tier. Only meaningful once `qualifications` exist
   *  (base + qualifications split the level's population). With no
   *  qualifications the base is implicitly 100% — its mix is ignored. */
  baseMixPct: number;
  /** Qualifications at this level (e.g. Bronze, Prata, …) — dynamic and named,
   *  layered on top of the base. The level's effective rate is the mix-weighted
   *  average of [base + qualifications]. EMPTY ⇒ effective rate = baseRatePct. */
  qualifications: LeadershipQualification[];
  /** Span ratio for threshold activation: reps per unit of this level (e.g.
   *  20 reps per local). The level activates in a month when `activeReps` ≥
   *  the cumulative product of spans from the base up to and including this
   *  level. Levels are ordered bottom-up (index 0 = closest to the reps).
   *  Static in S7 (no advance hiring; the threshold alone turns a level on). */
  span: number;
}

export interface LeadershipCompPlan {
  enabled: boolean;
  /** What the override percentage applies to each month. Default `"revenue"`
   *  (accrual uses recognized revenue, cash uses collected revenue — each
   *  consistent with its cascade). `"margin"` = gross margin (revenue − COGS);
   *  `"repCommission"` = that month's rep commission spend. */
  base: "revenue" | "margin" | "repCommission";
  levels: LeadershipLevel[];
}

/**
 * Where a cost rubric lands in the cascade. `"shared"` ⇒ deducted pre-split
 * (lowers the distributable every party shares); `{ partyId }` ⇒ deducted from
 * that party's own slice post-split. `partyId` references `ProfitSplitParty.id`.
 */
export type CostTarget = "shared" | { partyId: string };

/**
 * How channel losses are split (D8). `"proportional"` repartitions a negative
 * `distributable` by each party's percent (parties share the downside, the S2
 * behavior). `"absorbed"` (default) keeps loss months out of the proportional
 * split — the channel loss goes to `lossBearerPartyId` if set+valid, otherwise
 * to `undistributed`; no party receives a negative gross slice. Profitable
 * months are identical under both modes.
 */
export type LossHandling = "proportional" | "absorbed";

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
  // Per-rubric cost attribution (S2). A rubric absent from the map ⇒ "shared".
  // A `partyId` that no longer exists in `profitSplitParties` is treated as
  // "shared" at read time, so removing a party never breaks the cascade.
  costAttribution?: Partial<Record<CostRubric, CostTarget>>;
  // Loss handling (D8). Absent ⇒ "absorbed" (default B). In "absorbed", a loss
  // month (channel `distributable` < 0) is not split proportionally — it goes
  // to `lossBearerPartyId` if set+valid, otherwise to `undistributed`. An
  // invalid/removed bearer falls back to `undistributed` (validated on read).
  lossHandling?: LossHandling;
  lossBearerPartyId?: string;
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
  // Leadership commission plan (S6) — stacked leadership overrides on channel
  // production, surfaced as the derived `leadershipCommission` cost rubric.
  // Absent or `enabled:false` ⇒ cost 0 ⇒ identical behavior (safe default).
  leadershipCompPlan?: LeadershipCompPlan;
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

/**
 * For a single category, return the monthly cost given an active
 * subscriber count. Picks the highest milestone with `memberCount` ≤
 * `memberCount`; if none qualifies, returns the lowest milestone (the
 * pre-launch budget). Empty milestones list yields 0.
 */
function resolveCategoryMonthlyCost(
  category: OverheadCategoryInput,
  memberCount: number,
): number {
  const sorted = [...category.milestones].sort(
    (a, b) => a.memberCount - b.memberCount,
  );
  if (sorted.length === 0) return 0;
  let active = sorted[0]; // start at the lowest (pre-launch) budget
  for (const m of sorted) {
    if (memberCount >= m.memberCount) active = m;
    else break;
  }
  return active.monthlyCost;
}

/**
 * Resolve total overhead and per-category breakdown for a given member
 * count. Used by the engine's projection loop to compute monthly
 * overhead AND emit a breakdown the UI can render.
 */
export function resolveOverheadBreakdown(
  overhead: OperationalOverhead,
  memberCount: number,
): {
  total: number;
  byCategory: { id: string; name: string; monthly: number }[];
} {
  if (overhead.mode === "categories" && overhead.categories) {
    const byCategory = overhead.categories.map((c) => ({
      id: c.id,
      name: c.name,
      monthly: resolveCategoryMonthlyCost(c, memberCount),
    }));
    return {
      total: byCategory.reduce((s, c) => s + c.monthly, 0),
      byCategory,
    };
  }
  if (overhead.mode === "milestone-scaled" && overhead.opexData) {
    const r = resolveOpexForMemberCount(overhead.opexData, memberCount);
    return {
      total: r.total,
      byCategory: r.byCategory.map((c) => ({
        id: c.categoryId,
        name: c.categoryName,
        monthly: c.total,
      })),
    };
  }
  // Fixed mode — single bucket labeled "Overhead".
  return {
    total: overhead.fixedMonthly,
    byCategory: [{ id: "fixed", name: "Overhead", monthly: overhead.fixedMonthly }],
  };
}

export function resolveOverhead(overhead: OperationalOverhead, memberCount: number): number {
  return resolveOverheadBreakdown(overhead, memberCount).total;
}

// --- Full scenario calculation ---

/**
 * One month's profit distribution to parties, on a single accounting basis.
 * The S2 cascade: `distributable` is net profit with party-attributed costs
 * ADDED BACK (shared costs stay deducted); each party gets `amount` (gross
 * slice = `distributable × percent`) minus its own attributed `partyCost`,
 * giving `net`. With every rubric shared (default) `partyCost` is 0,
 * `distributable` collapses to S1's net profit, and `amount ≡ net` — the
 * cascade reduces exactly to S1. `undistributed` is the residual share
 * `(100 − Σpercent)` left to the operator. Loss months (negative
 * `distributable`) flow through proportionally.
 *
 * Invariants (pins): `Σ byParty.amount + undistributed ≡ distributable`;
 * `Σ byParty.net + undistributed ≡ channelResult`; and
 * `channelResult ≡ netProfit_S1` independent of attribution.
 */
/**
 * One attributed cost rubric inside a party's `partyCost`, with an optional
 * per-level breakdown (leadership commission only) so the UI can expand
 * "(−) Party costs" → rubric → per-level stratification.
 */
export interface PartyCostBreakdownEntry {
  rubric: CostRubric;
  amount: number;
  levels?: { id: string; name: string; amount: number }[];
}

export interface MonthlyPartyDistribution {
  month: number; // 1..PROJECTION_MONTHS (calendar month)
  distributable: number;
  byParty: {
    partyId: string;
    percent: number;
    amount: number; // gross slice = distributable × (percent/100); the S1 value when all-shared
    partyCost: number; // Σ cost rubrics attributed to this party this month/basis (S2)
    net: number; // amount − partyCost (S2)
    costBreakdown: PartyCostBreakdownEntry[]; // per-rubric split of partyCost (S2); leadership carries per-level
  }[];
  undistributed: number;
  sharedCosts: number; // Σ cost of rubrics left `shared` this month/basis (informational)
  channelResult: number; // distributable − Σ partyCost ≡ netProfit_S1 (cascade invariant)
}

/** A party's distribution summed across the projection window, one basis. */
export interface PartyDistributionTotal {
  partyId: string;
  name: string;
  percent: number;
  amount: number; // Σ gross slice
  partyCostTotal: number; // Σ partyCost across months (S3)
  netTotal: number; // Σ net = amount − partyCostTotal (S3)
}

/**
 * Per-month profit distribution on both accounting bases — the canonical
 * profit-split surface. `accrual` uses
 * the fully-loaded `cohortProjection[m].netProfit`; `cash` aggregates the
 * per-cohort lifecycle net profit by calendar month and subtracts the
 * scenario-level overhead (not cohort-attributed) — the same composition the
 * on-screen Cohort Aggregate view reconciles to.
 */
export interface ProfitDistributionByBasis {
  accrual: MonthlyPartyDistribution[];
  cash: MonthlyPartyDistribution[];
  totals: { accrual: PartyDistributionTotal[]; cash: PartyDistributionTotal[] };
}

export interface ScenarioResults {
  // Revenue
  mrr: number;
  /**
   * MRR of the LAST projected month (`cohortProjection[N-1].revenue`).
   * Run-rate snapshot at the end of the horizon, used by `arrExit`.
   * Thread D.3.3.
   */
  mrrExit: number;
  /**
   * ARR — by SaaS convention this is the CURRENT run-rate × 12, i.e.
   * exit ARR. Aliased to `arrExit`. Renderers display this in the
   * "ARR" KPI cards by default. Thread D.3.3.
   */
  arr: number;
  /**
   * Avg-MRR-of-period × 12. Reflects the "12 × average over the
   * projection horizon" reading (α). Useful for internal modeling and
   * for comparing scenarios on a same-period basis. Thread D.3.3.
   */
  arrAvg: number;
  /**
   * Exit MRR × 12. SaaS-convention ARR — what investors and board
   * decks mean by "ARR" in a forward-looking projection. Equal to
   * `arr` (alias). Thread D.3.3.
   */
  arrExit: number;
  /**
   * Realized revenue across the first 12 months of projection
   * (`Σ cohortProjection[0..11].revenue`). Useful for Y1 cash-flow
   * forecasting; NOT to be labeled "ARR" — it's actual realized
   * top-line, not annualized run-rate. Thread D.3.3.
   */
  revenueY1: number;
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

  // Cohort projection — one entry per month in the projection window
  // (length = PROJECTION_MONTHS).
  cohortProjection: {
    month: number;
    subscribers: number;
    newSubsFromReps: number;
    newSubsFromSamplers: number;
    chargebacks: number;
    activeReps: number;
    /** Per-category overhead breakdown — populated by the engine's
     *  resolver. Rolls up to the `operationalOverhead` total. */
    operationalOverheadByCategory?: { id: string; name: string; monthly: number }[];
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
    leadershipCommissionCost?: number; // derived leadership override (S6): monthRevenue × Σ effective rate
    /**
     * Per-month breakage profit (informational disclosure only — does NOT
     * roll into `costs`/`netProfit` because COGS already incorporates
     * reduced spend via `creditRedemptionRate`). Computed as
     * Σ_tier round(currentSubs × subscriberPercent/100) × per-sub-rate,
     * where per-sub-rate uses the tier's effective breakage. Added in
     * Thread D.3.2 (replaces Mo-1-frozen `totalBreakageProfit` scalar).
     */
    breakageProfit?: number;
    // Per-tier breakdown of new subscribers this month
    newSubsByTier?: { tierId: string; count: number }[];
    // Per-tier breakdown of revenue this month (subscribers × revenuePerSub
    // for each tier, accrual basis — same smoothing as the headline
    // `revenue` field). Σ `revenueByTier[].revenue` ≡ `revenue`. Added in
    // Thread D.2 to enable per-tier UI displays without leaning on the
    // Mo-1-frozen `results.revenueByTier` scalar.
    revenueByTier?: { tierId: string; revenue: number }[];
    // Per-tier breakdown of commission expense this month (upfront +
    // residual split since they fire on different bases). Sums to the
    // aggregate `commissionExpense` field.
    commissionByTier?: { tierId: string; upfront: number; residual: number }[];
    // Per-billing-cycle revenue breakdown this month
    revenueByBillingCycle?: { monthly: number; biannual: number; annual: number };
  }[];

  /**
   * Per-acquisition-month cohort lifecycles. Each entry is a single
   * "safra" (acquisition month) followed forward through the 36-month
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
       * so these counts are good for the entire 36-month window.
       */
      subsByCycle: { monthly: number; biannual: number; annual: number };
    }[];
    months: {
      monthIndex: number;         // calendar month within the 36-month window
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
       * Per-tier × per-cycle ACTIVE SUB COUNTS (not revenue). Lets the
       * user audit any month: "$X of biannual revenue at Mo 7 came
       * from N biannual Starter subs × $rate × 6". These counts are
       * NOT zeroed in lump-off months — they're the surviving
       * population in that (tier, cycle) bucket, fractional, every
       * month. Multiply by the cycle rate to get expected revenue at
       * lump months.
       */
      subscribersByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
      /**
       * Cost-of-goods broken out into the three pieces the projection
       * actually pays for. Sum is the legacy `productCost` field.
       */
      productCogsCost: number;        // package products / apparel COGS, recurring per active sub
      /** Per-tier shipping cost, recurring per active sub. Split out
       *  from handling so the UI can render them as separate lines.
       *  Sum equals the legacy `shippingHandlingCost` field. */
      shippingCost: number;
      handlingCost: number;
      shippingHandlingCost: number;   // shippingCost + handlingCost (kept for backwards compat)
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
      // Per-tier commission split — same upfront/residual breakdown but
      // attributed to the tier whose plan structure paid it. Sums to the
      // `commissionUpfront` / `commissionResidual` totals above.
      commissionByTier: { tierId: string; upfront: number; residual: number }[];
      addOnCost: number;          // Path Scale lease/sale per cohort lifecycle
      leadershipCommissionCost: number; // derived leadership override (S6), cash basis: this cohort-month's revenue × Σ effective rate
      netProfit: number;          // revenue − all attributed costs above
      cumulativeProfit: number;   // running total within this lifecycle
    }[];
    /** Lifetime totals across all months in this lifecycle (≤ PROJECTION_MONTHS). */
    totals: {
      revenue: number;
      revenueByBillingCycle: { monthly: number; biannual: number; annual: number };
      revenueByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
      subscribersByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
      productCogsCost: number;
      shippingCost: number;
      handlingCost: number;
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
      commissionByTier: { tierId: string; upfront: number; residual: number }[];
      addOnCost: number;
      netProfit: number;
      paybackMonth: number | null; // month-of-life when cumulativeProfit first ≥ 0; null = not yet paid back
    };
  }[];

  /** Per-month, per-basis profit distribution: the canonical profit-split
   *  surface (cascade with shared/party cost attribution + loss handling). */
  profitDistribution: ProfitDistributionByBasis;

  /** Sales-force headcount over the projection window. `levels` are the
   *  leadership levels ordered TOP → BASE (highest cumulative span first);
   *  each carries its per-month manager count (`floor(activeReps / threshold)`
   *  — 1 manager per `threshold` reps). `repsByMonth` is the base (reps). Empty
   *  `levels` when no leadership plan is active. */
  salesTeam: {
    levels: { id: string; name: string; threshold: number; headcountByMonth: number[] }[];
    repsByMonth: number[];
  };

  /** Per-member career-trajectory earnings (what ONE individual in each role
   *  earns month by month), on both bases. `reps` is a single rep who joins in
   *  month 1 and sells `salesPerRepPerMonth` — upfront on each sale plus a
   *  residual that ramps as their book matures. `levels` (TOP → BASE, same order
   *  as `salesTeam.levels`) is one representative manager's override on a single
   *  span of production (`levelOverride × threshold / activeReps` — smooth, no
   *  headcount-floor dilution), zero until the level activates. */
  memberEarnings: {
    reps: {
      accrual: { upfront: number[]; residual: number[]; total: number[] };
      cash: { upfront: number[]; residual: number[]; total: number[] };
      /** One rep's own production (drives the per-member-unit role view):
       *  `grossNewSubs` = gross sales/month (sales-per-rep, flat or stepped),
       *  `chargebacks` = of those, charged back, `newSubscribers` = net new,
       *  `subscribers` = active book, `revenue` = that book's revenue (accrual
       *  smoothed, cash lumpy). Scale by a manager's downline size (threshold)
       *  for their unit's production. */
      grossNewSubs: number[];
      chargebacks: number[];
      newSubscribers: number[];
      subscribers: number[];
      revenue: { accrual: number[]; cash: number[] };
    };
    /** Per-manager override series (TOP → BASE). `accrual`/`cash` are the
     *  totals; `*Upfront`/`*Residual` split each total by the unit's
     *  new-vs-recurring production mix that month (netNew/active) — the
     *  override on freshly-acquired revenue reads as upfront, the override on
     *  the standing book reads as residual. Mirrors the rep's upfront→residual
     *  ramp; the split is an attribution convention, not two distinct streams
     *  (leadership comp is a single override on `base × rate`). */
    levels: {
      id: string;
      name: string;
      accrual: number[];
      cash: number[];
      accrualUpfront: number[];
      accrualResidual: number[];
      cashUpfront: number[];
      cashResidual: number[];
    }[];
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

/**
 * Length of the projection window, in months. The engine emits exactly
 * this many entries in `cohortProjection` and one cohort lifecycle per
 * acquisition month inside this window. UI views (Spreadsheet, Cohort)
 * may render fewer columns by slicing — they cannot ask for more.
 */
export const PROJECTION_MONTHS = 36;

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

  // `operationalOverheadMonthly` USED to be computed here as
  // `resolveOverhead(operationalOverhead, 0)`. That call always returned
  // the pre-launch baseline regardless of how the scenario evolved —
  // a $1.27M/36mo under-report bug in scenarios with multi-milestone
  // categories (Thread A.1 diagnostic). Moved to AFTER the cohort
  // projection loop, where it derives from the per-month overhead
  // that already accounts for growing subscriber counts via line 1461's
  // `resolveOverheadBreakdown(overhead, currentSubs)`.

  // --- Month 1 acquisition ---
  // Month 1: use the structural defaults (no quarter overrides apply
  // before month 1 begins; Q1 entry — if any — is captured below by
  // resolveSalesPerRep on the precomputed array, but at this point in
  // the engine that array isn't built yet).
  const month1Reps = salesRepChannel.startingReps;
  // Month 1 sales/rep — when an override is active, period 1's rate
  // covers month 1; otherwise the scalar applies.
  const month1SalesPerRep =
    salesRepChannel.override?.periods.find((p) => p.period === 1)
      ?.salesPerRepPerMonth ?? salesRepChannel.salesPerRepPerMonth;
  const month1GrossNewSubs = Math.round(month1Reps * month1SalesPerRep);
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
  // (Thread D.3.3 removed a stale `const arr = mrr * 12;` here — dead
  // code from the D.2 sweep. The exported `arr` is computed post-loop
  // from `mrrExit`. `mrr` on line above remains in use by
  // `blendedRevenuePerSub` and per-tier LTV/CAC math below.)

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

  // --- Leadership commission (S6 + S7) — per-level rate + threshold activation ---
  // Each level's effective rate is the static tier-mix-weighted average of its
  // bronze/prata rates (a fraction). A level ACTIVATES in a month when
  // `activeReps` crosses its threshold — the cumulative product of spans from
  // the base up to and including it (S7: no advance hiring; the threshold turns
  // the level on). The per-month cost is `base_month × Σ(effective rate of the
  // ACTIVE levels)`, emitted inside each projection loop using THAT month's base
  // (magnitude) and `activeReps` (activation) — no scalar × period multiplier.
  // The cost does NOT scale with manager count: once active, a level covers the
  // whole channel. Absent/disabled ⇒ no active levels ⇒ rate 0 ⇒ no cost.
  const leadershipPlan = inputs.leadershipCompPlan;
  const leadershipBase = leadershipPlan?.base ?? "revenue";
  const leadershipLevels: { id: string; name: string; effectiveRate: number; threshold: number }[] = [];
  if (leadershipPlan?.enabled) {
    let cumulativeSpan = 1;
    for (const lvl of leadershipPlan.levels) {
      // Level effective rate (S8.2): no qualifications ⇒ everyone is base ⇒
      // effective = baseRatePct. With qualifications ⇒ mix-weighted average of
      // [base + qualifications]. Zero total mix ⇒ 0.
      const quals = lvl.qualifications ?? [];
      let effectiveRate: number;
      if (quals.length === 0) {
        effectiveRate = (lvl.baseRatePct ?? 0) / 100;
      } else {
        const entries = [
          { ratePct: lvl.baseRatePct ?? 0, mixPct: lvl.baseMixPct ?? 0 },
          ...quals.map((q) => ({ ratePct: q.ratePct, mixPct: q.mixPct })),
        ];
        const mixTotal = entries.reduce((s, e) => s + e.mixPct, 0);
        effectiveRate =
          mixTotal > 0
            ? entries.reduce((s, e) => s + e.mixPct * e.ratePct, 0) / mixTotal / 100
            : 0;
      }
      // Span ≤ 0 is invalid; treat as 1 so a bad value can't zero the
      // cumulative product and force every level active from month 1.
      cumulativeSpan *= lvl.span > 0 ? lvl.span : 1;
      leadershipLevels.push({ id: lvl.id, name: lvl.name, effectiveRate, threshold: cumulativeSpan });
    }
  }
  // Stacked rate of the levels ACTIVE at a given active-rep count.
  const leadershipRateAt = (activeReps: number): number =>
    leadershipLevels.reduce(
      (sum, lvl) => sum + (activeReps >= lvl.threshold ? lvl.effectiveRate : 0),
      0,
    );

  // --- Per-tier commission resolution ---
  // Each tier may have its own `commissionStructure` override; absent
  // tiers fall back to the scenario-level default. The engine computes
  // commissions PER TIER and aggregates — so a Legend customer can
  // generate a different upfront bonus than a Starter customer.
  // `resolvedUpfront` is the upfront $ per new sub for that tier
  // (with percent-type math applied against the tier's own blended
  // revenue, not the scenario blend); `effectiveFlatBonus` adds the
  // accelerator weighting.
  type ResolvedTierCommission = CommissionCalcInput & {
    resolvedUpfront: number;
    effectiveFlatBonus: number;
    payoutDelay: number;
    residualDelay: number;
    clawbackWindow: number;
  };
  const tierCommissions: ResolvedTierCommission[] = tiers.map((tier, i) => {
    const c = tier.commissionStructure ?? commissionStructure;
    const tierBlendedRev = tierDetails[i].revenuePerSub;
    const resolvedUpfront =
      (c.upfrontType ?? "flat") === "percent"
        ? tierBlendedRev * ((c.upfrontPercent ?? 0) / 100)
        : c.flatBonusPerSale > 0
          ? c.flatBonusPerSale
          : c.tierBonuses.length > 0
            ? c.tierBonuses.reduce((s, b) => s + b.flatBonus, 0) /
              c.tierBonuses.length
            : 0;
    const effectiveFlatBonus = calculateCommissionPerNewSub(
      resolvedUpfront,
      c.percentHittingAccelerator,
      c.acceleratorMultiplier,
      c.acceleratorThreshold,
    );
    return {
      ...c,
      resolvedUpfront,
      effectiveFlatBonus,
      payoutDelay: c.payoutDelayMonths ?? 0,
      residualDelay: c.residualDelayMonths ?? 0,
      clawbackWindow: c.clawbackWindowDays ?? 60,
    };
  });

  // --- Month-1 total commission expense (across all tiers) ---
  // Aggregates the upfront commission paid on new subs THIS month plus
  // the residual on tiers whose residualDelay has elapsed (always 0
  // residual in month 1 unless the tier has residualDelay = 0).
  let totalCommissionExpense = 0;
  for (let i = 0; i < tiers.length; i++) {
    const tc = tierCommissions[i];
    const tier = tiers[i];
    const tierShare = tier.subscriberPercent / 100;
    const tierNewSubs = month1NewSubsFromReps * tierShare;
    const tierActiveSubs = totalSubscribers * tierShare;
    const tierBlendedRev = tierDetails[i].revenuePerSub;
    // Upfront — only fires on tiers whose payoutDelay is 0 (otherwise
    // commission is deferred beyond month 1). Accelerator-weighted.
    if (tc.payoutDelay === 0) {
      totalCommissionExpense += tierNewSubs * tc.effectiveFlatBonus;
    }
    // Residual — month 1 only contributes if residualDelay = 0
    // (subscribers acquired this month haven't cleared longer delays).
    if (tc.residualDelay === 0) {
      totalCommissionExpense +=
        tierActiveSubs * tierBlendedRev * (tc.residualPercent / 100);
    }
  }
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
  //
  // Thread D.3.2: per-tier per-sub breakage rate is precomputed here
  // (time-invariant), then applied per-month inside the projection loop
  // against `currentSubs` (not Mo-1-frozen `totalSubscribers`). The
  // aggregate `totalBreakageProfit` scalar is derived post-loop as the
  // average of `cohortProjection[i].breakageProfit` — same pattern as
  // `operationalOverheadMonthly` (A.2), `welcomeKitCostPerMonth` (A.3.2),
  // and the D.2 scalars.
  const tierBreakagePerSub = tiers.map((tier) => {
    if (tier.packageCOGSPerSub != null) return 0;
    const tierRedemption = tier.creditRedemptionRate ?? creditRedemptionRate;
    const tierBreakageRate = 1 - tierRedemption;
    return calculateBreakageProfit(
      tier.monthlyCredits,
      tierBreakageRate,
      avgCOGSToMemberPriceRatio,
    );
  });

  // Margins
  // NOTE: totalProductCost already includes reduced COGS from breakage (credit
  // COGS uses redemptionRate). Breakage profit is NOT added to net margin — it's
  // already captured in the lower COGS. It's reported separately for visibility.
  //
  // Sub-etapa 3b clarification: the COGS line shown in P&L Statement /
  // Metrics / Charts is the NET figure (after breakage savings).
  // `totalBreakageProfit` is exposed as an *informational* note — adding
  // it to net margin would double-count. Both representations are
  // correct; the breakage line answers the CFO's "how much did
  // unredeemed credits save us this period?" question without
  // disturbing the margin math.
  const grossMarginDollars = mrr - totalProductCost;
  const grossMarginPercent = mrr > 0 ? (grossMarginDollars / mrr) * 100 : 0;
  // Chargeback cost: lost COGS on shipped product + processor fee
  const chargebackCostPerMonth = month1Chargebacks * (costPerSubscriber + chargebackFeePerIncident);
  // Welcome Kit cost — one-time spend on every new sub. Paid on GROSS new
  // subs because the kit ships before any chargeback can occur (the spend
  // is sunk regardless). Folds into the month-1 P&L as an acquisition
  // cost that hits net margin.
  //
  // Period-scaling caveat (sub-etapa 3b): the visual tabs render this
  // as `welcomeKitCostPerMonth × multiplier` (P&L Statement, Metrics,
  // Charts). That assumes acquisitions are LINEAR over the period —
  // the same number of new subs each month. Reality differs once the
  // user activates the quarterly sales-rep override (sub-etapa 6),
  // where rep growth and sales-per-rep can step at quarter boundaries.
  // We accept the linearisation as a reasonable approximation for
  // KPI-style summaries: the per-cohort and aggregate Cohort tables
  // already show the exact monthly figures, and the visuals are
  // operating-performance summaries, not cash forecasts.
  // `welcomeKitCostPerMonth` USED to be declared here as
  // `month1GrossNewSubs × welcomeKitCostPerSub` — only Mo 1's
  // acquisitions, frozen at the lowest point. Same anti-pattern as
  // overhead-at-zero (Thread A.1): in growth scenarios Mo 1 is the
  // smallest acquisition month, so consumers doing `× multiplier`
  // under-reported by up to 1,655% in Year 3 of the stressed scenario
  // (~$3.29M cumulative under-report). Moved to AFTER the projection
  // loop alongside `operationalOverheadMonthly` (Thread A.3.2 fix).
  // `netMarginDollars` and `netMarginPercent` are computed AFTER the
  // cohort projection loop (see "KPI scalars derived from cohortProjection"
  // block) — they depend on `operationalOverheadMonthly` and
  // `welcomeKitCostPerMonth`, both averaged from the per-month series
  // emitted by the loop. Thread A.1 + A.3.2 fixes.

  // Revenue by tier
  const revenueByTier = tierDetails.map((t) => ({
    tierId: t.tierId,
    revenue: t.subscribers * t.revenuePerSub,
    subscribers: t.subscribers,
  }));

  // --- LTV / CAC per tier ---
  // Each tier uses its OWN commission (resolved with global fallback
  // above). CAC reflects the tier's specific upfront + accelerator;
  // residualPerSub reflects the tier's specific residual % and delay.
  const avgChurn =
    tiers.length > 0
      ? tiers.reduce(
          (s, t) => s + t.churnRateMonthly * (t.subscriberPercent / 100),
          0
        ) / 100
      : 0.06;

  const ltvCacPerTier = tiers.map((tier, idx) => {
    const td = tierDetails[idx];
    const tc = tierCommissions[idx];
    const churnDecimal = tier.churnRateMonthly / 100;
    // With minimum commitment: subscriber is locked in for commitMonths, then churn starts.
    // Expected lifetime = commitMonths + (1/churnRate) for the post-commitment period.
    const tierCommit = Math.max(1, tier.minimumCommitMonths ?? 1);
    const postCommitLifetime = churnDecimal > 0 ? 1 / churnDecimal : Infinity;
    const avgLifetimeMonths = postCommitLifetime === Infinity
      ? Infinity
      : (tierCommit - 1) + postCommitLifetime; // commitMonths guaranteed + expected churn period

    // CAC = upfront commission (THIS TIER's accelerator-weighted bonus)
    // + first-month COGS + welcome kit (one-time freebie shipped at
    // acquisition; same scalar for every tier — it's the kit's
    // retail-cost cap, not tier-specific).
    const cac = tc.effectiveFlatBonus + td.cogsPerSub + welcomeKitCostPerSub;

    // Residual cost per sub — adjusted for delay. During the delay period the rep
    // earns nothing, so effective residual across the subscriber's lifetime is reduced.
    const resDelay = tc.residualDelay;
    let residualPerSub: number;
    if (resDelay === 0 || avgLifetimeMonths === Infinity) {
      residualPerSub = td.revenuePerSub * (tc.residualPercent / 100);
    } else {
      // Effective residual = residual% × (lifetime - delay) / lifetime
      const residualMonths = Math.max(0, avgLifetimeMonths - resDelay);
      residualPerSub =
        td.revenuePerSub *
        (tc.residualPercent / 100) *
        (residualMonths / avgLifetimeMonths);
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

  // --- 36-month cohort projection with true cohort tracking ---
  // Each month's acquisitions are tracked as a separate cohort. Churn only starts
  // AFTER the minimum commitment period expires. Chargebacks reduce new subs immediately.
  const cohortProjection: ScenarioResults["cohortProjection"] = [];
  let cumulativeProfit = 0;
  let operationBreakevenMonth = 0;

  // Precompute the rep count and sales-per-rep value for every month in
  // the projection window. When a schedule `override` is set, the engine
  // ignores the scalar `salesPerRepPerMonth` / `monthlyGrowthRate` and
  // reads both from the matching period (quarterly = 3 mo, biannual = 6
  // mo, annual = 12 mo). Without an override, the scalars apply uniformly.
  // Compounding is iterative because growth can step at period boundaries.
  // Index 0 = month 1, … Index 35 = month 36 (length = PROJECTION_MONTHS).
  const repsByMonth: number[] = [];
  const salesPerRepByMonth: number[] = [];
  const override = salesRepChannel.override;
  const overridePeriodMonths = override
    ? SALES_REP_OVERRIDE_PERIOD_MONTHS[override.frequency]
    : 0;
  const overrideByPeriod = new Map<
    number,
    NonNullable<typeof override>["periods"][number]
  >((override?.periods ?? []).map((p) => [p.period, p]));
  const resolveSalesPerRep = (m: number) => {
    if (override) {
      const period = Math.floor((m - 1) / overridePeriodMonths) + 1;
      const entry = overrideByPeriod.get(period);
      // Fall back to the scalar if a period entry is somehow missing
      // (shouldn't happen if the UI always renders all periods, but
      // keeps the engine defensive).
      return entry?.salesPerRepPerMonth ?? salesRepChannel.salesPerRepPerMonth;
    }
    return salesRepChannel.salesPerRepPerMonth;
  };
  const resolveGrowth = (m: number) => {
    if (override) {
      const period = Math.floor((m - 1) / overridePeriodMonths) + 1;
      const entry = overrideByPeriod.get(period);
      // Override stores a PERIOD rate (% growth across the period).
      // Compound it into a per-month rate so growth is smooth within
      // the period: monthly = (1 + periodRate)^(1/L) - 1, L = months.
      const periodRate =
        (entry?.monthlyGrowthRate ?? salesRepChannel.monthlyGrowthRate) / 100;
      return Math.pow(1 + periodRate, 1 / overridePeriodMonths) - 1;
    }
    return salesRepChannel.monthlyGrowthRate / 100;
  };
  for (let m = 1; m <= PROJECTION_MONTHS; m++) {
    if (m === 1) {
      repsByMonth.push(salesRepChannel.startingReps);
    } else {
      // Growth applied at month m takes the rate from m's period — so a
      // Q2 / H2 / Y2 override kicks in starting at the period's first
      // month. Reps[m] is Reps[m-1] grown by that month's rate.
      const g = resolveGrowth(m);
      repsByMonth.push(repsByMonth[m - 2] * (1 + g));
    }
    salesPerRepByMonth.push(resolveSalesPerRep(m));
  }

  // Weighted average minimum commitment months across tiers
  const blendedCommitMonths = tiers.length > 0
    ? tiers.reduce((s, t) => s + (t.minimumCommitMonths ?? 1) * (t.subscriberPercent / 100), 0)
    : 1;
  // Round to nearest integer for cohort math
  const commitMonths = Math.max(1, Math.round(blendedCommitMonths));

  // Track per-month net new subscribers (after chargebacks) for cohort survival
  const netNewSubsByMonth: number[] = [];
  const grossNewSubsByMonth: number[] = [];

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

  for (let month = 1; month <= PROJECTION_MONTHS; month++) {
    // Rep count and sales per rep — both honor the optional quarterly
    // overrides via the precomputed `repsByMonth` / `salesPerRepByMonth`
    // arrays (constant over the quarter, can step at quarter boundaries).
    const monthReps = repsByMonth[month - 1];
    const monthGrossNewSubs = Math.round(monthReps * salesPerRepByMonth[month - 1]);
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

    // ── Accounting basis: ACCRUAL ─────────────────────────────────────
    // The main projection loop (this `cohortProjection` series) reports
    // revenue on the ACCRUAL basis — recognized as the service is
    // delivered, smoothed monthly via `blendedRevenuePerSub`. The
    // per-cohort lifecycle loop further down emits the same scenario on
    // a CASH-FLOW basis (biannual/annual prepayments lump at billing
    // months). Both representations are correct and intentional.
    //
    // ── Final post-audit state of the financial UI (sub-etapas 1–3b) ──
    // Seven financial tabs, each labelled with `<AccountingBasisBadge>`:
    //   • Spreadsheet, Summary, Statement, Metrics, Charts → ACCRUAL
    //     (consume `cohortProjection.*` and derived KPIs: MRR, ARR,
    //      LTV, CAC, margins, profit split).
    //   • Cohort Individual, Cohort Aggregate          → CASH FLOW
    //     (consume `cohortLifecycles[c].months[*]`, lumped at billing
    //      months for biannual/annual subs).
    //
    // The `<AccountingBasisReconciliation>` numeric card lives on the
    // three detailed tables (Spreadsheet, Cohort Individual, Cohort
    // Aggregate) — not on the visual panels. Deferred revenue is
    // purely derived: `cashTotal − accrualTotal`. No engine logic
    // computes it independently.
    //
    // Audit benchmark scenario (50 acquisitions/mo, 30/10/10 split,
    // 36 months) pinned in
    // `src/components/financials/accounting-basis-reconciliation.test.ts`:
    //   accrual = $879,956 · cash = $990,498 · deferred = $110,542.
    //
    // Threads opened in parallel after the regime audit closed:
    //   A (P0) — `resolveOverhead(..., memberCount=0)` always reads
    //            the pre-launch baseline regardless of period.
    //   B (P1) — visual UI bugs bundle: `monthsToShow` capped at 24
    //            vs PROJECTION_MONTHS=36 in `financial-charts.tsx`;
    //            overhead line conditional on `milestone-scaled` mode;
    //            profit-split over-allocation warning missing in
    //            `metrics-panel.tsx`.
    //   C (debt) — pre-existing build failure in
    //            `src/components/earnings/earnings-client.tsx:145`.
    const monthRevenue = currentSubs * blendedRevenuePerSub;

    // Commission — computed per-tier so each tier can have its own
    // payoutDelay / residualDelay / clawback / accelerator structure.
    // We capture each tier's contribution alongside the totals so the UI
    // can render per-plan commission spend.
    let monthUpfrontCommission = 0;
    let monthResidualCommission = 0;
    const monthCommissionByTier: { tierId: string; upfront: number; residual: number }[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const tc = tierCommissions[i];
      const tier = tiers[i];
      const tierShare = tier.subscriberPercent / 100;
      const tierBlendedRev = tierDetails[i].revenuePerSub;
      let tierUpfront = 0;
      let tierResidual = 0;

      // Upfront — payoutDelay months after the cohort sale date.
      // Reps and sales-per-rep at the delayed (acquisition) month are
      // pulled from the precomputed arrays so quarterly overrides flow
      // through here too.
      const delayedMonth = month - tc.payoutDelay;
      if (delayedMonth >= 1) {
        const delayedMonthReps = repsByMonth[delayedMonth - 1];
        const delayedMonthGrossSales =
          delayedMonthReps * salesPerRepByMonth[delayedMonth - 1];
        // Apply clawback policy: when the structure has a clawback window
        // (default 60 days), upfront commission on charged-back sales is
        // reversed. Since this engine models chargebacks within the
        // acquisition month, we pay upfront on net (post-chargeback) sales.
        // Setting clawbackWindowDays = 0 turns clawback off (pays on gross).
        const commissionableSales =
          tc.clawbackWindow > 0
            ? delayedMonthGrossSales * (1 - chargebackRate)
            : delayedMonthGrossSales;
        tierUpfront = commissionableSales * tierShare * tc.effectiveFlatBonus;
      }

      // Residual — only on this tier's subs past its residualDelay.
      let tierResidualEligibleSubs = 0;
      for (let m = 0; m < month; m++) {
        const acquisitionMonth = m + 1;
        const monthsSinceAcquisition = month - acquisitionMonth;
        if (monthsSinceAcquisition >= tc.residualDelay) {
          const churnPeriods = Math.max(0, monthsSinceAcquisition - commitMonths + 1);
          tierResidualEligibleSubs += netNewSubsByMonth[m] * tierShare * Math.pow(1 - avgChurn, churnPeriods);
        }
      }
      tierResidual = tierResidualEligibleSubs * tierBlendedRev * (tc.residualPercent / 100);

      monthUpfrontCommission += tierUpfront;
      monthResidualCommission += tierResidual;
      monthCommissionByTier.push({
        tierId: tier.tierId,
        upfront: Math.round(tierUpfront),
        residual: Math.round(tierResidual),
      });
    }
    monthUpfrontCommission = Math.round(monthUpfrontCommission);
    monthResidualCommission = Math.round(monthResidualCommission);
    const monthTotalCommission = monthUpfrontCommission + monthResidualCommission;

    // Resolve overhead dynamically based on current subscriber count;
    // capture the per-category breakdown so the UI can show "Marketing
    // $5k · Tech $12k · Ops $4k" when the user is in categories mode.
    const monthOverheadResolved = resolveOverheadBreakdown(operationalOverhead, currentSubs);
    const monthOverhead = monthOverheadResolved.total;

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

    // Breakage profit (informational disclosure) — per-tier subs this
    // month × per-sub breakage rate. Uses `currentSubs` so the figure
    // tracks growth/churn correctly. Does NOT roll into `monthCosts` /
    // `monthProfit`: COGS already incorporates the redemption discount
    // (avoiding double-count). Thread D.3.2.
    const monthBreakageProfit = tiers.reduce((sum, tier, i) => {
      const tierSubs = Math.round(currentSubs * (tier.subscriberPercent / 100));
      return sum + tierSubs * tierBreakagePerSub[i];
    }, 0);

    // Leadership commission (S6/S7, accrual) — base × the rate of the levels
    // ACTIVE this month (activation gated by this month's activeReps). Base is
    // recognized revenue / gross margin / rep commission per the plan.
    const monthLeadershipBase =
      leadershipBase === "margin"
        ? monthRevenue - currentSubs * costPerSubscriber
        : leadershipBase === "repCommission"
          ? monthTotalCommission
          : monthRevenue;
    const monthLeadershipCommission =
      monthLeadershipBase * leadershipRateAt(Math.round(monthReps));

    const monthCosts =
      currentSubs * costPerSubscriber +
      monthTotalCommission +
      monthChargebackCost +
      monthOverhead +
      monthBuckCost +
      monthAddOnCost +
      monthWelcomeKitCost +
      monthLeadershipCommission;
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

    // Per-tier revenue this month — distribute `currentSubs` across
    // tiers via `subscriberPercent` and multiply by each tier's
    // `revenuePerSub` (a time-invariant per-sub blended cycle rate).
    // Σ revenueByTier[].revenue ≡ monthRevenue by construction (modulo
    // floating-point), enabling the per-tier UI displays without
    // leaning on the Mo-1-frozen `results.revenueByTier` scalar.
    const revenueByTier = tiers.map((tier, i) => ({
      tierId: tier.tierId,
      revenue:
        currentSubs * (tier.subscriberPercent / 100) *
        (tierDetails[i]?.revenuePerSub ?? 0),
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
      operationalOverheadByCategory: monthOverheadResolved.byCategory,
      netProfit: monthProfit,
      cumulativeProfit,
      commissionExpense: monthTotalCommission,
      commissionByTier: monthCommissionByTier,
      chargebackCost: monthChargebackCost,
      cogsExpense: currentSubs * costPerSubscriber,
      buckPlatformCost: monthBuckCost,
      buckLicenseCost: monthBuckLicenseCost,
      buckTokenCost: monthBuckTokenCost,
      addOnCost: monthAddOnCost,
      welcomeKitCost: monthWelcomeKitCost,
      leadershipCommissionCost: monthLeadershipCommission,
      breakageProfit: monthBreakageProfit,
      newSubsByTier,
      revenueByTier,
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

  // ── KPI scalars derived from cohortProjection ────────────────────
  // `operationalOverheadMonthly` is the "typical month" overhead used
  // by `netMarginDollars` and downstream KPIs (Net Margin %, Profit
  // Split distribution). It aggregates from `cohortProjection` —
  // `cohortProjection[i].operationalOverhead` already honors the
  // user's milestone schedule via line ~1461
  // (`resolveOverheadBreakdown(overhead, currentSubs)`).
  //
  // ── META-LESSON (Thread A.1 + A.2, 2026-05) ──────────────────────
  //
  // The scalar pattern that produced the original bug was:
  //
  //   const x = expensiveLookup(state, 0);   // "0" or any constant
  //   const total = x * periodLength;         // scaled by multiplier
  //
  // This pattern under-reports whenever `state` evolves over time
  // and `expensiveLookup`'s output depends on that evolution. In
  // overhead's case: subs grow → milestones cross → overhead steps
  // up. Multiplying the FROZEN-AT-ZERO value by the period length
  // produces "what overhead would be if nothing happened" — exactly
  // what the bug was reporting.
  //
  // The fix pattern is: aggregate from the per-month series the
  // engine already computes. Sum it for "P&L of period X", average
  // it for "typical monthly KPI", take the last value for
  // "steady-state snapshot". The per-month series is the source of
  // truth; scalars are derivations of it, never parallel computations.
  //
  // RULE: before adding ANY scalar KPI derived from subscriber count
  // (or any other projection-state variable), ask "does this value
  // already exist aggregable in `cohortProjection`?" If yes —
  // aggregate from there. If no — add it to the projection loop
  // first, THEN aggregate. Do NOT create a standalone scalar
  // computation that ignores projection state.
  //
  // ── UNIVERSALIZED ────────────────────────────────────────────────
  //
  // Thread A.2's pause-and-report itself proved the rule applies
  // beyond code: the spec for this fix asserted "year 1 = $684k",
  // computed mentally as `$57k × 12` — committing the same anti-
  // pattern (steady-state value × periodLength, ignoring the ramp).
  // The actual year 1 is $445k because subs cross milestones during
  // the year. The rule extends to mental estimates during code
  // review and spec authoring: when reasoning about "value × period",
  // ask whether the value is constant over that period. If not,
  // sum the actual per-period series — don't multiply.
  //
  // Semantics chosen: AVERAGE of the projection window. Represents
  // "typical monthly overhead in steady state." In degenerate
  // scenarios (single milestone @ 0 subs), avg == baseline ==
  // legacy behavior — fix is invisible. In growth scenarios with
  // multi-milestone categories, avg correctly reflects the user's
  // configured schedule weighted by time.
  //
  // ── ROOT-CAUSE ERADICATION (Thread D.2, 2026-05) ─────────────────
  //
  // A.2 (overhead) and A.3.2 (welcome-kit) corrected two SYMPTOMS of
  // the same architectural defect. Thread D's structural audit revealed
  // that the entire ScenarioResults aggregate-scalar surface was
  // affected: `mrr`, `totalProductCost`, `totalFulfillmentCost`,
  // `totalCommissionExpense`, `chargebackCostPerMonth`,
  // `chargebacksPerMonth`, `grossMarginDollars`, `tierDetails[].subscribers`,
  // `revenueByTier[].revenue` — all 9 were `Mo1Subs × something` then
  // multiplied by `multiplier` in P&L Statement / Metrics / Charts.
  // Magnitude up to 5,697%/36mo in growth scenarios.
  //
  // D.2 eradicated the root cause: every period-total scalar in the
  // return statement now derives from `cohortProjection` averages
  // (declared post-loop alongside `operationalOverheadMonthly` and
  // `welcomeKitCostPerMonth`). The 35 `× multiplier` consumer call
  // sites in P&L Statement, Metrics, and Charts were rewritten to
  // sum the first `multiplier` months from `cohortProjection`
  // directly — exact mathematics for partial-period displays.
  //
  // Internal pre-loop computations (tierDetails per-sub values,
  // LTV/CAC math, blendedRevenuePerSub, costPerSubscriber) keep
  // their Mo-1-derived semantics — they're per-sub or ratio values
  // that are time-invariant by construction.
  //
  // ── EXTENDED META-LESSON ─────────────────────────────────────────
  //
  // If you find yourself writing a comment like "we accept this
  // approximation as reasonable" to justify multiplying a snapshot
  // value by a period length, STOP. That comment is a red flag for
  // the same anti-pattern the entire `ScenarioResults` surface
  // exhibited pre-D.2. Sub-etapa 3b documented the welcome-kit
  // linearization as "reasonable approximation"; A.3 quantified
  // it as 1,655% off in Year 3. If a calculation needs textual
  // justification to be acceptable, it's probably wrong. The
  // correct alternative is almost always: aggregate from
  // `cohortProjection` per-month series — the engine already
  // computes the truth there, you just have to read it.
  const operationalOverheadMonthly =
    cohortProjection.length > 0
      ? cohortProjection.reduce((sum, m) => sum + m.operationalOverhead, 0) /
        cohortProjection.length
      : 0;

  // `welcomeKitCostPerMonth` follows the SAME pattern as
  // `operationalOverheadMonthly` above — see the meta-lesson doc block
  // attached to it. Pre-A.3.2 was `month1GrossNewSubs × welcomeKitCostPerSub`
  // (Mo 1 acquisitions only, frozen at the lowest point of any growth
  // scenario). Now it averages the per-month welcome-kit series the
  // projection loop already emits at `cohortProjection[i].welcomeKitCost`
  // (= `monthGrossNewSubs[i] × welcomeKitCostPerSub`, line ~1520).
  // Same KPI semantics as overhead: "typical monthly cost in steady
  // state." In default-seed scenarios with `welcomeKitCostPerSub: 0`,
  // every month is 0 → average is 0 → behavior matches pre-fix.
  const welcomeKitCostPerMonth =
    cohortProjection.length > 0
      ? cohortProjection.reduce((sum, m) => sum + (m.welcomeKitCost ?? 0), 0) /
        cohortProjection.length
      : 0;

  // `totalBreakageProfit` follows the same pattern as the scalars above
  // (Thread A.2 overhead, A.3.2 welcome-kit, D.2 nine-scalar sweep). Pre-
  // D.3.2 was Σ_tier round(Mo1Subs × pct) × per-sub-rate — frozen at the
  // smallest acquisition month, then `× m` in the UI under-reported up to
  // 5,797% over 36mo in growth scenarios. Now: average of the per-month
  // series emitted above (`cohortProjection[i].breakageProfit`). Default
  // seed (creditRedemptionRate=1 or monthlyCredits=0) → every month is 0
  // → average is 0 → behavior matches pre-fix.
  const totalBreakageProfit =
    cohortProjection.length > 0
      ? cohortProjection.reduce((sum, m) => sum + (m.breakageProfit ?? 0), 0) /
        cohortProjection.length
      : 0;


  // ── Thread D.2 — root-cause fix for the entire aggregate-scalar bug
  // class. Every scalar below replaces a Mo-1-frozen pre-loop counterpart
  // (whose value was `month1Subs × something`, multiplied by `multiplier`
  // in P&L Statement / Metrics / Charts and under-reporting up to
  // 5,697%/36mo in growth scenarios). The replacements are simple
  // averages of the per-month series the projection loop already emits.
  // The pre-loop computations stay intact for INTERNAL use (per-sub
  // values, LTV/CAC, blendedRevenuePerSub) where Mo-1-baseline math is
  // semantically correct (per-sub values are time-invariant across the
  // scenario; ratios derived from Mo-1 numerator+denominator are the
  // same ratios derived from any matched pair of values).
  //
  // Triangulation: in the audit scenario (50 acquisitions/mo, no growth,
  // 36mo), `mrrAvg × 36 ≈ Σ cohortProjection.revenue ≈ $879,956` —
  // matches the audit pinned reconciliation test by construction.
  const _N = cohortProjection.length;
  const _avg = (key: keyof (typeof cohortProjection)[number]): number =>
    _N > 0
      ? cohortProjection.reduce((s, m) => s + (Number(m[key]) || 0), 0) / _N
      : 0;

  const mrrAvg = _avg("revenue");

  // ── ARR semantic disambiguation (Thread D.3.3, 2026-05) ──────────
  //
  // Pre-D.3.3 the engine exposed a single `arr = mrr × 12`. After D.2
  // `mrr` is the AVERAGE of `cohortProjection[].revenue` over the
  // 36-month horizon — so `arr` was effectively "12 × average". That
  // diverges materially from the SaaS convention: in pitch decks and
  // board updates, "ARR" means "current run-rate × 12" — i.e. exit
  // ARR. In the stressed scenario the two readings differ by ~3.5×
  // ($15.3M avg vs $54.1M exit).
  //
  // Decision: expose three readings as separate fields, and alias
  // `arr` to `arrExit` so the default UI label matches investor
  // convention.
  //
  //   arrAvg    = mrr × 12                   (status quo of D.2)
  //   arrExit   = mrrExit × 12               (SaaS convention)
  //   arr       = arrExit                    (alias)
  //   revenueY1 = Σ cohortProjection[0..11]  (realized Y1 top-line)
  //
  // `revenueY1` is intentionally NOT labeled "ARR" — it's realized
  // revenue, not an annualized run-rate. Useful for Y1 cash-flow
  // forecasting alongside the ARR fields.
  const mrrExit =
    cohortProjection.length > 0
      ? cohortProjection[cohortProjection.length - 1].revenue
      : 0;
  const arrAvg = mrrAvg * 12;
  const arrExit = mrrExit * 12;
  const revenueY1 = cohortProjection
    .slice(0, 12)
    .reduce((s, m) => s + m.revenue, 0);

  const totalProductCostAvg = _avg("cogsExpense");
  // Fulfillment is recurring per-active-sub at the scenario-level rate.
  // The aggregate `cohortProjection` doesn't carry shipping/handling
  // separately (those live on `cohortLifecycles.months` for the cash-flow
  // view), so derive avg fulfillment from `avgTotalSubscribers` × the
  // scenario-level rate. Equivalent in steady state to summing per-cohort
  // ship+handle via cohortLifecycles aggregation, simpler to compute.
  const avgTotalSubscribersForFulfillment =
    _N > 0
      ? cohortProjection.reduce((s, m) => s + m.subscribers, 0) / _N
      : 0;
  const totalFulfillmentCostAvg =
    avgTotalSubscribersForFulfillment *
    (fulfillmentCostPerOrder + shippingCostPerOrder);
  const totalCommissionExpenseAvg = _avg("commissionExpense");
  const chargebackCostPerMonthAvg = _avg("chargebackCost");
  const chargebacksPerMonthAvg = _avg("chargebacks");
  const grossMarginDollarsAvg = mrrAvg - totalProductCostAvg;
  const grossMarginPercentAvg =
    mrrAvg > 0 ? (grossMarginDollarsAvg / mrrAvg) * 100 : 0;
  const commissionPercentOfRevenueAvg =
    mrrAvg > 0 ? (totalCommissionExpenseAvg / mrrAvg) * 100 : 0;

  // tierDetails subscribers — average across the projection window,
  // distributed by tier share. Per-tier `revenuePerSub`, `cogsPerSub`,
  // `marginPerSub`, `marginPercent`, `ltv` are time-invariant per-sub
  // properties — they stay as-is.
  const avgTotalSubscribers =
    _N > 0
      ? cohortProjection.reduce((s, m) => s + m.subscribers, 0) / _N
      : 0;
  const tierDetailsWithAvgSubs = tierDetails.map((td) => {
    const tier = tiers.find((t) => t.tierId === td.tierId);
    const sharePct = tier?.subscriberPercent ?? 0;
    return {
      ...td,
      subscribers: avgTotalSubscribers * (sharePct / 100),
    };
  });

  // Per-tier revenue — average across the projection window. Replaces
  // the pre-loop `revenueByTier = tierDetails.subscribers × revenuePerSub`
  // (Mo-1-frozen). Reads from the new `cohortProjection[i].revenueByTier`
  // emission (Thread D.2 Tarefa 1).
  const revenueByTierAvg = tiers.map((tier) => {
    const totalForTier =
      _N > 0
        ? cohortProjection.reduce((s, m) => {
            const e = m.revenueByTier?.find((rt) => rt.tierId === tier.tierId);
            return s + (e?.revenue ?? 0);
          }, 0) / _N
        : 0;
    const subsForTier = avgTotalSubscribers * (tier.subscriberPercent / 100);
    return {
      tierId: tier.tierId,
      revenue: totalForTier,
      subscribers: subsForTier,
    };
  });

  // netMarginDollars — average of the per-month net profit. Equivalent
  // to (avg revenue − avg COGS − avg commission − avg chargeback − avg
  // welcomeKit − avg overhead + avg kickback), but reading from
  // `netProfit` directly avoids drift from independent averaging of
  // sub-components.
  const netMarginDollars = _avg("netProfit");
  const netMarginPercent =
    mrrAvg > 0 ? (netMarginDollars / mrrAvg) * 100 : 0;

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
  // Split shipping vs handling so the UI can render two separate
  // COGS lines. Sum still equals the legacy combined blend.
  let blendedShippingPerSub = 0;
  let blendedHandlingPerSub = 0;
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
    // Per-tier values when set, else fall back to the scenario-level
    // shipping/fulfillment fields (handling ≈ fulfillment).
    const tierShipping = hasPerTierShipping
      ? tier.avgShippingCost ?? 0
      : shippingCostPerOrder;
    const tierHandling = hasPerTierShipping
      ? tier.avgHandlingCost ?? 0
      : fulfillmentCostPerOrder;
    blendedProductCogsPerSub += sf * (tierCreditCogs + tierProductCogs);
    blendedShippingPerSub += sf * tierShipping;
    blendedHandlingPerSub += sf * tierHandling;
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
  // group of subs forward to the end of the 36-month window. Revenue
  // is modeled in CASH-FLOW view: monthly subs pay every month;
  // biannual subs lump-pay 6 months at Mo 1, 7, 13, 19; annual subs
  // lump-pay 12 months at Mo 1, 13. Costs split into the recurring
  // pieces (product COGS, shipping+handling, Buck) and the lump pieces
  // (payment processing, which fires when revenue does).
  const cohortLifecycles: ScenarioResults["cohortLifecycles"] = [];
  for (let acqM = 1; acqM <= PROJECTION_MONTHS; acqM++) {
    const grossNewSubs = grossNewSubsByMonth[acqM - 1];
    const netNewSubs = netNewSubsByMonth[acqM - 1];
    const chargebacks = grossNewSubs - netNewSubs;
    if (grossNewSubs <= 0) continue;

    const months: ScenarioResults["cohortLifecycles"][number]["months"] = [];
    let cohortCumulativeProfit = 0;
    let paybackMonth: number | null = null;

    // Cumulative totals for the cohort lifetime (capped at PROJECTION_MONTHS).
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
    // Per-tier × per-cycle SUB-COUNT accumulators for the totals row
    // (sums of fractional sub-months — useful as a check, not as a
    // standalone metric).
    const totalSubsByTierAndCycle = tiers.map((tier) => ({
      tierId: tier.tierId,
      monthly: 0,
      biannual: 0,
      annual: 0,
    }));
    let totalProductCogsCost = 0;
    let totalShippingCost = 0;
    let totalHandlingCost = 0;
    let totalShippingHandlingCost = 0;
    let totalPaymentProcessingCost = 0;
    let totalBuckLicenseCost = 0;
    let totalBuckTokenCost = 0;
    let totalBuckCost = 0;
    let totalWelcomeKit = 0;
    let totalChargeback = 0;
    let totalCommissionUpfront = 0;
    let totalCommissionResidual = 0;
    const totalCommissionByTier: { tierId: string; upfront: number; residual: number }[] =
      tiers.map((t) => ({ tierId: t.tierId, upfront: 0, residual: 0 }));
    let totalAddOnCost = 0;
    let totalNetProfit = 0;

    let prevSurviving = netNewSubs;
    for (let calM = acqM; calM <= PROJECTION_MONTHS; calM++) {
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

      // Per-tier × per-cycle SUB COUNTS + REVENUE — both derived from
      // the same `tierSurvivingSubs × cycle-share` math, so revenue at
      // a lump month is exactly `count × rate × cycleMonths`. The user
      // can audit any cell: count × rate × N = expected lump.
      // Counts are FRACTIONAL (the engine doesn't round per-tier-per-
      // cycle); rounding would break revenue reconciliation.
      const subscribersByTierAndCycle: {
        tierId: string;
        monthly: number;
        biannual: number;
        annual: number;
      }[] = [];
      const revenueByTierAndCycle = tiers.map((tier) => {
        const tb = tier.billingDistribution ?? billingCycleDistribution;
        const sf = tier.subscriberPercent / 100;
        const tierSurvivingSubs = survivingSubs * sf;
        const tierMonthlySubs = tierSurvivingSubs * (tb.monthly / 100);
        const tierBiannualSubs = tierSurvivingSubs * (tb.biannual / 100);
        const tierAnnualSubs = tierSurvivingSubs * (tb.annual / 100);
        subscribersByTierAndCycle.push({
          tierId: tier.tierId,
          monthly: tierMonthlySubs,
          biannual: tierBiannualSubs,
          annual: tierAnnualSubs,
        });
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
        totalSubsByTierAndCycle[i].monthly += subscribersByTierAndCycle[i].monthly;
        totalSubsByTierAndCycle[i].biannual += subscribersByTierAndCycle[i].biannual;
        totalSubsByTierAndCycle[i].annual += subscribersByTierAndCycle[i].annual;
      }

      // Cost-of-goods broken into 3 components.
      // Product COGS and shipping/handling are RECURRING — we ship
      // product every month to every active sub regardless of their
      // billing cycle.
      const productCogsCost = survivingSubs * blendedProductCogsPerSub;
      const shippingCost = survivingSubs * blendedShippingPerSub;
      const handlingCost = survivingSubs * blendedHandlingPerSub;
      const shippingHandlingCost = shippingCost + handlingCost;

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
      // cohort; clawback policy mirrors the main loop (paid on net sales
      // when window > 0, gross otherwise). Computed per-tier so each plan
      // can have its own structure; capture per-tier breakdown for the UI.
      let commissionUpfront = 0;
      let commissionResidual = 0;
      const commissionByTier: { tierId: string; upfront: number; residual: number }[] = [];
      for (let i = 0; i < tiers.length; i++) {
        const tc = tierCommissions[i];
        const tier = tiers[i];
        const tierShare = tier.subscriberPercent / 100;
        const tierBlendedRev = tierDetails[i].revenuePerSub;
        let tierUpfront = 0;
        let tierResidual = 0;

        if (monthOfLife === 1 + tc.payoutDelay) {
          const commissionableSales =
            tc.clawbackWindow > 0 ? netNewSubs : grossNewSubs;
          tierUpfront = commissionableSales * tierShare * tc.effectiveFlatBonus;
        }
        if (monthsActive >= tc.residualDelay) {
          tierResidual =
            survivingSubs * tierShare * tierBlendedRev * (tc.residualPercent / 100);
        }

        commissionUpfront += tierUpfront;
        commissionResidual += tierResidual;
        commissionByTier.push({
          tierId: tier.tierId,
          upfront: tierUpfront,
          residual: tierResidual,
        });
      }

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

      // Leadership commission (S6/S7, cash) — this cohort-month's collected
      // revenue / gross margin / rep commission × the rate of the levels ACTIVE
      // at this calendar month (activation gated by the channel-wide activeReps
      // at calM, read from the already-built cohortProjection).
      const cohortLeadershipBase =
        leadershipBase === "margin"
          ? revenue - productCost
          : leadershipBase === "repCommission"
            ? commissionUpfront + commissionResidual
            : revenue;
      const cohortLeadershipCommission =
        cohortLeadershipBase *
        leadershipRateAt(cohortProjection[calM - 1]?.activeReps ?? 0);

      const netProfit =
        revenue -
        productCost -
        buckCost -
        welcomeKitCost -
        chargebackCost -
        commissionUpfront -
        commissionResidual -
        cohortAddOnCost -
        cohortLeadershipCommission;

      cohortCumulativeProfit += netProfit;
      if (paybackMonth == null && cohortCumulativeProfit >= 0) {
        paybackMonth = monthOfLife;
      }

      totalRevenue += revenue;
      totalRevByMonthly += revenueByMonthly;
      totalRevByBiannual += revenueByBiannual;
      totalRevByAnnual += revenueByAnnual;
      totalProductCogsCost += productCogsCost;
      totalShippingCost += shippingCost;
      totalHandlingCost += handlingCost;
      totalShippingHandlingCost += shippingHandlingCost;
      totalPaymentProcessingCost += paymentProcessingCost;
      totalBuckLicenseCost += buckLicenseCost;
      totalBuckTokenCost += buckTokenCost;
      totalBuckCost += buckCost;
      totalWelcomeKit += welcomeKitCost;
      totalChargeback += chargebackCost;
      totalCommissionUpfront += commissionUpfront;
      totalCommissionResidual += commissionResidual;
      for (const tc of commissionByTier) {
        const slot = totalCommissionByTier.find((s) => s.tierId === tc.tierId);
        if (slot) {
          slot.upfront += tc.upfront;
          slot.residual += tc.residual;
        }
      }
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
        subscribersByTierAndCycle,
        productCogsCost,
        shippingCost,
        handlingCost,
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
        commissionByTier,
        addOnCost: cohortAddOnCost,
        leadershipCommissionCost: cohortLeadershipCommission,
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
        subscribersByTierAndCycle: totalSubsByTierAndCycle,
        productCogsCost: totalProductCogsCost,
        shippingCost: totalShippingCost,
        handlingCost: totalHandlingCost,
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
        commissionByTier: totalCommissionByTier,
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

  // --- Monthly profit distribution, per accounting basis (S1 → S2 cascade) ---
  // Each cost rubric is either `shared` (deducted pre-split, lowering the
  // distributable every party shares) or attributed to a party (deducted from
  // that party's own slice, post-split). Built by ADD-BACK, not by recomputing
  // net profit: `netProfit_S1` already nets every cost, so attributing a rubric
  // to a party means adding it back into the distributable and charging it to
  // the owning party. With every rubric shared (default), totalPartyCosts is 0
  // and the cascade collapses exactly to S1 (distributable ≡ netProfit_S1,
  // amount ≡ net). partnerKickbacks are untouched (D7) — they ride inside
  // netProfit_S1's composition (accrual + / cash −), not as a rubric.
  const undistributedShare = (100 - totalSplitPercent) / 100;

  // A partyId no longer present in profitSplitParties is treated as `shared`,
  // so removing a party never breaks the cascade (validation on read).
  const validPartyIds = new Set((profitSplitParties ?? []).map((p) => p.id));
  const rubricOwner = (rubric: CostRubric): string | null => {
    const target = inputs.costAttribution?.[rubric];
    return target && target !== "shared" && validPartyIds.has(target.partyId)
      ? target.partyId
      : null;
  };

  // Loss handling (D8): mode + resolved bearer (invalid/removed bearer ⇒ null
  // ⇒ the loss flows to `undistributed`). Resolved once; applied per loss month.
  const lossMode: LossHandling = inputs.lossHandling ?? "absorbed";
  const resolvedLossBearerId =
    inputs.lossBearerPartyId && validPartyIds.has(inputs.lossBearerPartyId)
      ? inputs.lossBearerPartyId
      : null;

  const COST_RUBRICS: CostRubric[] = [
    "cogs",
    "commission",
    "chargeback",
    "operationalOverhead",
    "buckPlatform",
    "addOn",
    "welcomeKit",
    "leadershipCommission",
  ];

  // Per-rubric cost for a given accrual month — straight off cohortProjection.
  const accrualRubricCost = (
    m: (typeof cohortProjection)[number],
    rubric: CostRubric,
  ): number => {
    // These per-rubric fields are typed optional on cohortProjection (added
    // post-hoc) but the projection loop always emits them — `?? 0` satisfies
    // the type and is a runtime no-op. `operationalOverhead` is required.
    switch (rubric) {
      case "cogs":
        return m.cogsExpense ?? 0;
      case "commission":
        return m.commissionExpense ?? 0;
      case "chargeback":
        return m.chargebackCost ?? 0;
      case "operationalOverhead":
        return m.operationalOverhead;
      case "buckPlatform":
        return m.buckPlatformCost ?? 0;
      case "addOn":
        return m.addOnCost ?? 0;
      case "welcomeKit":
        return m.welcomeKitCost ?? 0;
      case "leadershipCommission":
        return m.leadershipCommissionCost ?? 0;
    }
  };

  // Per-calendar-month cost of each rubric on the CASH basis — aggregate the
  // cohort lifecycle months by monthIndex (same mechanism S1 uses for
  // netProfit). The cohort `productCost` is the cash-basis COGS (product +
  // shipping/handling + payment). Overhead is scenario-level, taken from
  // cohortProjection at the same calendar month (not cohort-attributed).
  const cashRubricCost: Record<CostRubric, number[]> = {
    cogs: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    commission: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    chargeback: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    operationalOverhead: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    buckPlatform: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    addOn: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    welcomeKit: Array.from({ length: PROJECTION_MONTHS }, () => 0),
    leadershipCommission: Array.from({ length: PROJECTION_MONTHS }, () => 0),
  };
  for (const cohort of cohortLifecycles) {
    for (const mo of cohort.months) {
      const i = mo.monthIndex - 1;
      cashRubricCost.cogs[i] += mo.productCost;
      cashRubricCost.commission[i] += mo.commissionUpfront + mo.commissionResidual;
      cashRubricCost.chargeback[i] += mo.chargebackCost;
      cashRubricCost.buckPlatform[i] += mo.buckCost;
      cashRubricCost.addOn[i] += mo.addOnCost;
      cashRubricCost.welcomeKit[i] += mo.welcomeKitCost;
      cashRubricCost.leadershipCommission[i] += mo.leadershipCommissionCost;
    }
  }
  for (let i = 0; i < PROJECTION_MONTHS; i++) {
    cashRubricCost.operationalOverhead[i] = cohortProjection[i]?.operationalOverhead ?? 0;
  }

  // Build one month's cascade from its S1 net profit + a per-rubric cost lookup.
  const buildMonthDistribution = (
    month: number,
    netProfitS1: number,
    rubricCost: (rubric: CostRubric) => number,
    leadershipLevelBreakdown: { id: string; name: string; amount: number }[] = [],
  ): MonthlyPartyDistribution => {
    const partyCostById = new Map<string, number>();
    const partyBreakdownById = new Map<string, PartyCostBreakdownEntry[]>();
    let totalPartyCosts = 0;
    let sharedCosts = 0;
    for (const rubric of COST_RUBRICS) {
      const cost = rubricCost(rubric);
      const owner = rubricOwner(rubric);
      if (owner) {
        partyCostById.set(owner, (partyCostById.get(owner) ?? 0) + cost);
        const entry: PartyCostBreakdownEntry =
          rubric === "leadershipCommission" && leadershipLevelBreakdown.length > 0
            ? { rubric, amount: cost, levels: leadershipLevelBreakdown }
            : { rubric, amount: cost };
        const list = partyBreakdownById.get(owner) ?? [];
        list.push(entry);
        partyBreakdownById.set(owner, list);
        totalPartyCosts += cost;
      } else {
        sharedCosts += cost;
      }
    }
    const distributable = netProfitS1 + totalPartyCosts;

    // Loss-handling branch (D8): in an "absorbed" loss month the channel loss
    // is pulled out of the proportional split — no party gets a negative gross
    // slice; the whole loss goes to the bearer (if valid) or to `undistributed`.
    // Profitable months and "proportional" mode keep the S2 behavior. Note we
    // clamp only the CHANNEL loss — a party `net` going negative because its own
    // attributed costs exceed its slice in a profitable month is left as-is.
    const absorbedLoss = distributable < 0 && lossMode === "absorbed";
    const byParty = (profitSplitParties ?? []).map((p) => {
      const amount = absorbedLoss
        ? p.id === resolvedLossBearerId
          ? distributable
          : 0
        : distributable * (p.percent / 100);
      const partyCost = partyCostById.get(p.id) ?? 0;
      return {
        partyId: p.id,
        percent: p.percent,
        amount,
        partyCost,
        net: amount - partyCost,
        costBreakdown: partyBreakdownById.get(p.id) ?? [],
      };
    });
    const undistributed = absorbedLoss
      ? resolvedLossBearerId
        ? 0
        : distributable
      : distributable * undistributedShare;
    return {
      month,
      distributable,
      byParty,
      undistributed,
      sharedCosts,
      channelResult: distributable - totalPartyCosts, // ≡ netProfitS1, independent of attribution
    };
  };

  // Per calendar month, split the leadership-commission rubric cost across the
  // active levels in proportion to each level's effective rate. Exact because
  // all cohorts at a calendar month share the same active set (gated by that
  // month's `activeReps`), so `costᵢ = baseᵢ × Σ effRate` and a level's slice is
  // `costᵢ × effRate_L / Σ effRate`. Empty when no level is active or rate is 0.
  const leadershipByLevelForMonth = (
    rubricCostAt: (i: number) => number,
  ): { id: string; name: string; amount: number }[][] =>
    Array.from({ length: PROJECTION_MONTHS }, (_, i) => {
      const reps = cohortProjection[i]?.activeReps ?? 0;
      const active = leadershipLevels.filter((lvl) => reps >= lvl.threshold);
      const totalRate = active.reduce((s, lvl) => s + lvl.effectiveRate, 0);
      const total = rubricCostAt(i);
      if (totalRate <= 0 || total === 0) return [];
      return active.map((lvl) => ({
        id: lvl.id,
        name: lvl.name,
        amount: (total * lvl.effectiveRate) / totalRate,
      }));
    });
  const accrualLeadershipByLevel = leadershipByLevelForMonth((i) =>
    accrualRubricCost(cohortProjection[i], "leadershipCommission"),
  );
  const cashLeadershipByLevel = leadershipByLevelForMonth(
    (i) => cashRubricCost.leadershipCommission[i],
  );

  // Accrual: netProfit_S1[m] = cohortProjection[m].netProfit (fully loaded —
  // revenue − every cost, incl. overhead/Buck — see the monthCosts block).
  const accrualMonthly: MonthlyPartyDistribution[] = cohortProjection.map((m, i) =>
    buildMonthDistribution(
      m.month,
      m.netProfit,
      (rubric) => accrualRubricCost(m, rubric),
      accrualLeadershipByLevel[i],
    ),
  );

  // Cash: netProfit_S1[m] = Σ cohort-lifecycle netProfit by calendar month −
  // scenario-level overhead — the same composition the Cohort Aggregate view
  // reconciles to.
  const cashNetByMonth = Array.from({ length: PROJECTION_MONTHS }, () => 0);
  for (const cohort of cohortLifecycles) {
    for (const mo of cohort.months) {
      cashNetByMonth[mo.monthIndex - 1] += mo.netProfit;
    }
  }
  const cashMonthly: MonthlyPartyDistribution[] = cashNetByMonth.map((net, i) =>
    buildMonthDistribution(
      i + 1,
      net - (cohortProjection[i]?.operationalOverhead ?? 0),
      (rubric) => cashRubricCost[rubric][i],
      cashLeadershipByLevel[i],
    ),
  );

  const partyTotals = (months: MonthlyPartyDistribution[]): PartyDistributionTotal[] =>
    (profitSplitParties ?? []).map((p) => {
      const slices = months.map((m) => m.byParty.find((b) => b.partyId === p.id));
      const amount = slices.reduce((s, b) => s + (b?.amount ?? 0), 0);
      const partyCostTotal = slices.reduce((s, b) => s + (b?.partyCost ?? 0), 0);
      return {
        partyId: p.id,
        name: p.name,
        percent: p.percent,
        amount,
        partyCostTotal,
        netTotal: amount - partyCostTotal, // ≡ Σ monthly net
      };
    });

  const profitDistribution: ProfitDistributionByBasis = {
    accrual: accrualMonthly,
    cash: cashMonthly,
    totals: { accrual: partyTotals(accrualMonthly), cash: partyTotals(cashMonthly) },
  };

  // Sales-team headcount per month. A level has `floor(activeReps / threshold)`
  // managers (threshold = cumulative span ⇒ 1 manager per `threshold` reps).
  // Ordered TOP → BASE so the UI reads highest level first, reps at the bottom.
  const salesTeam: ScenarioResults["salesTeam"] = {
    levels: [...leadershipLevels].reverse().map((lvl) => ({
      id: lvl.id,
      name: lvl.name,
      threshold: lvl.threshold,
      headcountByMonth: cohortProjection.map((m) => Math.floor(m.activeReps / lvl.threshold)),
    })),
    repsByMonth: cohortProjection.map((m) => m.activeReps),
  };

  // --- Per-member career-trajectory earnings (S-member) ---
  // ONE rep present from month 1, selling `salesPerRepByMonth` each month:
  // upfront on each sale (deferred by payoutDelay, clawback-netted) plus a
  // residual that ramps as their churning book matures. Per tier, mirroring the
  // channel commission loop with reps = 1.
  const monthsCount = cohortProjection.length;
  const repNetNewByMonth = salesPerRepByMonth.map((s) => s * (1 - chargebackRate));
  const repUpfrontAccrual: number[] = [];
  const repResidualAccrual: number[] = [];
  for (let month = 1; month <= monthsCount; month++) {
    let upfront = 0;
    let residual = 0;
    for (let i = 0; i < tiers.length; i++) {
      const tc = tierCommissions[i];
      const tierShare = tiers[i].subscriberPercent / 100;
      const tierBlendedRev = tierDetails[i].revenuePerSub;
      const delayed = month - tc.payoutDelay;
      if (delayed >= 1) {
        const repSales = salesPerRepByMonth[delayed - 1];
        const commissionable = tc.clawbackWindow > 0 ? repSales * (1 - chargebackRate) : repSales;
        upfront += commissionable * tierShare * tc.effectiveFlatBonus;
      }
      let eligible = 0;
      for (let m = 0; m < month; m++) {
        const monthsSince = month - (m + 1);
        if (monthsSince >= tc.residualDelay) {
          const churnPeriods = Math.max(0, monthsSince - commitMonths + 1);
          eligible += repNetNewByMonth[m] * tierShare * Math.pow(1 - avgChurn, churnPeriods);
        }
      }
      residual += eligible * tierBlendedRev * (tc.residualPercent / 100);
    }
    repUpfrontAccrual.push(upfront);
    repResidualAccrual.push(residual);
  }

  // Cash residual: same upfront (paid at the sale, basis-independent), but the
  // residual rides the rep's book CASH revenue — lumpy for biannual/annual. Uses
  // the blended per-sub cash curve from the first cohort's lifecycle (churn +
  // billing lumps already baked in) with the mix-blended residual rate/delay.
  const firstCohort = cohortLifecycles[0];
  const firstCohortSize = firstCohort ? firstCohort.grossNewSubs : 0;
  const perSubCashByTenure: number[] =
    firstCohort && firstCohortSize > 0
      ? firstCohort.months.map((mo) => mo.revenue / firstCohortSize)
      : [];
  const blendedResidualPct = tiers.reduce(
    (s, t, i) => s + (t.subscriberPercent / 100) * (tierCommissions[i].residualPercent / 100),
    0,
  );
  const blendedResidualDelay = Math.round(
    tiers.reduce((s, t, i) => s + (t.subscriberPercent / 100) * tierCommissions[i].residualDelay, 0),
  );
  const repResidualCash: number[] = [];
  for (let month = 1; month <= monthsCount; month++) {
    let rev = 0;
    for (let m = 0; m < month; m++) {
      const tenure = month - (m + 1);
      if (tenure >= blendedResidualDelay) rev += repNetNewByMonth[m] * (perSubCashByTenure[tenure] ?? 0);
    }
    repResidualCash.push(blendedResidualPct * rev);
  }

  // One rep's own production — active book (churn-adjusted), and its revenue
  // (accrual = book × blendedRevenuePerSub; cash = per-sub cash curve convolved
  // with the rep's net-new stream). Scaled by a manager's downline in the role
  // view to show one member's unit of production.
  const repActiveSubs: number[] = [];
  const repRevenueAccrual: number[] = [];
  const repRevenueCash: number[] = [];
  for (let month = 1; month <= monthsCount; month++) {
    let subs = 0;
    let cashRev = 0;
    for (let m = 0; m < month; m++) {
      const monthsActive = month - (m + 1);
      const churnPeriods = Math.max(0, monthsActive - commitMonths + 1);
      subs += repNetNewByMonth[m] * Math.pow(1 - avgChurn, churnPeriods);
      cashRev += repNetNewByMonth[m] * (perSubCashByTenure[monthsActive] ?? 0);
    }
    repActiveSubs.push(subs);
    repRevenueAccrual.push(subs * blendedRevenuePerSub);
    repRevenueCash.push(cashRev);
  }

  const addSeries = (a: number[], b: number[]) => a.map((x, i) => x + (b[i] ?? 0));
  // One representative manager's override on a single span = level override ×
  // threshold / activeReps (smooth; zero before the level activates).
  const perManagerSeries = (
    byLevel: { id: string; name: string; amount: number }[][],
    lvl: { id: string; threshold: number },
  ) =>
    cohortProjection.map((m, i) => {
      if (m.activeReps <= 0) return 0;
      const levelTotal = byLevel[i]?.find((e) => e.id === lvl.id)?.amount ?? 0;
      return (levelTotal * lvl.threshold) / m.activeReps;
    });
  const memberEarnings: ScenarioResults["memberEarnings"] = {
    reps: {
      accrual: {
        upfront: repUpfrontAccrual,
        residual: repResidualAccrual,
        total: addSeries(repUpfrontAccrual, repResidualAccrual),
      },
      cash: {
        upfront: repUpfrontAccrual,
        residual: repResidualCash,
        total: addSeries(repUpfrontAccrual, repResidualCash),
      },
      grossNewSubs: salesPerRepByMonth.slice(),
      chargebacks: salesPerRepByMonth.map((s) => s * chargebackRate),
      newSubscribers: repNetNewByMonth,
      subscribers: repActiveSubs,
      revenue: { accrual: repRevenueAccrual, cash: repRevenueCash },
    },
    levels: [...leadershipLevels].reverse().map((lvl) => {
      const accrual = perManagerSeries(accrualLeadershipByLevel, lvl);
      const cash = perManagerSeries(cashLeadershipByLevel, lvl);
      // Attribute the override by the unit's new-vs-recurring mix: the share
      // of the standing book that is brand new this month reads as upfront,
      // the rest as residual (scale-invariant, so the single-rep ratio == the
      // channel ratio). Month 1 is ~all-new ⇒ upfront-heavy, decaying as the
      // book matures — same shape as the rep's upfront→residual ramp.
      const upfrontFrac = repActiveSubs.map((active, i) =>
        active > 0 ? Math.min(1, Math.max(0, repNetNewByMonth[i] / active)) : 0,
      );
      return {
        id: lvl.id,
        name: lvl.name,
        accrual,
        cash,
        accrualUpfront: accrual.map((v, i) => v * upfrontFrac[i]),
        accrualResidual: accrual.map((v, i) => v * (1 - upfrontFrac[i])),
        cashUpfront: cash.map((v, i) => v * upfrontFrac[i]),
        cashResidual: cash.map((v, i) => v * (1 - upfrontFrac[i])),
      };
    }),
  };

  return {
    // Thread D.2 — these scalars are remapped to their AVERAGE-OF-PERIOD
    // versions, replacing the legacy Mo-1-frozen exports. Per-sub values
    // (`costPerSubscriber`, `commissionPerSubscriber`) and counts that
    // are explicitly Mo-1-themed (`month1Reps`, `newSubsFromReps`,
    // `newSubscribersPerMonth`) keep their semantics. See doc block
    // attached to the avg declarations above for the full rationale.
    mrr: mrrAvg,
    mrrExit,
    // `arr` is intentionally aliased to `arrExit` (Thread D.3.3) so
    // existing UI consumers display the SaaS-convention number by
    // default. `arrAvg` remains available for internal modeling.
    arr: arrExit,
    arrAvg,
    arrExit,
    revenueY1,
    revenueByTier: revenueByTierAvg,
    totalProductCost: totalProductCostAvg,
    totalFulfillmentCost: totalFulfillmentCostAvg,
    costPerSubscriber,
    totalCommissionExpense: totalCommissionExpenseAvg,
    commissionPerSubscriber,
    commissionPercentOfRevenue: commissionPercentOfRevenueAvg,
    totalKickbackRevenue,
    totalBreakageProfit,
    grossMarginDollars: grossMarginDollarsAvg,
    grossMarginPercent: grossMarginPercentAvg,
    netMarginDollars,
    netMarginPercent,
    chargebacksPerMonth: chargebacksPerMonthAvg,
    chargebackCostPerMonth: chargebackCostPerMonthAvg,
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
    tierDetails: tierDetailsWithAvgSubs,
    cohortProjection,
    cohortLifecycles,
    profitDistribution,
    salesTeam,
    memberEarnings,
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
