import { prisma } from "@/lib/prisma";
import { PartnersListClient } from "@/components/brands/partners-list-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function PartnersPage() {
  await connection();
  const partners = await prisma.partnerBrand.findMany({
    orderBy: { name: "asc" },
    include: {
      tierAssignments: {
        include: { tier: true },
      },
    },
  });

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

  return <PartnersListClient initialPartners={serializedPartners as never} />;
}
