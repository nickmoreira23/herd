import type { JournalEntry, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Returns all reversal entries that target a given original journal entry.
 *
 * Under our model, a reversal is identified by `(sourceKind=REVERSAL, sourceId=<originalId>)`.
 * Normally there is at most one reversal per original entry — multiple reversals
 * would be rejected by `reverseJournalEntry` — but the function returns an array
 * for symmetry and for use in audit queries that may inspect malformed states.
 *
 * Ordered by `postedAt ASC, createdAt ASC` for deterministic output.
 */
export async function findReversalsOf(
  originalEntryId: string,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<JournalEntry[]> {
  return client.journalEntry.findMany({
    where: {
      sourceKind: "REVERSAL",
      sourceId: originalEntryId,
    },
    orderBy: [
      { postedAt: "asc" },
      { createdAt: "asc" },
    ],
  });
}
