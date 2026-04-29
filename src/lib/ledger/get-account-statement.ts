import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import type { AccountStatement, GetAccountStatementInput } from "./types";
import { AccountNotFoundError, StatementLimitExceededError } from "./errors";
import { encodeStatementCursor, decodeStatementCursor } from "./statement-cursor";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * Returns a paginated statement (extract) of journal lines for an account
 * within an optional date range.
 *
 * Pagination is cursor-based: the cursor encodes the `(postedAt, id)` of the
 * last line returned in the previous batch. Pass back `nextCursor` from a
 * previous response to fetch the next batch.
 *
 * Lines are ordered by `(postedAt ASC, id ASC)` — chronological within the
 * range. Currency of each line is the account's currency by construction
 * (constraint trg_journal_line_currency_match enforces this).
 */
export async function getAccountStatement(
  input: GetAccountStatementInput,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<AccountStatement> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) {
    throw new StatementLimitExceededError(limit, MAX_LIMIT);
  }
  if (limit < 1) {
    throw new StatementLimitExceededError(limit, MAX_LIMIT);
  }

  const account = await client.account.findUnique({ where: { code: input.accountCode } });
  if (!account) {
    throw new AccountNotFoundError(input.accountCode);
  }

  const from = input.from ?? new Date(0);
  const to = input.to ?? new Date();

  // Build base where clause.
  const baseWhere: Prisma.JournalLineWhereInput = {
    accountId: account.id,
    journalEntry: {
      postedAt: { gte: from, lte: to },
    },
  };

  // Apply cursor (resume after last seen).
  let cursorClause: Prisma.JournalLineWhereInput | null = null;
  if (input.cursor) {
    const pos = decodeStatementCursor(input.cursor);
    // We want lines AFTER the cursor position.
    // Strict ordering: postedAt > cursor.postedAt OR (postedAt = cursor.postedAt AND id > cursor.lineId)
    cursorClause = {
      OR: [
        { journalEntry: { postedAt: { gt: pos.postedAt } } },
        {
          AND: [
            { journalEntry: { postedAt: pos.postedAt } },
            { id: { gt: pos.lineId } },
          ],
        },
      ],
    };
  }

  const where: Prisma.JournalLineWhereInput = cursorClause
    ? { AND: [baseWhere, cursorClause] }
    : baseWhere;

  // Fetch limit + 1 to detect whether there's more.
  const rawLines = await client.journalLine.findMany({
    where,
    include: { journalEntry: true },
    orderBy: [
      { journalEntry: { postedAt: "asc" } },
      { id: "asc" },
    ],
    take: limit + 1,
  });

  const hasMore = rawLines.length > limit;
  const slice = hasMore ? rawLines.slice(0, limit) : rawLines;

  const accountCurrency = account.currency as "BRL" | "USD";

  const lines = slice.map((l) => ({
    id: l.id.toString(),
    journalEntryId: l.journalEntryId,
    direction: l.direction,
    amount: money(l.amountCents, accountCurrency),
    postedAt: l.journalEntry.postedAt,
    sourceKind: l.journalEntry.sourceKind,
    sourceId: l.journalEntry.sourceId,
    entryDescription: l.journalEntry.description,
  }));

  const nextCursor = hasMore && slice.length > 0
    ? encodeStatementCursor({
        postedAt: slice[slice.length - 1].journalEntry.postedAt,
        lineId: slice[slice.length - 1].id,
      })
    : null;

  return {
    account: {
      id: account.id,
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      ownerKind: account.ownerKind,
      ownerId: account.ownerId,
      currency: account.currency,
      archivedAt: account.archivedAt,
    },
    range: { from, to },
    lines,
    nextCursor,
    hasMore,
  };
}
