import type { Money } from "@/lib/money";
import type {
  AccountType,
  AccountOwnerKind,
  JournalLineDirection,
  JournalEntrySourceKind,
} from "@prisma/client";

export type {
  AccountType,
  AccountOwnerKind,
  JournalLineDirection,
  JournalEntrySourceKind,
};

/**
 * Input for the canonical ledger posting function.
 *
 * `lines` must be a flat array. Use `buildBalancedEntry` to construct it
 * from semantic debits/credits — that helper validates the balance and is
 * the recommended path.
 */
export interface PostJournalEntryInput {
  sourceKind: JournalEntrySourceKind;
  sourceId: string;
  description?: string;
  idempotencyKey?: string;
  /**
   * Defaults to `now()`. Use only for migration-of-history or deliberate
   * back-dated adjustments. Back-dating breaks chronological ordering of
   * the ledger and should be rare.
   */
  postedAt?: Date;
  metadata?: Record<string, unknown>;
  lines: PostJournalLineInput[];
}

export interface PostJournalLineInput {
  accountCode: string;
  direction: JournalLineDirection;
  amount: Money;
}

/**
 * Input shape for `buildBalancedEntry`.
 */
export interface BuildBalancedEntryInput {
  debits: Array<{ accountCode: string; amount: Money }>;
  credits: Array<{ accountCode: string; amount: Money }>;
}

// ============================================================
// Query types — Etapa 1.4
// ============================================================

export interface AccountInfo {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  ownerKind: AccountOwnerKind;
  ownerId: string | null;
  currency: string;
  archivedAt: Date | null;
}

export interface AccountBalance {
  account: AccountInfo;
  asOf: Date;
  balance: Money;       // signed via accountType polarity
  rawDebits: Money;     // raw sum of D lines
  rawCredits: Money;    // raw sum of C lines
  lineCount: number;
}

export interface StatementLineDetail {
  id: string;           // BigInt JournalLine.id, exposed as string for JSON safety
  journalEntryId: string;
  direction: JournalLineDirection;
  amount: Money;
  postedAt: Date;
  sourceKind: JournalEntrySourceKind;
  sourceId: string;
  entryDescription: string | null;
}

export interface AccountStatement {
  account: AccountInfo;
  range: { from: Date; to: Date };
  lines: StatementLineDetail[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface EntryDetails {
  id: string;
  sourceKind: JournalEntrySourceKind;
  sourceId: string;
  description: string | null;
  postedAt: Date;
  createdAt: Date;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  lines: EntryLineDetail[];
}

export interface EntryLineDetail {
  id: string;           // BigInt as string
  direction: JournalLineDirection;
  amount: Money;
  account: {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
  };
}

export interface GetAccountStatementInput {
  accountCode: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;       // default 100, max 500
}
