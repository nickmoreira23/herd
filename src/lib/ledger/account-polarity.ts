import type { AccountType } from "@prisma/client";

/**
 * Returns the natural polarity of an account type — i.e., which direction
 * (debit or credit) constitutes a positive balance for that account.
 *
 * - ASSET, EXPENSE: positive balance = D - C
 * - LIABILITY, REVENUE, EQUITY: positive balance = C - D
 *
 * This is fundamental accounting; not project-specific.
 */
export function naturalSign(accountType: AccountType): 1n | -1n {
  switch (accountType) {
    case "ASSET":
    case "EXPENSE":
      return 1n;
    case "LIABILITY":
    case "REVENUE":
    case "EQUITY":
      return -1n;
  }
}

/**
 * Computes the signed balance for an account given its raw debit and credit
 * sums (both as bigint, in cents). Returns balance in the account's natural
 * polarity (positive = "normal" direction; negative = unusual).
 *
 * This is pure arithmetic — no I/O, no Money construction. The Money wrapper
 * is added by the caller (getAccountBalance) so currency stays explicit.
 */
export function signedBalanceCents(
  accountType: AccountType,
  rawDebitCents: bigint,
  rawCreditCents: bigint,
): bigint {
  const sign = naturalSign(accountType);
  // sign=1n  →  D - C (assets/expenses)
  // sign=-1n →  C - D (liabilities/revenue/equity), equivalently -(D - C)
  return sign * (rawDebitCents - rawCreditCents);
}
