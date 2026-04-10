import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TierDetailClient } from "@/components/tiers/tier-detail-client";
import { toNumber } from "@/lib/utils";

export default async function EditTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // "new" is handled by the /new route, skip it here
  if (id === "new") return notFound();

  const [tier, allTiersRaw] = await Promise.all([
    prisma.subscriptionTier.findUnique({
      where: { id },
      include: {
        pricingSnapshots: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    }),
    prisma.subscriptionTier.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!tier) return notFound();

  const serialized = {
    ...tier,
    monthlyPrice: toNumber(tier.monthlyPrice),
    quarterlyPrice: toNumber(tier.quarterlyPrice),
    annualPrice: toNumber(tier.annualPrice),
    quarterlyDisplay: tier.quarterlyDisplay ? toNumber(tier.quarterlyDisplay) : null,
    annualDisplay: tier.annualDisplay ? toNumber(tier.annualDisplay) : null,
    setupFee: toNumber(tier.setupFee),
    monthlyCredits: toNumber(tier.monthlyCredits),
    rolloverCap: tier.rolloverCap ? toNumber(tier.rolloverCap) : null,
    annualBonusCredits: toNumber(tier.annualBonusCredits),
    referralCreditAmt: toNumber(tier.referralCreditAmt),
    winbackBonusCredits: toNumber(tier.winbackBonusCredits),
    partnerDiscountPercent: toNumber(tier.partnerDiscountPercent),
    apparelBudget: tier.apparelBudget ? toNumber(tier.apparelBudget) : null,
    pricingSnapshots: tier.pricingSnapshots.map((s) => ({
      ...s,
      monthlyPrice: toNumber(s.monthlyPrice),
      quarterlyPrice: s.quarterlyPrice ? toNumber(s.quarterlyPrice) : null,
      annualPrice: s.annualPrice ? toNumber(s.annualPrice) : null,
    })),
  };

  return (
    <TierDetailClient
      tierId={tier.id}
      initialTier={serialized as never}
      allTiers={allTiersRaw}
    />
  );
}
