import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PartnerDetailClient } from "@/components/brands/partner-detail-client";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [partner, tiers] = await Promise.all([
    prisma.partnerBrand.findUnique({
      where: { id },
      include: {
        tierAssignments: {
          include: { tier: true },
        },
      },
    }),
    prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!partner) notFound();

  const serializedPartner = {
    ...partner,
    kickbackValue: partner.kickbackValue ? toNumber(partner.kickbackValue) : null,
    tierAssignments: partner.tierAssignments.map((a) => ({
      ...a,
      discountPercent: toNumber(a.discountPercent),
      tier: {
        ...a.tier,
        monthlyPrice: toNumber(a.tier.monthlyPrice),
        quarterlyPrice: toNumber(a.tier.quarterlyPrice),
        annualPrice: toNumber(a.tier.annualPrice),
        monthlyCredits: toNumber(a.tier.monthlyCredits),
        partnerDiscountPercent: toNumber(a.tier.partnerDiscountPercent),
        apparelBudget: a.tier.apparelBudget ? toNumber(a.tier.apparelBudget) : null,
      },
    })),
  };

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
    <PartnerDetailClient
      partner={serializedPartner as never}
      allTiers={serializedTiers as never}
    />
  );
}
