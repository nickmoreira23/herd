import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { PackageWizardShell } from "@/components/packages/wizard/package-wizard-shell";
import { connection } from "next/server";

export default async function NewPackagePage() {
  await connection();
  // Fetch active tiers with redemption rules for credit cost computation
  const tiers = await prisma.subscriptionTier.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      monthlyCredits: true,
      monthlyPrice: true,
      colorAccent: true,
      sortOrder: true,
      redemptionRules: {
        select: {
          redemptionType: true,
          scopeType: true,
          scopeValue: true,
          discountPercent: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const serializedTiers = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    monthlyCredits: toNumber(t.monthlyCredits),
    monthlyPrice: toNumber(t.monthlyPrice),
    colorAccent: t.colorAccent,
    sortOrder: t.sortOrder,
  }));

  const redemptionRulesByTier: Record<
    string,
    { redemptionType: string; scopeType: string; scopeValue: string; discountPercent: number }[]
  > = {};
  for (const t of tiers) {
    redemptionRulesByTier[t.id] = t.redemptionRules.map((r) => ({
      redemptionType: r.redemptionType,
      scopeType: r.scopeType,
      scopeValue: r.scopeValue,
      discountPercent: r.discountPercent,
    }));
  }

  return (
    <PackageWizardShell
      tiers={serializedTiers}
      redemptionRulesByTier={redemptionRulesByTier}
    />
  );
}
