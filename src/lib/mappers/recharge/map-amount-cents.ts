/**
 * Converts Recharge dollars-string amount to canonical cents Int.
 *
 * Recharge returns amounts as decimal strings: "29.99", "0.00", "1500.00".
 * Canonical billing schema uses Int cents (Sub-etapa 9) to avoid floating-
 * point precision drift across reads/writes.
 *
 * Throws if input is not a valid decimal string (loud-fail).
 */
export function mapAmountCents(
  rechargeDollarsString: string | null | undefined,
): number {
  if (rechargeDollarsString === null || rechargeDollarsString === undefined) {
    throw new Error("Cannot map null/undefined amount to cents");
  }
  const parsed = parseFloat(rechargeDollarsString);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid Recharge amount string: "${rechargeDollarsString}"`);
  }
  return Math.round(parsed * 100);
}

/**
 * Safe variant — returns 0 for null/undefined. Use for optional amounts
 * (e.g. `total_tax`, `total_discounts`) that providers may omit.
 */
export function mapAmountCentsOptional(
  rechargeDollarsString: string | null | undefined,
): number {
  if (rechargeDollarsString === null || rechargeDollarsString === undefined) {
    return 0;
  }
  return mapAmountCents(rechargeDollarsString);
}
