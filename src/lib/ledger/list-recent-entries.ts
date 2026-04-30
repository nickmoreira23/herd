import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListRecentEntriesInput {
  /** Default 100, max 500. */
  limit?: number;
}

export interface RecentEntryRow {
  id: string;
  sourceKind: string;
  sourceId: string;
  description: string | null;
  postedAt: Date;
  createdAt: Date;
  lineCount: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * Returns the most recent journal entries with their line counts.
 *
 * Used by the admin UI landing page at /admin/ledger/entries. Ordered by
 * postedAt DESC so the newest entries appear first.
 *
 * Single batched query — accounts and lines are NOT included; this is a
 * lightweight overview suitable for the listing page. For full detail,
 * the caller drills into /admin/ledger/entries/[id] which uses
 * `getEntryDetails`.
 */
export async function listRecentEntries(
  input: ListRecentEntriesInput = {},
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<RecentEntryRow[]> {
  const requested = input.limit ?? DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requested, 1), MAX_LIMIT);

  const entries = await client.journalEntry.findMany({
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      _count: { select: { lines: true } },
    },
  });

  return entries.map((e) => ({
    id: e.id,
    sourceKind: e.sourceKind,
    sourceId: e.sourceId,
    description: e.description,
    postedAt: e.postedAt,
    createdAt: e.createdAt,
    lineCount: e._count.lines,
  }));
}
