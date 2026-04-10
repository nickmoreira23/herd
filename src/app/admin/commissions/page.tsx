import { prisma } from "@/lib/prisma";
import { CommissionPageClient } from "@/components/commissions/commission-page-client";
import { toNumber } from "@/lib/utils";

export default async function CommissionsPage() {
  const [structures, tiers] = await Promise.all([
    prisma.commissionStructure.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tierRates: {
          include: { subscriptionTier: true },
        },
      },
    }),
    prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Serialize Decimals
  const serializedStructures = structures.map((s) => ({
    ...s,
    residualPercent: toNumber(s.residualPercent),
    tierRates: s.tierRates.map((r) => ({
      ...r,
      flatBonusAmount: toNumber(r.flatBonusAmount),
      acceleratorThreshold: r.acceleratorThreshold ? toNumber(r.acceleratorThreshold) : null,
      acceleratorMultiplier: r.acceleratorMultiplier ? toNumber(r.acceleratorMultiplier) : null,
      subscriptionTier: {
        ...r.subscriptionTier,
        monthlyPrice: toNumber(r.subscriptionTier.monthlyPrice),
        quarterlyPrice: toNumber(r.subscriptionTier.quarterlyPrice),
        annualPrice: toNumber(r.subscriptionTier.annualPrice),
        monthlyCredits: toNumber(r.subscriptionTier.monthlyCredits),
        partnerDiscountPercent: toNumber(r.subscriptionTier.partnerDiscountPercent),
        apparelBudget: r.subscriptionTier.apparelBudget ? toNumber(r.subscriptionTier.apparelBudget) : null,
      },
    })),
  }));

  const serializedTiers = tiers.map((t) => ({
    ...t,
    monthlyPrice: toNumber(t.monthlyPrice),
    quarterlyPrice: toNumber(t.quarterlyPrice),
    annualPrice: toNumber(t.annualPrice),
    monthlyCredits: toNumber(t.monthlyCredits),
    partnerDiscountPercent: toNumber(t.partnerDiscountPercent),
    apparelBudget: t.apparelBudget ? toNumber(t.apparelBudget) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commission Structures</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define how the D2D sales team gets paid and see the margin impact.
        </p>
      </div>
      <CommissionPageClient
        initialStructures={serializedStructures as never}
        tiers={serializedTiers as never}
      />
    </div>
  );
}
