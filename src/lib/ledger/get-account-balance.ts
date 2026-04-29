import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import type { AccountBalance } from "./types";
import { AccountNotFoundError } from "./errors";
import { signedBalanceCents } from "./account-polarity";

/**
 * Returns the balance of an account at a given point in time.
 *
 * The balance is computed by summing all journal lines whose `postedAt <= asOf`
 * (inclusive), grouped by direction, then signed via the account's natural
 * polarity (ASSET/EXPENSE: D-C; LIABILITY/REVENUE/EQUITY: C-D).
 *
 * Always reads from journal_lines directly — no caching, no materialization.
 * For the volume of the early ledger this is exact and acceptable.
 *
 * @param accountCode  Human-readable account code (e.g. "platform:revenue:brl").
 * @param asOf         Optional cutoff. Defaults to `now()`.
 * @throws AccountNotFoundError
 */
export async function getAccountBalance(
  accountCode: string,
  asOf?: Date,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<AccountBalance> {
  const cutoff = asOf ?? new Date();

  const account = await client.account.findUnique({ where: { code: accountCode } });
  if (!account) {
    throw new AccountNotFoundError(accountCode);
  }

  // Aggregate sums by direction in a single round trip.
  const grouped = await client.journalLine.groupBy({
    by: ["direction"],
    where: {
      accountId: account.id,
      journalEntry: { postedAt: { lte: cutoff } },
    },
    _sum: { amountCents: true },
    _count: { _all: true },
  });

  let rawDebitCents = 0n;
  let rawCreditCents = 0n;
  let lineCount = 0;
  for (const g of grouped) {
    const sum = g._sum.amountCents ?? 0n;
    if (g.direction === "D") rawDebitCents = sum;
    else rawCreditCents = sum;
    lineCount += g._count._all;
  }

  const balanceCents = signedBalanceCents(account.accountType, rawDebitCents, rawCreditCents);

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
    asOf: cutoff,
    balance: money(balanceCents, account.currency as "BRL" | "USD"),
    rawDebits: money(rawDebitCents, account.currency as "BRL" | "USD"),
    rawCredits: money(rawCreditCents, account.currency as "BRL" | "USD"),
    lineCount,
  };
}
