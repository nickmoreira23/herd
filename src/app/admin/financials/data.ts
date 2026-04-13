import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type {
  TierFinancialInput,
  CommissionCalcInput,
  SalesRepChannel,
  SamplerChannel,
  PartnerKickbackInput,
  OperationalOverhead,
  FullyLoadedCommissionInput,
} from "@/lib/financial-engine";
import type { OpexCategoryData } from "@/lib/opex-resolver";

// ─── Types for data sources metadata ────────────────────────────────

export interface DataSourceMeta {
  /** Which fields are derived from real structured data vs manual input */
  linked: {
    tierPricing: boolean;
    tierCredits: boolean;
    tierApparel: boolean;
    commissionPlan: boolean;
    commissionPerTierRates: boolean;
    commissionOverrides: boolean;
    commissionPerformanceTiers: boolean;
    partnerKickbacks: boolean;
    opexMilestones: boolean;
    productCOGS: boolean;
    productFulfillment: boolean;
  };
  /** Human-readable source labels */
  sources: {
    commissionPlanName?: string;
    productCount?: number;
    partnerCount?: number;
    tierCount?: number;
    opexCategoryCount?: number;
  };
}

// ─── Tier display metadata (for read-only plan structure display) ───

export interface TierDisplayMeta {
  tierId: string; // matches TierFinancialInput.tierId (tier.name)
  colorAccent: string;
  setupFee: number;
  trialDays: number;
  apparelCadence: string; // "NONE" | "QUARTERLY" | "MONTHLY"
  quarterlyPriceTotal: number; // raw quarterly price (not per-month)
  annualPriceTotal: number; // raw annual price (not per-month)
}

// ─── Main data fetcher ──────────────────────────────────────────────

export async function getFinancialDefaults() {
  const [
    tiers,
    // New commission plan system (preferred)
    commissionPlan,
    // Legacy commission structure (fallback)
    legacyCommissionStructure,
    partners,
    opexCategories,
    products,
  ] = await Promise.all([
    prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.commissionPlan.findFirst({
      where: { isActive: true },
      include: {
        planRates: { include: { subscriptionTier: true } },
        overrideRules: true,
        performanceTiers: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.commissionStructure.findFirst({
      where: { isActive: true },
      include: { tierRates: true },
    }),
    prisma.partnerBrand.findMany({
      where: { isActive: true, kickbackType: { not: "NONE" } },
    }),
    prisma.opexCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            milestones: { orderBy: { memberCount: "asc" } },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
    }),
  ]);

  // ─── Product-derived COGS metrics ──────────────────────────────

  let productCOGSRatio = 0.2; // fallback
  let productFulfillmentCost = 3.5; // fallback
  let productShippingCost = 5.0; // fallback
  let hasProductData = false;

  if (products.length > 0) {
    hasProductData = true;

    // Weighted average COGS-to-member-price ratio
    const productsWithPricing = products.filter(
      (p) => toNumber(p.memberPrice) > 0 && toNumber(p.costOfGoods) > 0
    );
    if (productsWithPricing.length > 0) {
      const totalMemberPrice = productsWithPricing.reduce(
        (s, p) => s + toNumber(p.memberPrice),
        0
      );
      const totalCOGS = productsWithPricing.reduce(
        (s, p) => s + toNumber(p.costOfGoods),
        0
      );
      productCOGSRatio =
        totalMemberPrice > 0
          ? Math.round((totalCOGS / totalMemberPrice) * 100) / 100
          : 0.2;
    }

    // Average fulfillment (handling) cost
    const productsWithHandling = products.filter(
      (p) => toNumber(p.handlingCost) > 0
    );
    if (productsWithHandling.length > 0) {
      productFulfillmentCost =
        Math.round(
          (productsWithHandling.reduce((s, p) => s + toNumber(p.handlingCost), 0) /
            productsWithHandling.length) *
            100
        ) / 100;
    }

    // Average shipping cost
    const productsWithShipping = products.filter(
      (p) => toNumber(p.shippingCost) > 0
    );
    if (productsWithShipping.length > 0) {
      productShippingCost =
        Math.round(
          (productsWithShipping.reduce((s, p) => s + toNumber(p.shippingCost), 0) /
            productsWithShipping.length) *
            100
        ) / 100;
    }
  }

  // ─── Tier data ─────────────────────────────────────────────────

  const tierData: TierFinancialInput[] = tiers.map((t) => ({
    tierId: t.name,
    monthlyPrice: toNumber(t.monthlyPrice),
    quarterlyPricePerMonth:
      Math.round((toNumber(t.quarterlyPrice) / 3) * 100) / 100,
    annualPricePerMonth:
      Math.round((toNumber(t.annualPrice) / 12) * 100) / 100,
    monthlyCredits: toNumber(t.monthlyCredits),
    apparelCOGSPerMonth: t.apparelBudget
      ? Math.round(toNumber(t.apparelBudget) * 0.4 * 100) / 100
      : 0,
    subscriberPercent:
      tiers.length > 0 ? Math.round(100 / tiers.length) : 25,
    churnRateMonthly: 6,
    minimumCommitMonths: t.minimumCommitMonths ?? 1,
  }));

  // ─── Tier display metadata (read-only plan structure context) ──

  const tierDisplayMeta: TierDisplayMeta[] = tiers.map((t) => ({
    tierId: t.name,
    colorAccent: t.colorAccent,
    setupFee: toNumber(t.setupFee),
    trialDays: t.trialDays,
    apparelCadence: t.apparelCadence,
    quarterlyPriceTotal: toNumber(t.quarterlyPrice),
    annualPriceTotal: toNumber(t.annualPrice),
  }));

  // ─── Commission data ───────────────────────────────────────────
  // TEMPORARILY UNLINKED from CommissionPlan — will re-link once
  // the commission feature is properly structured. Using manual defaults.

  const commissionData: CommissionCalcInput = {
    upfrontType: "flat",
    flatBonusPerSale: 50,
    upfrontPercent: 100,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
    payoutDelayMonths: 0,
  };
  const hasCommissionPlan = false; // temporarily unlinked
  const commissionPlanName: string | undefined = undefined;

  // ─── Fully-loaded commission data (for D2D plan-aware projections) ──

  let fullyLoadedCommissionData: FullyLoadedCommissionInput | undefined;

  if (commissionPlan) {
    fullyLoadedCommissionData = {
      plan: {
        residualPercent: toNumber(commissionPlan.residualPercent),
        rates: commissionPlan.planRates.map((r) => ({
          tierId: r.subscriptionTierId,
          roleType: r.roleType,
          upfrontBonus: toNumber(r.upfrontBonus),
          residualPercent: toNumber(r.residualPercent),
        })),
      },
      overrides: commissionPlan.overrideRules.map((o) => ({
        roleType: o.roleType,
        overrideType: o.overrideType,
        overrideValue: toNumber(o.overrideValue),
      })),
      performanceTiers: commissionPlan.performanceTiers.map((pt) => ({
        minSales: pt.minSales,
        maxSales: pt.maxSales,
        bonusMultiplier: toNumber(pt.bonusMultiplier),
        bonusFlat: toNumber(pt.bonusFlat),
      })),
      // Org structure — defaults, user can override in the builder
      orgStructure: {
        totalReps: 10,
        totalTeamLeads: 2,
        totalRegionalLeaders: 1,
        avgSalesPerRep: 15,
      },
      tierDistribution: tiers.map((t) => ({
        tierId: t.id,
        percent: tiers.length > 0 ? Math.round(100 / tiers.length) : 25,
      })),
      blendedRevenuePerSub: 0, // computed at runtime from tier data
    };
  }

  // ─── Sales channels (manual — no structured source yet) ────────

  const salesRepData: SalesRepChannel = {
    startingReps: 10,
    salesPerRepPerMonth: 15,
    monthlyGrowthRate: 10,
  };

  const samplerData: SamplerChannel = {
    monthlyMarketingSpend: 5000,
    costPerSampler: 25,
    conversionRate: 15,
    monthlyGrowthRate: 10,
  };

  // ─── Partner kickbacks ─────────────────────────────────────────

  const partnerData: PartnerKickbackInput[] = partners.map((p) => ({
    partnerId: p.id,
    estimatedMonthlyReferrals: 10, // manual — no referral tracking yet
    kickbackType: p.kickbackType,
    kickbackValue: p.kickbackValue ? toNumber(p.kickbackValue) : 0,
  }));

  // ─── OPEX milestones ───────────────────────────────────────────

  const opexData: OpexCategoryData[] = opexCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon ?? undefined,
    color: cat.color,
    isActive: cat.isActive,
    items: cat.items.map((item) => ({
      id: item.id,
      name: item.name,
      vendor: item.vendor ?? undefined,
      isActive: item.isActive,
      milestones: item.milestones.map((ms) => ({
        memberCount: ms.memberCount,
        monthlyCost: toNumber(ms.monthlyCost),
        notes: ms.notes ?? undefined,
      })),
    })),
  }));

  const hasOpexData = opexData.some((cat) =>
    cat.items.some((item) => item.milestones.length > 0)
  );
  const overheadData: OperationalOverhead = hasOpexData
    ? { mode: "milestone-scaled", fixedMonthly: 25000, opexData }
    : { mode: "fixed", fixedMonthly: 25000 };

  // ─── Data source metadata ──────────────────────────────────────

  const dataSourceMeta: DataSourceMeta = {
    linked: {
      tierPricing: tiers.length > 0,
      tierCredits: tiers.length > 0,
      tierApparel: tiers.some((t) => t.apparelBudget !== null),
      commissionPlan: hasCommissionPlan,
      commissionPerTierRates: hasCommissionPlan && (commissionPlan?.planRates.length ?? 0) > 0,
      commissionOverrides: hasCommissionPlan && (commissionPlan?.overrideRules.length ?? 0) > 0,
      commissionPerformanceTiers: hasCommissionPlan && (commissionPlan?.performanceTiers.length ?? 0) > 0,
      partnerKickbacks: partners.length > 0,
      opexMilestones: hasOpexData,
      productCOGS: hasProductData,
      productFulfillment: hasProductData,
    },
    sources: {
      commissionPlanName: commissionPlanName,
      productCount: products.length,
      partnerCount: partners.length,
      tierCount: tiers.length,
      opexCategoryCount: opexCategories.length,
    },
  };

  return {
    tierData,
    commissionData,
    salesRepData,
    samplerData,
    partnerData,
    overheadData,
    opexData,
    // New data
    productCOGSRatio,
    productFulfillmentCost,
    productShippingCost,
    fullyLoadedCommissionData,
    dataSourceMeta,
    tierDisplayMeta,
  };
}
