import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TierDetailClient } from "@/components/tiers/tier-detail-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";
import { BENEFIT_BLOCKS_SETTING_KEY, DEFAULT_BENEFIT_BLOCKS } from "@/lib/blocks/block-meta";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function EditTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const orgId = await getOrgIdFromRequest();
  const { id } = await params;

  // "new" is handled by the /new route, skip it here
  if (id === "new") return notFound();

  const [tier, allTiersRaw, benefitBlocksSetting] = await Promise.all([
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    orgId
      ? withTenant(orgId, () =>
          prisma.subscriptionTier.findUnique({
            where: { id },
            include: {
              pricingSnapshots: { orderBy: { createdAt: "desc" }, take: 50 },
            },
          })
        )
      : Promise.resolve(null),
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    orgId
      ? withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({
            select: { id: true, name: true },
            orderBy: { sortOrder: "asc" },
          })
        )
      : Promise.resolve([]),
    prisma.setting.findUnique({ where: { key: BENEFIT_BLOCKS_SETTING_KEY } }),
  ]);

  const enabledBenefitBlocks = benefitBlocksSetting
    ? String(benefitBlocksSetting.value)
    : DEFAULT_BENEFIT_BLOCKS;

  if (!tier) return notFound();

  const serialized = {
    ...tier,
    monthlyPrice: toNumber(tier.monthlyPrice),
    biannualPrice: toNumber(tier.biannualPrice),
    annualPrice: toNumber(tier.annualPrice),
    biannualDisplay: tier.biannualDisplay ? toNumber(tier.biannualDisplay) : null,
    annualDisplay: tier.annualDisplay ? toNumber(tier.annualDisplay) : null,
    setupFee: toNumber(tier.setupFee),
    avgShippingCost: toNumber(tier.avgShippingCost),
    avgHandlingCost: toNumber(tier.avgHandlingCost),
    processingFeePct: toNumber(tier.processingFeePct),
    processingFeeFlat: toNumber(tier.processingFeeFlat),
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
      biannualPrice: s.biannualPrice ? toNumber(s.biannualPrice) : null,
      annualPrice: s.annualPrice ? toNumber(s.annualPrice) : null,
    })),
  };

  return (
    <TierDetailClient
      tierId={tier.id}
      initialTier={serialized as never}
      allTiers={allTiersRaw}
      enabledBenefitBlocks={enabledBenefitBlocks}
    />
  );
}
