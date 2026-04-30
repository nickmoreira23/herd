import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface InvariantViolation {
  invariant: string;
  rowId: string;
  detail: Record<string, unknown>;
}

/**
 * Checks invariant 2: every JournalEntry has sum(D) = sum(C) per currency.
 * Returns rows that violate. Empty array means all good.
 */
export async function checkBalancePerCurrency(
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<InvariantViolation[]> {
  const rows = await client.$queryRaw<Array<{
    journalEntryId: string;
    currency: string;
    netCents: bigint;
  }>>`
    SELECT
      "journalEntryId",
      currency,
      SUM(CASE WHEN direction = 'D' THEN "amountCents" ELSE -"amountCents" END) AS "netCents"
    FROM journal_lines
    GROUP BY "journalEntryId", currency
    HAVING SUM(CASE WHEN direction = 'D' THEN "amountCents" ELSE -"amountCents" END) <> 0
  `;
  return rows.map((r) => ({
    invariant: "balance-per-currency",
    rowId: r.journalEntryId,
    detail: {
      currency: r.currency,
      netCents: r.netCents.toString(),
    },
  }));
}

/**
 * Checks invariant 5: every account code matches ^[a-z0-9_:-]+$.
 */
export async function checkAccountCodeFormat(
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<InvariantViolation[]> {
  const rows = await client.$queryRaw<Array<{ id: string; code: string }>>`
    SELECT id, code FROM accounts WHERE code !~ '^[a-z0-9_:-]+$' OR length(code) = 0
  `;
  return rows.map((r) => ({
    invariant: "account-code-format",
    rowId: r.id,
    detail: { code: r.code },
  }));
}

/**
 * Checks invariant 3: every JournalLine.currency matches its Account.currency.
 */
export async function checkLineCurrencyMatchesAccount(
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<InvariantViolation[]> {
  const rows = await client.$queryRaw<Array<{
    lineId: string;
    accountId: string;
    accountCurrency: string;
    lineCurrency: string;
  }>>`
    SELECT
      jl.id::text AS "lineId",
      a.id AS "accountId",
      a.currency AS "accountCurrency",
      jl.currency AS "lineCurrency"
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl."accountId"
    WHERE jl.currency <> a.currency
  `;
  return rows.map((r) => ({
    invariant: "line-currency-matches-account",
    rowId: r.lineId,
    detail: {
      accountId: r.accountId,
      accountCurrency: r.accountCurrency,
      lineCurrency: r.lineCurrency,
    },
  }));
}

/**
 * Runs all three checks and returns combined violations.
 */
export async function checkAllInvariants(
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<InvariantViolation[]> {
  const [balance, codes, currency] = await Promise.all([
    checkBalancePerCurrency(client),
    checkAccountCodeFormat(client),
    checkLineCurrencyMatchesAccount(client),
  ]);
  return [...balance, ...codes, ...currency];
}
