import type {
  AccountBalance,
  AccountStatement,
  EntryDetails,
  StatementLineDetail,
  EntryLineDetail,
} from "./types";

/**
 * Serialized variants of the ledger query types — `BigInt` rendered as `string`,
 * `Date` rendered as `string` (ISO). Suitable for passing as props from RSC
 * to Client Components, which cannot accept BigInt or Date directly.
 *
 * The receiving side either renders directly from the string forms (for IDs
 * and dates that don't need arithmetic) or parses back to bigint/Date when
 * needed (rarely — most UI uses are display-only).
 */

export interface SerializedMoney {
  amountCents: string;   // bigint as decimal string
  currency: string;
}

export interface SerializedAccountInfo {
  id: string;
  code: string;
  name: string;
  accountType: string;
  ownerKind: string;
  ownerId: string | null;
  currency: string;
  archivedAt: string | null;
}

export interface SerializedAccountBalance {
  account: SerializedAccountInfo;
  asOf: string;
  balance: SerializedMoney;
  rawDebits: SerializedMoney;
  rawCredits: SerializedMoney;
  lineCount: number;
}

export interface SerializedStatementLine {
  id: string;
  journalEntryId: string;
  direction: "D" | "C";
  amount: SerializedMoney;
  postedAt: string;
  sourceKind: string;
  sourceId: string;
  entryDescription: string | null;
}

export interface SerializedAccountStatement {
  account: SerializedAccountInfo;
  range: { from: string; to: string };
  lines: SerializedStatementLine[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SerializedEntryLine {
  id: string;
  direction: "D" | "C";
  amount: SerializedMoney;
  account: {
    id: string;
    code: string;
    name: string;
    accountType: string;
  };
}

export interface SerializedEntryDetails {
  id: string;
  sourceKind: string;
  sourceId: string;
  description: string | null;
  postedAt: string;
  createdAt: string;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  lines: SerializedEntryLine[];
}

// ============================================================
// Serializers
// ============================================================

function serializeMoney(m: { amountCents: bigint; currency: string }): SerializedMoney {
  return { amountCents: m.amountCents.toString(), currency: m.currency };
}

function serializeAccountInfo(a: AccountBalance["account"]): SerializedAccountInfo {
  return {
    id: a.id,
    code: a.code,
    name: a.name,
    accountType: a.accountType,
    ownerKind: a.ownerKind,
    ownerId: a.ownerId,
    currency: a.currency,
    archivedAt: a.archivedAt ? a.archivedAt.toISOString() : null,
  };
}

export function serializeAccountBalance(b: AccountBalance): SerializedAccountBalance {
  return {
    account: serializeAccountInfo(b.account),
    asOf: b.asOf.toISOString(),
    balance: serializeMoney(b.balance),
    rawDebits: serializeMoney(b.rawDebits),
    rawCredits: serializeMoney(b.rawCredits),
    lineCount: b.lineCount,
  };
}

function serializeStatementLine(l: StatementLineDetail): SerializedStatementLine {
  return {
    id: l.id,
    journalEntryId: l.journalEntryId,
    direction: l.direction,
    amount: serializeMoney(l.amount),
    postedAt: l.postedAt.toISOString(),
    sourceKind: l.sourceKind,
    sourceId: l.sourceId,
    entryDescription: l.entryDescription,
  };
}

export function serializeAccountStatement(s: AccountStatement): SerializedAccountStatement {
  return {
    account: serializeAccountInfo(s.account),
    range: { from: s.range.from.toISOString(), to: s.range.to.toISOString() },
    lines: s.lines.map(serializeStatementLine),
    nextCursor: s.nextCursor,
    hasMore: s.hasMore,
  };
}

function serializeEntryLine(l: EntryLineDetail): SerializedEntryLine {
  return {
    id: l.id,
    direction: l.direction,
    amount: serializeMoney(l.amount),
    account: {
      id: l.account.id,
      code: l.account.code,
      name: l.account.name,
      accountType: l.account.accountType,
    },
  };
}

export function serializeEntryDetails(e: EntryDetails): SerializedEntryDetails {
  return {
    id: e.id,
    sourceKind: e.sourceKind,
    sourceId: e.sourceId,
    description: e.description,
    postedAt: e.postedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    idempotencyKey: e.idempotencyKey,
    metadata: e.metadata,
    lines: e.lines.map(serializeEntryLine),
  };
}
