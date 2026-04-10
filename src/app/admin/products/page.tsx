import { prisma } from "@/lib/prisma";
import { ProductTable } from "@/components/products/product-table";
import {
  formatPercent,
  formatNumber,
  toNumber,
  calculateMargin,
} from "@/lib/utils";

export default async function ProductsPage() {
  const [products, tiers, redemptionRules] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
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
    <ProductTable
      initialProducts={serializedProducts as never}
      tiers={serializedTiers}
      stats={stats}
      redemptionRules={redemptionRuleData}
    />
  );
}
