/**
 * Normalizes Braintree Subscription.Status (Title Case with spaces) to a
 * canonical lowercase + underscore convention.
 *
 * Braintree values: "Active", "Canceled", "Expired", "Past Due", "Pending".
 * Canonical persisted: "active", "canceled", "expired", "past_due", "pending".
 *
 * `Subscription.status` é `String` no schema canonical (Sub-etapa 9, não enum) —
 * convention lowercase+underscore garante consistência cross-provider e
 * queries simples. Recharge persiste verbatim já em lowercase; Braintree
 * exige normalização explícita pelo Title Case + espaço em "Past Due".
 */
export function mapBraintreeSubscriptionStatus(braintreeStatus: string): string {
  return braintreeStatus.toLowerCase().replace(/ /g, "_");
}
