import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackageDetailClient } from "@/components/packages/package-detail-client";
import { toNumber } from "@/lib/utils";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function PackageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  // L1b.2a — Tier reads run under the host org (Package family is not tenant-scoped).
  const orgId = await getOrgIdFromRequest();
  const [pkg, allTiers] = await Promise.all([
    prisma.package.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            products: { orderBy: { sortOrder: "asc" } },
          },
          // L1b.2a — relation orderBy through SubscriptionTier removed (joins
          // the soon-RLS-strict tier without the GUC); ordered in memory below.
        },
      },
    }),
    orgId
      ? withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({
            where: { status: "ACTIVE" },
            select: { id: true },
          })
        )
      : [],
  ]);

  if (!pkg) return notFound();

  // L1a.4 — Product is strictly tenant-scoped; the nested include through the
  // unscoped Package family would run without the tenant GUC and be denied by
  // RLS. Read the catalog directly under the host org and join in memory.
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
          },
        })
      )
    : [];
  const productById = new Map(catalogProducts.map((p) => [p.id, p]));

  // L1b.2a — Tier joined in memory under the host org (Package family is not tenant-scoped).
  const tierIds = [...new Set(pkg.variants.map((v) => v.subscriptionTierId))];
  const tiers = orgId
    ? await withTenant(orgId, () =>
        prisma.subscriptionTier.findMany({
          where: { id: { in: tierIds } },
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
        })
      )
    : [];
  const tierById = new Map(tiers.map((t) => [t.id, t]));

  // Fetch redemption rules for all tiers in this package
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

  // Serialize Decimals
  const serialized = {
    ...pkg,
    variants: pkg.variants
      .flatMap((v) => {
        const tier = tierById.get(v.subscriptionTierId);
        if (!tier) return [];
        return [
          {
            ...v,
            totalCreditsUsed: toNumber(v.totalCreditsUsed),
            subscriptionTier: {
              ...tier,
              monthlyCredits: toNumber(tier.monthlyCredits),
              monthlyPrice: toNumber(tier.monthlyPrice),
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
                  },
                },
              ];
            }),
          },
        ];
      })
      .sort((a, b) => a.subscriptionTier.sortOrder - b.subscriptionTier.sortOrder),
  };

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

  return (
    <PackageDetailClient
      initialPackage={serialized as never}
      redemptionRulesByTier={serializedRules}
      totalActiveTiers={allTiers.length}
    />
  );
}
