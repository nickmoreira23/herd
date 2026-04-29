import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/money";
import { InvalidCurrencyError, UnsupportedCurrencyError } from "./errors";

/**
 * Normalizes a raw currency string to a CurrencyCode. Throws if the input
 * is not a 3-character ISO-style string, or if the normalized code is not
 * in SUPPORTED_CURRENCIES.
 *
 * Whitespace is trimmed; case is normalized to uppercase.
 */
export function normalizeCurrency(raw: string): CurrencyCode {
  const trimmed = raw.trim();
  if (trimmed.length !== 3) {
    throw new InvalidCurrencyError(raw);
  }
  const normalized = trimmed.toUpperCase();
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(normalized)) {
    throw new UnsupportedCurrencyError(normalized);
  }
  return normalized as CurrencyCode;
}
