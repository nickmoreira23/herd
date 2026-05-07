import { cache } from "react";
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
  biannualPriceTotal: number; // total prepayment for the 6-month commitment (rate × 6)
  annualPriceTotal: number;   // total prepayment for the 12-month commitment (rate × 12)
}

// ─── Main data fetcher ──────────────────────────────────────────────

// React.cache deduplicates calls within a single render tree (e.g. both the
// snapshot page AND a parallel segment calling this get one set of DB queries).
export const getFinancialDefaults = cache(async function getFinancialDefaults() {
  const [
    tiers,
    // New commission plan system (preferred)
    commissionPlan,
    partners,
    opexCategories,
    products,
    packages,
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
    // legacyCommissionStructure removed — it was fetched but never used
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
      select: {
        id: true,
        memberPrice: true,
        costOfGoods: true,
        handlingCost: true,
        shippingCost: true,
      },
    }),
    prisma.package.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        variants: {
          include: {
            products: {
              orderBy: { sortOrder: "asc" },
              include: {
                // Pull product name in addition to COGS so the
                // Reference Package UI can show a per-tier line-item
                // breakdown (qty × cost-each) and not just the lump
                // total — that breakdown is how the CFO double-checks
                // the cost figure feeding the projection.
                product: { select: { id: true, name: true, costOfGoods: true } },
              },
            },
          },
        },
      },
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

  // Per-tier commission default (each tier inherits a copy; the user can
  // edit each plan independently in the scenario builder).
  const defaultTierCommission: CommissionCalcInput = {
    upfrontType: "flat",
    flatBonusPerSale: 50,
    upfrontPercent: 15,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
    acceleratorThreshold: 1.5,
    clawbackWindowDays: 60,
    payoutDelayMonths: 0,
  };

  const tierData: TierFinancialInput[] = tiers.map((t) => ({
    tierId: t.name,
    monthlyPrice: toNumber(t.monthlyPrice),
    // CRITICAL: `biannualPrice` and `annualPrice` in the SubscriptionTier
    // table store the DISCOUNTED PER-MONTH rate the customer pays when
    // prepaying — NOT the total prepayment amount.
    //
    // Example for Starter:
    //   monthlyPrice  = $49 (no discount, billed monthly)
    //   biannualPrice = $44 → customer pays $44/mo × 6 = $264 every 6 months
    //   annualPrice    = $39 → customer pays $39/mo × 12 = $468 every 12 months
    //
    // The previous `biannualPrice / 6` collapsed $44/mo to $7.33/mo (a
    // phantom 85% discount) — the root cause of projection gross margin
    // sitting ~20pp below the per-tier package detail card. The fields
    // are already per-month, so just pass them through.
    biannualPricePerMonth: toNumber(t.biannualPrice),
    annualPricePerMonth: toNumber(t.annualPrice),
    monthlyCredits: toNumber(t.monthlyCredits),
    apparelCOGSPerMonth: t.apparelBudget
      ? Math.round(toNumber(t.apparelBudget) * 0.4 * 100) / 100
      : 0,
    subscriberPercent:
      tiers.length > 0 ? Math.round(100 / tiers.length) : 25,
    churnRateMonthly: 6,
    minimumCommitMonths: t.minimumCommitMonths ?? 1,
    // Per-tier costs — drive the package profitability card AND, with this
    // wire-through, the projection's per-tier COGS. Without these the
    // engine would fall back to a flat global shipping/fulfillment that
    // misrepresents what each tier actually costs to fulfill.
    avgShippingCost: toNumber(t.avgShippingCost),
    avgHandlingCost: toNumber(t.avgHandlingCost),
    processingFeePct: toNumber(t.processingFeePct),
    processingFeeFlat: toNumber(t.processingFeeFlat),
    commissionStructure: { ...defaultTierCommission },
  }));

  // ─── Tier display metadata (read-only plan structure context) ──

  const tierDisplayMeta: TierDisplayMeta[] = tiers.map((t) => ({
    tierId: t.name,
    colorAccent: t.colorAccent,
    setupFee: toNumber(t.setupFee),
    trialDays: t.trialDays,
    apparelCadence: t.apparelCadence,
    // True prepayment totals — the customer pays the per-month rate
    // multiplied by the number of months locked in. (`biannualPrice`
    // and `annualPrice` in the DB are per-month values, so the total is
    // rate × 6 for biannual and rate × 12 for annual.)
    biannualPriceTotal:
      Math.round(toNumber(t.biannualPrice) * 6 * 100) / 100,
    annualPriceTotal:
      Math.round(toNumber(t.annualPrice) * 12 * 100) / 100,
  }));

  // ─── Commission data ───────────────────────────────────────────
  // TEMPORARILY UNLINKED from CommissionPlan — will re-link once
  // the commission feature is properly structured. Using manual defaults.

  const commissionData: CommissionCalcInput = {
    upfrontType: "flat",
    flatBonusPerSale: 50,
    // 15% — sane default for "% of Plan" mode (was 100% which silently
    // pegged commission to full plan price on toggle).
    upfrontPercent: 15,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
    acceleratorThreshold: 1.5,
    clawbackWindowDays: 60,
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

  // ─── Reference packages catalog ────────────────────────────────
  // Build a lookup of packages → per-tier total product COGS, keyed by
  // tier NAME (matching `tierData[].tierId` which uses the tier's name).
  // The CFO can pick a reference package and the projection's COGS per
  // sub will use the REAL catalog data instead of the apparelBudget guess.
  //
  // We also surface the per-product line items (`perTierProducts`) so the
  // Reference Package UI can render a drilldown per plan — letting the
  // CFO see exactly which products and quantities make up the COGS
  // figure. The drilldown isn't used by the engine (which only needs the
  // total per tier) but it's critical for trust in the number.
  const tierIdToName = new Map(tiers.map((t) => [t.id, t.name]));
  const packagesCatalog: PackageCatalogEntry[] = packages.map((p) => {
    const perTier: Record<string, number> = {};
    const perTierProducts: Record<string, PackageProductBreakdown[]> = {};
    for (const v of p.variants) {
      const name = tierIdToName.get(v.subscriptionTierId);
      if (!name) continue;
      const items: PackageProductBreakdown[] = v.products.map((pp) => {
        const costEach = toNumber(pp.product.costOfGoods);
        const subtotal = Math.round(costEach * pp.quantity * 100) / 100;
        return {
          productId: pp.product.id,
          name: pp.product.name,
          quantity: pp.quantity,
          costEach: Math.round(costEach * 100) / 100,
          subtotal,
        };
      });
      const totalCOGS = items.reduce((sum, it) => sum + it.subtotal, 0);
      perTier[name] = Math.round(totalCOGS * 100) / 100;
      perTierProducts[name] = items;
    }
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      perTierCOGS: perTier,
      perTierProducts,
    };
  });

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
    packagesCatalog,
  };
});

export interface PackageProductBreakdown {
  productId: string;
  name: string;
  quantity: number;
  costEach: number;   // unit cost-of-goods
  subtotal: number;   // costEach × quantity (what feeds the tier total)
}

export interface PackageCatalogEntry {
  id: string;
  name: string;
  slug: string;
  /** Total product COGS per active subscriber for each tier, keyed by tier
   * NAME (matching `TierFinancialInput.tierId`). */
  perTierCOGS: Record<string, number>;
  /** Per-tier line-item breakdown (qty × cost) — feeds the drilldown UI
   * inside the Reference Package selector. Same key (tier name) as
   * `perTierCOGS`; absent tiers have no variant in the package. */
  perTierProducts: Record<string, PackageProductBreakdown[]>;
}
