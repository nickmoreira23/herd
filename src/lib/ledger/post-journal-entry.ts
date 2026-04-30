import type { JournalEntry, Prisma, PrismaClient } from "@prisma/client";
import { JournalEntrySourceKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PostJournalEntryInput } from "./types";
import {
  AccountNotFoundError,
  AccountArchivedError,
  CurrencyMismatchError,
  InsufficientLinesError,
  NonPositiveAmountError,
  UnbalancedEntryError,
  InvalidSourceIdError,
  InvalidSourceKindError,
  IdempotencyConflictError,
} from "./errors";
import { normalizeCurrency } from "./normalize-currency";
import { comparePayload } from "./compare-payload";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The canonical entry point for writing to the double-entry ledger.
 *
 * Validates the input, resolves account codes, checks balance per currency,
 * handles idempotency by `idempotencyKey`, and writes the JournalEntry +
 * JournalLines atomically.
 *
 * If the caller passes an open `TransactionClient`, the write happens inside
 * that transaction. Otherwise, the service opens its own transaction.
 *
 * @throws AccountNotFoundError, AccountArchivedError
 * @throws InvalidSourceIdError, InvalidSourceKindError
 * @throws InsufficientLinesError, NonPositiveAmountError, CurrencyMismatchError
 * @throws UnbalancedEntryError
 * @throws InvalidCurrencyError, UnsupportedCurrencyError (from normalizeCurrency)
 * @throws IdempotencyConflictError
 */
export async function postJournalEntry(
  input: PostJournalEntryInput,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<JournalEntry> {
  // ---- Stage 1: shape validations (no DB I/O yet) ----

  if (!UUID_REGEX.test(input.sourceId)) {
    throw new InvalidSourceIdError(input.sourceId);
  }

  if (!Object.values(JournalEntrySourceKind).includes(input.sourceKind)) {
    throw new InvalidSourceKindError(input.sourceKind as unknown as string);
  }

  if (input.lines.length < 2) {
    throw new InsufficientLinesError(input.lines.length);
  }

  for (const line of input.lines) {
    if (line.amount.amountCents <= 0n) {
      throw new NonPositiveAmountError(line.accountCode, line.amount.amountCents);
    }
    // Normalize and validate currency early; we'll match against account next.
    normalizeCurrency(line.amount.currency);
  }

  // ---- Stage 2: balance check per currency ----

  const sumByCurrency: Record<string, { debits: bigint; credits: bigint }> = {};
  for (const line of input.lines) {
    const cur = line.amount.currency;
    sumByCurrency[cur] ??= { debits: 0n, credits: 0n };
    if (line.direction === "D") {
      sumByCurrency[cur].debits += line.amount.amountCents;
    } else {
      sumByCurrency[cur].credits += line.amount.amountCents;
    }
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

  // ---- Stage 3-5: DB I/O — wrapped in transaction (own or caller-provided) ----

  const exec = async (tx: PrismaClient | Prisma.TransactionClient): Promise<JournalEntry> => {
    const uniqueCodes = Array.from(new Set(input.lines.map((l) => l.accountCode)));
    const accounts = await tx.account.findMany({ where: { code: { in: uniqueCodes } } });
    const byCode = new Map(accounts.map((a) => [a.code, a]));

    for (const code of uniqueCodes) {
      const acc = byCode.get(code);
      if (!acc) throw new AccountNotFoundError(code);
      if (acc.archivedAt) throw new AccountArchivedError(code, acc.archivedAt);
    }

    // Check currency match line-by-line.
    for (const line of input.lines) {
      const acc = byCode.get(line.accountCode)!; // safe — checked above
      if (acc.currency !== line.amount.currency) {
        throw new CurrencyMismatchError(line.accountCode, acc.currency, line.amount.currency);
      }
    }

    // ---- Stage 4: idempotency check ----

    if (input.idempotencyKey) {
      const existing = await tx.journalEntry.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { lines: true },
      });
      if (existing) {
        const proposedSnapshot = {
          sourceKind: input.sourceKind,
          sourceId: input.sourceId,
          lineSnapshots: input.lines.map((l) => ({
            accountId: byCode.get(l.accountCode)!.id,
            direction: l.direction,
            amountCents: l.amount.amountCents,
            currency: l.amount.currency,
          })),
        };
        const cmp = comparePayload(
          { entry: existing, lines: existing.lines },
          proposedSnapshot,
        );
        if (cmp.equivalent) {
          // Idempotent success — return the pre-existing entry as if we just made it.
          return existing;
        }
        throw new IdempotencyConflictError(input.idempotencyKey, cmp.reason ?? "payload mismatch");
      }
    }

    // ---- Stage 5: write ----

    const entry = await tx.journalEntry.create({
      data: {
        sourceKind: input.sourceKind,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey ?? null,
        description: input.description ?? null,
        postedAt: input.postedAt ?? new Date(),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        lines: {
          create: input.lines.map((line) => ({
            accountId: byCode.get(line.accountCode)!.id,
            direction: line.direction,
            amountCents: line.amount.amountCents,
            currency: line.amount.currency,
          })),
        },
      },
    });

    return entry;
  };

  // If caller already passed a TransactionClient, use it directly.
  // Otherwise, open our own transaction.
  if ("$transaction" in client) {
    return (client as PrismaClient).$transaction(exec);
  }
  return exec(client);
}
