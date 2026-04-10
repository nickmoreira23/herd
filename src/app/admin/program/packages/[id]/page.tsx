import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackageDetailView } from "@/components/packages/package-detail-view";
import { toNumber } from "@/lib/utils";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          subscriptionTier: {
            select: {
              id: true,
              name: true,
              slug: true,
              monthlyCredits: true,
              monthlyPrice: true,
              colorAccent: true,
              sortOrder: true,
              iconUrl: true,
            },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: true,
                  subCategory: true,
                  retailPrice: true,
                  memberPrice: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { subscriptionTier: { sortOrder: "asc" } },
      },
    },
  });

  if (!pkg) return notFound();

  // Fetch redemption rules for all tiers in this package
  const tierIds = pkg.variants.map((v) => v.subscriptionTierId);
  const redemptionRules = await prisma.subscriptionRedemptionRule.findMany({
    where: { subscriptionTierId: { in: tierIds } },
  });

  // Group rules by tier
  const rulesByTier: Record<string, typeof redemptionRules> = {};
  for (const rule of redemptionRules) {
    if (!rulesByTier[rule.subscriptionTierId]) {
      rulesByTier[rule.subscriptionTierId] = [];
    }
    rulesByTier[rule.subscriptionTierId].push(rule);
  }

  const serializedRules: Record<
    string,
    { redemptionType: string; scopeType: string; scopeValue: string; discountPercent: number }[]
  > = {};
  for (const [tierId, rules] of Object.entries(rulesByTier)) {
    serializedRules[tierId] = rules.map((r) => ({
      redemptionType: r.redemptionType,
      scopeType: r.scopeType,
      scopeValue: r.scopeValue,
      discountPercent: r.discountPercent,
    }));
  }

  // Serialize Decimals
  const serialized = {
    ...pkg,
    createdAt: pkg.createdAt.toISOString(),
    variants: pkg.variants.map((v) => ({
      ...v,
      totalCreditsUsed: toNumber(v.totalCreditsUsed),
      subscriptionTier: {
        ...v.subscriptionTier,
        monthlyCredits: toNumber(v.subscriptionTier.monthlyCredits),
        monthlyPrice: toNumber(v.subscriptionTier.monthlyPrice),
      },
      products: v.products.map((p) => ({
        ...p,
        creditCost: toNumber(p.creditCost),
        product: {
          ...p.product,
          retailPrice: toNumber(p.product.retailPrice),
          memberPrice: toNumber(p.product.memberPrice),
        },
      })),
    })),
  };

  return <PackageDetailView pkg={serialized} redemptionRulesByTier={serializedRules} />;
}
