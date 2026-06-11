import { prisma } from "@/lib/prisma";
import { computeCreditCost, type RedemptionRule } from "@/lib/credit-cost";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Recalculate credit costs for all package products associated with a tier.
 * Called when redemption rules change (create, update, delete).
 * Returns the number of products whose costs were updated.
 *
 * L1a.4 — Product is strictly tenant-scoped, so the catalog read requires the
 * caller's org (resolved from the host by route handlers). Without it the
 * scoped read would return nothing and every cost would silently recompute
 * against a missing product — refusing loudly is the only safe behavior.
 * Products not visible under the tenant are skipped (current cost preserved).
 */
export async function recalculateTierProductCosts(
  tierId: string,
  orgId: string
): Promise<number> {
  if (!orgId) {
    throw new Error(
      "recalculateTierProductCosts requires an org context — refusing to recalculate costs against an empty catalog"
    );
  }

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

  // Fetch all variants for this tier, then read the catalog directly under
  // the tenant and join in memory (nested include would bypass the GUC).
  const variants = await prisma.packageTierVariant.findMany({
    where: { subscriptionTierId: tierId },
    include: { products: true },
  });

  const productIds = variants.flatMap((v) => v.products.map((p) => p.productId));
  const catalogProducts = await withTenant(orgId, () =>
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        category: true,
        subCategory: true,
        memberPrice: true,
      },
    })
  );
  const productById = new Map(catalogProducts.map((p) => [p.id, p]));

  let updatedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const variant of variants) {
      let variantChanged = false;

      for (const ptp of variant.products) {
        const product = productById.get(ptp.productId);
        if (!product) continue;

        const newCost = computeCreditCost(
          {
            sku: product.sku,
            category: product.category,
            subCategory: product.subCategory,
            memberPrice: Number(product.memberPrice),
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
