import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n/locales";
// Prisma Decimal type - use number | { toNumber(): number } for flexibility
type DecimalLike = { toNumber(): number } | number;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @deprecated Since etapa 1.5.6a-bis. Use `formatMoney` from
 * `@/lib/money/format` for currency, or `formatNumber` from
 * `@/lib/i18n/format-number` for non-currency numbers. Both accept
 * `locale: Locale` as required parameter and integrate with the i18n
 * system properly.
 *
 * This function is retained for backward compatibility with features not
 * yet migrated. New code should not use it. ESLint rule
 * `no-restricted-imports` flags new usages.
 *
 * Will be deleted in Etapa 1.5.7 (Capstone) after confirming zero
 * references across the codebase.
 */
export function formatCurrency(
  amount: number | DecimalLike,
  locale: Locale = "en-US",
): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * @deprecated Since etapa 1.5.6a-bis. Use `formatNumber` from
 * `@/lib/i18n/format-number` with the `"percent"` preset (note: that
 * preset expects a 0-1 ratio, this helper takes 0-100 percent values).
 *
 * Retained for back-compat with features not yet migrated. ESLint rule
 * `no-restricted-imports` flags new usages. Deleted in 1.5.7 Capstone.
 */
export function formatPercent(
  value: number | DecimalLike,
  decimals = 1,
  locale: Locale = "en-US",
): string {
  const num = typeof value === "number" ? value : Number(value);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
  return `${formatted}%`;
}

/**
 * @deprecated Since etapa 1.5.6a-bis. Use `formatNumber` from
 * `@/lib/i18n/format-number` (different module, same name) which provides
 * presets (`integer`, `decimal`, `percent`, `compact`) and required locale
 * parameter.
 *
 * Retained for back-compat. Deleted in 1.5.7 Capstone.
 */
export function formatNumber(value: number, locale: Locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function toNumber(value: number | DecimalLike): number {
  return typeof value === "number" ? value : Number(value);
}

export function calculateMargin(
  costOfGoods: number | DecimalLike,
  memberPrice: number | DecimalLike
): number {
  const cost = toNumber(costOfGoods);
  const price = toNumber(memberPrice);
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
}

export function getMarginColor(margin: number): "green" | "yellow" | "red" {
  if (margin >= 70) return "green";
  if (margin >= 50) return "yellow";
  return "red";
}

export function getMarginColorClass(margin: number): string {
  const color = getMarginColor(margin);
  switch (color) {
    case "green":
      return "text-green-600 bg-green-50";
    case "yellow":
      return "text-yellow-600 bg-yellow-50";
    case "red":
      return "text-red-600 bg-red-50";
  }
}

// ─── Advanced Product Financial Metrics ─────────────────────────────

/** Markup = (Retail - COGS) / COGS × 100 */
export function calculateMarkup(
  costOfGoods: number | DecimalLike,
  retailPrice: number | DecimalLike
): number {
  const cost = toNumber(costOfGoods);
  const retail = toNumber(retailPrice);
  if (cost === 0) return 0;
  return ((retail - cost) / cost) * 100;
}

/** Landed Cost = COGS + Shipping + Handling */
export function calculateLandedCost(
  costOfGoods: number | DecimalLike,
  shippingCost: number | DecimalLike,
  handlingCost: number | DecimalLike
): number {
  return toNumber(costOfGoods) + toNumber(shippingCost) + toNumber(handlingCost);
}

/** True Gross Margin = (Price - Landed Cost) / Price × 100 */
export function calculateTrueGrossMargin(
  sellingPrice: number | DecimalLike,
  landedCost: number
): number {
  const price = toNumber(sellingPrice);
  if (price === 0) return 0;
  return ((price - landedCost) / price) * 100;
}

/** Contribution Margin ($) = Price - COGS - Shipping - Handling - Processing Fees */
export function calculateContributionMargin(
  sellingPrice: number | DecimalLike,
  costOfGoods: number | DecimalLike,
  shippingCost: number | DecimalLike,
  handlingCost: number | DecimalLike,
  paymentProcessingPct: number | DecimalLike,
  paymentProcessingFlat: number | DecimalLike
): number {
  const price = toNumber(sellingPrice);
  const processingFee = (price * toNumber(paymentProcessingPct) / 100) + toNumber(paymentProcessingFlat);
  return price - toNumber(costOfGoods) - toNumber(shippingCost) - toNumber(handlingCost) - processingFee;
}

export function getMarkupColorClass(markup: number): string {
  if (markup >= 100) return "text-green-600 bg-green-50";
  if (markup >= 50) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function getContributionColorClass(amount: number): string {
  if (amount > 0) return "text-green-600 bg-green-50";
  if (amount === 0) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}
