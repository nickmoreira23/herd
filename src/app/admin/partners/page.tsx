import { prisma } from "@/lib/prisma";
import { PartnerPageClient } from "@/components/partners/partner-page-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function PartnersPage() {
  await connection();
  const [partners, tiers] = await Promise.all([
    prisma.partnerBrand.findMany({
      orderBy: { name: "asc" },
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

  // Serialize Decimals
  const serializedPartners = partners.map((p) => ({
    ...p,
    kickbackValue: p.kickbackValue ? toNumber(p.kickbackValue) : null,
    tierAssignments: p.tierAssignments.map((a) => ({
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
        <h1 className="text-2xl font-bold">Partner Network</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage partner brands and their tier-specific discount/kickback configurations.
        </p>
      </div>
      <PartnerPageClient
        initialPartners={serializedPartners as never}
        tiers={serializedTiers as never}
      />
    </div>
  );
}
