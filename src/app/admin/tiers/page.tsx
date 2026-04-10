import { prisma } from "@/lib/prisma";
import { TierPageClient } from "@/components/tiers/tier-page-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";

export default async function TiersPage() {
  await connection();
  const tiers = await prisma.subscriptionTier.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      redemptionRules: true,
      agentAccess: {
        where: { isEnabled: true },
        include: { agent: { select: { id: true, name: true, category: true, icon: true } } },
      },
      partnerAssignments: {
        where: { isActive: true },
        include: { partner: { select: { id: true, name: true, logoUrl: true } } },
      },
    },
  });

  // Serialize Decimal values for client
  const serialized = tiers.map((t) => ({
    ...t,
    monthlyPrice: toNumber(t.monthlyPrice),
    quarterlyPrice: toNumber(t.quarterlyPrice),
    annualPrice: toNumber(t.annualPrice),
    quarterlyDisplay: t.quarterlyDisplay ? toNumber(t.quarterlyDisplay) : null,
    annualDisplay: t.annualDisplay ? toNumber(t.annualDisplay) : null,
    setupFee: toNumber(t.setupFee),
    monthlyCredits: toNumber(t.monthlyCredits),
    rolloverCap: t.rolloverCap ? toNumber(t.rolloverCap) : null,
    annualBonusCredits: toNumber(t.annualBonusCredits),
    referralCreditAmt: toNumber(t.referralCreditAmt),
    winbackBonusCredits: toNumber(t.winbackBonusCredits),
    partnerDiscountPercent: toNumber(t.partnerDiscountPercent),
    apparelBudget: t.apparelBudget ? toNumber(t.apparelBudget) : null,
    redemptionRules: t.redemptionRules.map((r) => ({
      ...r,
      discountPercent: toNumber(r.discountPercent),
    })),
    partnerAssignments: t.partnerAssignments.map((a) => ({
      ...a,
      discountPercent: toNumber(a.discountPercent),
    })),
  }));

  return <TierPageClient initialTiers={serialized as never} />;
}
