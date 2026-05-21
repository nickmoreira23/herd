/**
 * Converts Braintree decimal-string amount to canonical cents Int.
 *
 * Braintree returns amounts as strings: "29.99", "0.00", "1500.00".
 * Canonical schema (Sub-etapa 9) uses Int cents to avoid floating-point
 * precision drift across reads/writes.
 *
 * Identical signature + semantics to `src/lib/mappers/recharge/map-amount-cents.ts`.
 * Tech debt: factor out to `src/lib/mappers/_shared/` when 3rd provider arrives.
 *
 * Throws if input is not a valid decimal string (loud-fail).
 */
export function mapBraintreeAmountCents(
  braintreeAmountString: string | null | undefined,
): number {
  if (braintreeAmountString === null || braintreeAmountString === undefined) {
    throw new Error("Cannot map null/undefined amount to cents");
  }
  const parsed = parseFloat(braintreeAmountString);
  if (Number.isNaN(parsed)) {
    throw new Error(
      `Invalid Braintree amount string: "${braintreeAmountString}"`,
    );
  }
  return Math.round(parsed * 100);
}

/** Safe variant — returns 0 for null/undefined. */
export function mapBraintreeAmountCentsOptional(
  braintreeAmountString: string | null | undefined,
): number {
  if (braintreeAmountString === null || braintreeAmountString === undefined) {
    return 0;
  }
  return mapBraintreeAmountCents(braintreeAmountString);
}
