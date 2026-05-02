import type { Money, CurrencyCode } from "./types";
import { getCurrencyMeta } from "./currency";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Formats a monetary value for display in the user's preferred locale.
 *
 * The `locale` parameter controls how the number is rendered (separators,
 * decimal mark, position of the symbol). The currency itself comes from
 * the Money tuple.
 *
 * Examples:
 *   formatMoney({ amountCents: 10000n, currency: "BRL" }, "pt-BR")
 *     → "R$ 100,00"
 *   formatMoney({ amountCents: 10000n, currency: "BRL" }, "en-US")
 *     → "R$100.00"
 *   formatMoney({ amountCents: 10000n, currency: "USD" }, "pt-BR")
 *     → "US$ 100,00"
 *   formatMoney({ amountCents: 10000n, currency: "USD" }, "en-US")
 *     → "$100.00"
 */
export function formatMoney(m: Money, locale: Locale): string {
  const meta = getCurrencyMeta(m.currency);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: meta.code,
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  const asNumber = Number(m.amountCents) / Math.pow(10, meta.decimals);
  return formatter.format(asNumber);
}

/**
 * Bridge helper for legacy code that has a `number` representing a currency
 * amount (e.g. `flatBonusAmount: 250` meaning USD 250) and needs locale-aware
 * formatting. Wraps `formatMoney` by reconstructing a `Money` tuple.
 *
 * Use this where the underlying data type is `Decimal`/`number` and refactoring
 * to a proper `Money` tuple at the source is out of scope.
 *
 * Defaults to USD (most legacy callers assume USD). Pass `currency` explicitly
 * for other ISO codes.
 *
 * Example:
 *   formatNumberAsMoney(250, "pt-BR")           → "US$ 250,00"
 *   formatNumberAsMoney(250, "en-US")           → "$250.00"
 *   formatNumberAsMoney(1000, "pt-BR", "BRL")   → "R$ 1.000,00"
 */
export function formatNumberAsMoney(
  amount: number,
  locale: Locale,
  currency: CurrencyCode = "USD",
): string {
  const meta = getCurrencyMeta(currency);
  const cents = BigInt(Math.round(amount * Math.pow(10, meta.decimals)));
  return formatMoney({ amountCents: cents, currency }, locale);
}

/**
 * Formats the numeric portion only (no currency symbol). Useful for tables
 * where currency is shown in a separate column.
 */
export function formatAmount(m: Money, locale: Locale): string {
  const meta = getCurrencyMeta(m.currency);
  const asNumber = Number(m.amountCents) / Math.pow(10, meta.decimals);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(asNumber);
}
