import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { signedBalanceCents } from "./account-polarity";
import type { AccountBalance } from "./types";

export interface ListAccountsFilter {
  accountType?: string;
  currency?: string;
  includeArchived?: boolean;
}

/**
 * Returns all accounts (optionally filtered) with their current balances.
 *
 * Computes balances in a single round-trip via `groupBy` on journal_lines
 * grouped by accountId + direction. Avoids N+1.
 *
 * Used primarily by the admin UI landing page.
 */
export async function listAccountsWithBalance(
  filter: ListAccountsFilter = {},
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<AccountBalance[]> {
  const where: Prisma.AccountWhereInput = {};
  if (filter.accountType) where.accountType = filter.accountType as Prisma.AccountWhereInput["accountType"];
  if (filter.currency) where.currency = filter.currency;
  if (!filter.includeArchived) where.archivedAt = null;

  const accounts = await client.account.findMany({
    where,
    orderBy: [{ accountType: "asc" }, { code: "asc" }],
  });

  if (accounts.length === 0) return [];

  // Single batched query: sums by (accountId, direction).
  const sums = await client.journalLine.groupBy({
    by: ["accountId", "direction"],
    where: { accountId: { in: accounts.map((a) => a.id) } },
    _sum: { amountCents: true },
    _count: { _all: true },
  });

  const summary = new Map<string, { D: bigint; C: bigint; lineCount: number }>();
  for (const s of sums) {
    const acc = summary.get(s.accountId) ?? { D: 0n, C: 0n, lineCount: 0 };
    if (s.direction === "D") acc.D = s._sum.amountCents ?? 0n;
    else acc.C = s._sum.amountCents ?? 0n;
    acc.lineCount += s._count._all;
    summary.set(s.accountId, acc);
  }

  const now = new Date();
  return accounts.map((account) => {
    const sums = summary.get(account.id) ?? { D: 0n, C: 0n, lineCount: 0 };
    const balanceCents = signedBalanceCents(account.accountType, sums.D, sums.C);
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
      asOf: now,
      balance: money(balanceCents, account.currency as "BRL" | "USD"),
      rawDebits: money(sums.D, account.currency as "BRL" | "USD"),
      rawCredits: money(sums.C, account.currency as "BRL" | "USD"),
      lineCount: sums.lineCount,
    };
  });
}
