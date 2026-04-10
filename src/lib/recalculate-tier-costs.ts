import { prisma } from "@/lib/prisma";
import { computeCreditCost, type RedemptionRule } from "@/lib/credit-cost";

/**
 * Recalculate credit costs for all package products associated with a tier.
 * Called when redemption rules change (create, update, delete).
 * Returns the number of products whose costs were updated.
 */
export async function recalculateTierProductCosts(tierId: string): Promise<number> {
  // Fetch the tier's current redemption rules
  const rawRules = await prisma.subscriptionRedemptionRule.findMany({
    where: { subscriptionTierId: tierId },
  });

  const rules: RedemptionRule[] = rawRules.map((r) => ({
    redemptionType: r.redemptionType,
    scopeType: r.scopeType,
    scopeValue: r.scopeValue,
    discountPercent: r.discountPercent,
  }));

  // Fetch all variants for this tier with their products
  const variants = await prisma.packageTierVariant.findMany({
    where: { subscriptionTierId: tierId },
    include: {
      products: {
        include: {
          product: {
            select: {
              sku: true,
              category: true,
              subCategory: true,
              memberPrice: true,
            },
          },
        },
      },
    },
  });

  let updatedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const variant of variants) {
      let variantChanged = false;

      for (const ptp of variant.products) {
        const newCost = computeCreditCost(
          {
            sku: ptp.product.sku,
            category: ptp.product.category,
            subCategory: ptp.product.subCategory,
            memberPrice: Number(ptp.product.memberPrice),
          },
          rules
        );

        const currentCost = Number(ptp.creditCost);
        if (Math.abs(newCost - currentCost) > 0.001) {
          await tx.packageTierProduct.update({
            where: { id: ptp.id },
            data: { creditCost: newCost },
          });
          updatedCount++;
          variantChanged = true;
        }
      }

      // Recalculate variant total if any products changed
      if (variantChanged) {
        const allProducts = await tx.packageTierProduct.findMany({
          where: { variantId: variant.id },
        });
        const total = allProducts.reduce(
          (sum, p) => sum + Number(p.creditCost) * p.quantity,
          0
        );
        await tx.packageTierVariant.update({
          where: { id: variant.id },
          data: { totalCreditsUsed: total },
        });
      }
    }
  });

  return updatedCount;
}
