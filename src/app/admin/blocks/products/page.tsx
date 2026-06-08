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
    prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        partnerDiscountPercent: true,
        sortOrder: true,
      },
    }),
    prisma.subscriptionRedemptionRule.findMany({
      include: { subscriptionTier: { select: { name: true } } },
    }),
  ]);

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

  // Build a map of SKU → tier pills from redemption rules
  const redemptionRuleData = redemptionRules.map((r) => ({
    id: r.id,
    tierName: r.subscriptionTier.name,
    redemptionType: r.redemptionType,
    discountPercent: r.discountPercent,
    scopeType: r.scopeType,
    scopeValue: r.scopeValue,
  }));

  return (
    <ProductsListClient
      initialProducts={serializedProducts as never}
      tiers={serializedTiers}
      stats={stats}
      redemptionRules={redemptionRuleData}
    />
  );
}
