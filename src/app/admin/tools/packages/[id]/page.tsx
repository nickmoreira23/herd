import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackageDetailView } from "@/components/packages/package-detail-view";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
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
              avgShippingCost: true,
              avgHandlingCost: true,
              processingFeePct: true,
              processingFeeFlat: true,
            },
          },
          products: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { subscriptionTier: { sortOrder: "asc" } },
      },
    },
  });

  if (!pkg) return notFound();

  // L1a.4 — Product is strictly tenant-scoped; the nested include through the
  // unscoped Package family would run without the tenant GUC and be denied by
  // RLS. Read the catalog directly under the host org and join in memory.
  const orgId = await getOrgIdFromRequest();
  const productIds = pkg.variants.flatMap((v) => v.products.map((p) => p.productId));
  const catalogProducts = orgId
    ? await withTenant(orgId, () =>
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            subCategory: true,
            retailPrice: true,
            memberPrice: true,
            imageUrl: true,
            costOfGoods: true,
          },
        })
      )
    : [];
  const productById = new Map(catalogProducts.map((p) => [p.id, p]));

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
        avgShippingCost: toNumber(v.subscriptionTier.avgShippingCost),
        avgHandlingCost: toNumber(v.subscriptionTier.avgHandlingCost),
        processingFeePct: toNumber(v.subscriptionTier.processingFeePct),
        processingFeeFlat: toNumber(v.subscriptionTier.processingFeeFlat),
      },
      products: v.products.flatMap((p) => {
        const product = productById.get(p.productId);
        if (!product) return [];
        return [
          {
            ...p,
            creditCost: toNumber(p.creditCost),
            product: {
              ...product,
              retailPrice: toNumber(product.retailPrice),
              memberPrice: toNumber(product.memberPrice),
              costOfGoods: toNumber(product.costOfGoods),
            },
          },
        ];
      }),
    })),
  };

  return <PackageDetailView pkg={serialized} redemptionRulesByTier={serializedRules} />;
}
