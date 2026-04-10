import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type {
  TierFinancialInput,
  CommissionCalcInput,
  SalesRepChannel,
  SamplerChannel,
  PartnerKickbackInput,
  OperationalOverhead,
} from "@/lib/financial-engine";
import type { OpexCategoryData } from "@/lib/opex-resolver";

export async function getFinancialDefaults() {
  const [tiers, commissionStructure, partners, opexCategories] = await Promise.all([
    prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } }),
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
  ]);

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
  }));

  const tierBonuses = commissionStructure
    ? commissionStructure.tierRates.map((r) => ({
        tierId: r.subscriptionTierId,
        flatBonus: toNumber(r.flatBonusAmount),
      }))
    : [];
  const avgFlatBonus =
    tierBonuses.length > 0
      ? tierBonuses.reduce((s, b) => s + b.flatBonus, 0) / tierBonuses.length
      : 50;

  const commissionData: CommissionCalcInput = commissionStructure
    ? {
        flatBonusPerSale: avgFlatBonus,
        residualPercent: toNumber(commissionStructure.residualPercent),
        tierBonuses,
        percentHittingAccelerator: 20,
        acceleratorMultiplier: 1.5,
      }
    : {
        flatBonusPerSale: 50,
        residualPercent: 5,
        tierBonuses: [],
        percentHittingAccelerator: 20,
        acceleratorMultiplier: 1.5,
      };

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

  const partnerData: PartnerKickbackInput[] = partners.map((p) => ({
    partnerId: p.id,
    estimatedMonthlyReferrals: 10,
    kickbackType: p.kickbackType,
    kickbackValue: p.kickbackValue ? toNumber(p.kickbackValue) : 0,
  }));

  // Transform OPEX categories into the engine-compatible format
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

  // Determine overhead mode based on whether OPEX data exists
  const hasOpexData = opexData.some((cat) => cat.items.some((item) => item.milestones.length > 0));
  const overheadData: OperationalOverhead = hasOpexData
    ? { mode: "milestone-scaled", fixedMonthly: 25000, opexData }
    : { mode: "fixed", fixedMonthly: 25000 };

  return { tierData, commissionData, salesRepData, samplerData, partnerData, overheadData, opexData };
}
