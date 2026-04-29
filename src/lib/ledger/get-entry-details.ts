import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import type { EntryDetails } from "./types";
import { EntryNotFoundError } from "./errors";

/**
 * Returns the full details of a journal entry, with all its lines and
 * resolved account info (code, name, type) on each line.
 *
 * Used for audit and operational inspection — never for high-throughput
 * paths. Performance is non-issue at expected volumes.
 *
 * @throws EntryNotFoundError
 */
export async function getEntryDetails(
  entryId: string,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<EntryDetails> {
  const entry = await client.journalEntry.findUnique({
    where: { id: entryId },
    include: {
      lines: {
        include: { account: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!entry) {
    throw new EntryNotFoundError(entryId);
  }

  return {
    id: entry.id,
    sourceKind: entry.sourceKind,
    sourceId: entry.sourceId,
    description: entry.description,
    postedAt: entry.postedAt,
    createdAt: entry.createdAt,
    idempotencyKey: entry.idempotencyKey,
    metadata: entry.metadata as Record<string, unknown>,
    lines: entry.lines.map((l) => ({
      id: l.id.toString(),
      direction: l.direction,
      amount: money(l.amountCents, l.account.currency as "BRL" | "USD"),
      account: {
        id: l.account.id,
        code: l.account.code,
        name: l.account.name,
        accountType: l.account.accountType,
      },
    })),
  };
}
