// Package-wizard profitability calculations.
// Pure functions — no server deps. Computes per-tier P&L from a local product
// selection to power the real-time financial panel in the wizard.

import type { LocalProduct, TierInfo } from "@/stores/package-wizard-store";
import { calculateGrossMargin } from "@/lib/financial-engine";

export const MARGIN_HEALTHY_PCT = 30;
export const MARGIN_TIGHT_PCT = 10;

export type HealthStatus = "healthy" | "tight" | "loss" | "empty";

export interface TierFinancials {
  revenue: number;
  productCOGS: number;
  fulfillmentCost: number;
  paymentProcessing: number;
  totalCOGS: number;
  profitPerSubscriber: number;
  grossMarginPct: number;
  healthStatus: HealthStatus;
  productCount: number;
  totalUnits: number;
}

export function computeTierFinancials(
  products: LocalProduct[],
  tier: Pick<
    TierInfo,
    | "monthlyPrice"
    | "avgShippingCost"
    | "avgHandlingCost"
    | "processingFeePct"
    | "processingFeeFlat"
  >
): TierFinancials {
  const revenue = Number(tier.monthlyPrice) || 0;

  let productCOGS = 0;
  let totalUnits = 0;

  for (const p of products) {
    const qty = Math.max(1, p.quantity);
    productCOGS += (p.costOfGoods || 0) * qty;
    totalUnits += qty;
  }

  // Fulfillment + payment processing come from plan-level averages set on the
  // SubscriptionTier — they don't depend on which products fill the package.
  const fulfillmentCost =
    (Number(tier.avgShippingCost) || 0) + (Number(tier.avgHandlingCost) || 0);
  const paymentProcessing =
    revenue * ((Number(tier.processingFeePct) || 0) / 100) +
    (Number(tier.processingFeeFlat) || 0);

  const totalCOGS = productCOGS + fulfillmentCost + paymentProcessing;

  const margin = calculateGrossMargin(revenue, totalCOGS);
  const profitPerSubscriber = margin.dollars;
  const grossMarginPct = margin.percent;

  const healthStatus: HealthStatus =
    products.length === 0
      ? "empty"
      : profitPerSubscriber < 0
        ? "loss"
        : grossMarginPct >= MARGIN_HEALTHY_PCT
          ? "healthy"
          : grossMarginPct >= MARGIN_TIGHT_PCT
            ? "tight"
            : "loss";

  return {
    revenue,
    productCOGS,
    fulfillmentCost,
    paymentProcessing,
    totalCOGS,
    profitPerSubscriber,
    grossMarginPct,
    healthStatus,
    productCount: products.length,
    totalUnits,
  };
}

export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toFixed(2)}`;
}
