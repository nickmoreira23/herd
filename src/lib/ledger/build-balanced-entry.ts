import type { BuildBalancedEntryInput, PostJournalLineInput } from "./types";
import { UnbalancedEntryError, InsufficientLinesError } from "./errors";

/**
 * Builds an array of journal lines from semantic debits/credits, validating
 * that the sum of debits equals the sum of credits per currency BEFORE the
 * caller posts to the ledger.
 *
 * This is the recommended way to construct lines. Callers that have unusual
 * needs (e.g., manually-tagged metadata per line, or asymmetric counts) can
 * still call postJournalEntry directly with a hand-built `lines` array.
 *
 * @throws InsufficientLinesError if total lines < 2
 * @throws UnbalancedEntryError if D != C for any currency
 */
export function buildBalancedEntry(input: BuildBalancedEntryInput): PostJournalLineInput[] {
  const total = input.debits.length + input.credits.length;
  if (total < 2) {
    throw new InsufficientLinesError(total);
  }

  const sumByCurrency: Record<string, { debits: bigint; credits: bigint }> = {};

  for (const d of input.debits) {
    const cur = d.amount.currency;
    sumByCurrency[cur] ??= { debits: 0n, credits: 0n };
    sumByCurrency[cur].debits += d.amount.amountCents;
  }
  for (const c of input.credits) {
    const cur = c.amount.currency;
    sumByCurrency[cur] ??= { debits: 0n, credits: 0n };
    sumByCurrency[cur].credits += c.amount.amountCents;
  }

  const imbalances: Record<string, { debits: bigint; credits: bigint; diff: bigint }> = {};
  for (const [cur, b] of Object.entries(sumByCurrency)) {
    if (b.debits !== b.credits) {
      imbalances[cur] = { debits: b.debits, credits: b.credits, diff: b.debits - b.credits };
    }
  }

  if (Object.keys(imbalances).length > 0) {
    throw new UnbalancedEntryError(imbalances);
  }

  const lines: PostJournalLineInput[] = [
    ...input.debits.map((d) => ({ accountCode: d.accountCode, direction: "D" as const, amount: d.amount })),
    ...input.credits.map((c) => ({ accountCode: c.accountCode, direction: "C" as const, amount: c.amount })),
  ];

  return lines;
}
