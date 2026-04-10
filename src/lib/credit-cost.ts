/**
 * Resolves the effective credit cost of a product for a given tier's redemption rules.
 *
 * Priority: SKU-level rule > Sub-Category rule > Category rule > no discount.
 * Only considers MEMBERS_STORE rules (credit-based purchases).
 */

export interface RedemptionRule {
  redemptionType: string;
  scopeType: string;
  scopeValue: string;
  discountPercent: number;
}

export interface ProductForPricing {
  sku: string;
  category: string;
  subCategory?: string | null;
  memberPrice: number;
}

export function resolveDiscount(
  product: ProductForPricing,
  rules: RedemptionRule[]
): number {
  const storeRules = rules.filter((r) => r.redemptionType === "MEMBERS_STORE");

  // SKU-level first
  const skuRule = storeRules.find(
    (r) => r.scopeType === "SKU" && r.scopeValue === product.sku
  );
  if (skuRule) return skuRule.discountPercent;

  // Sub-category level
  if (product.subCategory) {
    const subCatRule = storeRules.find(
      (r) =>
        r.scopeType === "SUB_CATEGORY" && r.scopeValue === product.subCategory
    );
    if (subCatRule) return subCatRule.discountPercent;
  }

  // Category level
  const catRule = storeRules.find(
    (r) => r.scopeType === "CATEGORY" && r.scopeValue === product.category
  );
  if (catRule) return catRule.discountPercent;

  return 0;
}

export function computeCreditCost(
  product: ProductForPricing,
  rules: RedemptionRule[]
): number {
  const discount = resolveDiscount(product, rules);
  return Number((product.memberPrice * (1 - discount / 100)).toFixed(2));
}
