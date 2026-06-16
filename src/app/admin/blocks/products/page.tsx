import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductsListClient } from "@/components/products/products-list-client";
import {
  formatPercent,
  formatNumber,
  toNumber,
  calculateMargin,
} from "@/lib/utils";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function ProductsPage() {
  await connection();
  // L1a.2 — Product is tenant-scoped: list the host org's catalog (fetched
  // separately under withTenant). SubscriptionTier + redemption rules stay
  // global until L1b.
  const orgId = await getOrgIdFromRequest();
  const products = orgId
    ? await withTenant(orgId, () => prisma.product.findMany({ orderBy: { name: "asc" } }))
    : [];
  const [tiers, redemptionRules] = await Promise.all([
    // L1b.2a — Tier read scoped to the host org (inert until L1b.2b activation).
    orgId
      ? withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              partnerDiscountPercent: true,
              sortOrder: true,
            },
          })
        )
      : Promise.resolve([]),
    // L1b.2a — drop the subscriptionTier include (SubscriptionRedemptionRule is
    // not tenant-scoped; the join would hit the soon-RLS-strict tier without the
    // GUC). Tier names are joined in memory from a host-scoped read below.
    prisma.subscriptionRedemptionRule.findMany(),
  ]);

  // L1b.2a — Tier names for the redemption-rule pills, read under the host org.
  const ruleTierIds = [...new Set(redemptionRules.map((r) => r.subscriptionTierId))];
  const ruleTierNames = orgId
    ? await withTenant(orgId, () =>
        prisma.subscriptionTier.findMany({
          where: { id: { in: ruleTierIds } },
          select: { id: true, name: true },
        })
      )
    : [];
  const ruleTierNameById = new Map(ruleTierNames.map((t) => [t.id, t.name]));

  const activeProducts = products.filter((p) => p.isActive);

  // Calculate aggregate stats
  const categories = ["SUPPLEMENT", "APPAREL", "ACCESSORY"] as const;
  const marginByCategory = categories.map((cat) => {
    const catProducts = activeProducts.filter((p) => p.category === cat);
    if (!catProducts.length) return { category: cat, avgMargin: 0 };
    const totalMargin = catProducts.reduce(
      (sum, p) => sum + calculateMargin(p.costOfGoods, p.memberPrice),
      0
    );
    return { category: cat, avgMargin: totalMargin / catProducts.length };
  });

  const weightedAvgMargin =
    activeProducts.length > 0
      ? activeProducts.reduce(
          (sum, p) => sum + calculateMargin(p.costOfGoods, p.memberPrice),
          0
        ) / activeProducts.length
      : 0;

  const stats = [
    {
      label: "Active Products",
      value: formatNumber(activeProducts.length),
    },
    ...marginByCategory
      .filter((m) => m.avgMargin > 0)
      .map((m) => ({
        label: `Avg ${m.category.charAt(0) + m.category.slice(1).toLowerCase()} Margin`,
        value: formatPercent(m.avgMargin),
      })),
    {
      label: "Weighted Avg Margin",
      value: formatPercent(weightedAvgMargin),
    },
  ];

  // Serialize Decimal values to numbers for the client
  const serializedProducts = products.map((p) => ({
    ...p,
    retailPrice: toNumber(p.retailPrice),
    memberPrice: toNumber(p.memberPrice),
    costOfGoods: toNumber(p.costOfGoods),
    shippingCost: toNumber(p.shippingCost),
    handlingCost: toNumber(p.handlingCost),
    paymentProcessingPct: toNumber(p.paymentProcessingPct),
    paymentProcessingFlat: toNumber(p.paymentProcessingFlat),
    mapPrice: p.mapPrice ? toNumber(p.mapPrice) : null,
    weightOz: p.weightOz ? toNumber(p.weightOz) : null,
  }));

  const serializedTiers = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    discountPercent: toNumber(t.partnerDiscountPercent),
    sortOrder: t.sortOrder,
  }));

  // Build a map of SKU → tier pills from redemption rules. Drop rules whose
  // tier isn't visible under the host org (mirrors the join-drop pattern).
  const redemptionRuleData = redemptionRules.flatMap((r) => {
    const tierName = ruleTierNameById.get(r.subscriptionTierId);
    if (!tierName) return [];
    return [
      {
        id: r.id,
        tierName,
        redemptionType: r.redemptionType,
        discountPercent: r.discountPercent,
        scopeType: r.scopeType,
        scopeValue: r.scopeValue,
      },
    ];
  });

  return (
    <ProductsListClient
      initialProducts={serializedProducts as never}
      tiers={serializedTiers}
      stats={stats}
      redemptionRules={redemptionRuleData}
    />
  );
}
