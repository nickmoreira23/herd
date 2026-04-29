import type { JournalEntry, JournalLine } from "@prisma/client";

/**
 * Determines whether an existing JournalEntry (with its lines) is equivalent
 * to a new PostJournalEntryInput, for idempotency comparison purposes.
 *
 * "Equivalent" means: same sourceKind, same sourceId, same set of lines
 * (matching by accountId/direction/amount/currency multiset). Description,
 * metadata, and postedAt are NOT compared — they are informational and may
 * legitimately drift between retries.
 */
export interface PayloadComparison {
  equivalent: boolean;
  reason?: string;
}

export function comparePayload(
  existing: { entry: JournalEntry; lines: JournalLine[] },
  proposedSnapshot: {
    sourceKind: string;
    sourceId: string;
    lineSnapshots: Array<{
      accountId: string;
      direction: "D" | "C";
      amountCents: bigint;
      currency: string;
    }>;
  },
): PayloadComparison {
  if (existing.entry.sourceKind !== proposedSnapshot.sourceKind) {
    return {
      equivalent: false,
      reason: `sourceKind differs (existing=${existing.entry.sourceKind}, proposed=${proposedSnapshot.sourceKind})`,
    };
  }
  if (existing.entry.sourceId !== proposedSnapshot.sourceId) {
    return {
      equivalent: false,
      reason: `sourceId differs (existing=${existing.entry.sourceId}, proposed=${proposedSnapshot.sourceId})`,
    };
  }
  if (existing.lines.length !== proposedSnapshot.lineSnapshots.length) {
    return {
      equivalent: false,
      reason: `line count differs (existing=${existing.lines.length}, proposed=${proposedSnapshot.lineSnapshots.length})`,
    };
  }

  // Multiset comparison — order doesn't matter, but every line must match exactly.
  const proposedKeyed = proposedSnapshot.lineSnapshots
    .map((l) => `${l.accountId}|${l.direction}|${l.amountCents}|${l.currency}`)
    .sort();
  const existingKeyed = existing.lines
    .map((l) => `${l.accountId}|${l.direction}|${l.amountCents}|${l.currency}`)
    .sort();

  for (let i = 0; i < proposedKeyed.length; i++) {
    if (proposedKeyed[i] !== existingKeyed[i]) {
      return {
        equivalent: false,
        reason: `line ${i} after sort differs (existing=${existingKeyed[i]}, proposed=${proposedKeyed[i]})`,
      };
    }
  }

  return { equivalent: true };
}
