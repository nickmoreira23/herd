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
