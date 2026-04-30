/**
 * Base class for all ledger-domain errors. Service callers should catch
 * `LedgerError` to handle any ledger-specific failure generically.
 *
 * Each subclass exposes a `code: string` (no `error.` prefix). UI consumes
 * via `translateError(err, locale)` from `src/lib/i18n/translate-error.ts`.
 * The dictionary entry is `error.{code}` — e.g. `error.ledger.account_not_found`.
 */
export class LedgerError extends Error {
  readonly code: string = "ledger.error";
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

export class AccountNotFoundError extends LedgerError {
  readonly code = "ledger.account_not_found" as const;
  constructor(public accountCode: string) {
    super(`Account with code "${accountCode}" not found.`);
    this.name = "AccountNotFoundError";
  }
}

export class AccountArchivedError extends LedgerError {
  readonly code = "ledger.account_archived" as const;
  constructor(public accountCode: string, public archivedAt: Date) {
    super(`Account "${accountCode}" is archived (since ${archivedAt.toISOString()}) and cannot receive new lines.`);
    this.name = "AccountArchivedError";
  }
}

export class InvalidCurrencyError extends LedgerError {
  readonly code = "ledger.invalid_currency" as const;
  constructor(public received: string) {
    super(`Invalid currency code: "${received}". Must be a 3-character ISO 4217 string.`);
    this.name = "InvalidCurrencyError";
  }
}

export class UnsupportedCurrencyError extends LedgerError {
  readonly code = "ledger.unsupported_currency" as const;
  constructor(public received: string) {
    super(`Unsupported currency: "${received}". Add it to SUPPORTED_CURRENCIES first.`);
    this.name = "UnsupportedCurrencyError";
  }
}

export class CurrencyMismatchError extends LedgerError {
  readonly code = "ledger.currency_mismatch" as const;
  constructor(public accountCode: string, public accountCurrency: string, public lineCurrency: string) {
    super(`Currency mismatch on line for account "${accountCode}": account is ${accountCurrency}, line declared ${lineCurrency}.`);
    this.name = "CurrencyMismatchError";
  }
}

export class InsufficientLinesError extends LedgerError {
  readonly code = "ledger.insufficient_lines" as const;
  constructor(public received: number) {
    super(`A journal entry must have at least 2 lines; received ${received}.`);
    this.name = "InsufficientLinesError";
  }
}

export class NonPositiveAmountError extends LedgerError {
  readonly code = "ledger.non_positive_amount" as const;
  constructor(public accountCode: string, public received: bigint) {
    super(`Amount on line for account "${accountCode}" must be strictly positive; received ${received.toString()}.`);
    this.name = "NonPositiveAmountError";
  }
}

export class UnbalancedEntryError extends LedgerError {
  readonly code = "ledger.unbalanced_entry" as const;
  constructor(
    public imbalanceByCurrency: Record<string, { debits: bigint; credits: bigint; diff: bigint }>,
  ) {
    const summary = Object.entries(imbalanceByCurrency)
      .map(([cur, b]) => `${cur}: D=${b.debits} C=${b.credits} diff=${b.diff}`)
      .join("; ");
    super(`Journal entry is unbalanced. ${summary}`);
    this.name = "UnbalancedEntryError";
  }
}

export class InvalidSourceIdError extends LedgerError {
  readonly code = "ledger.invalid_source_id" as const;
  constructor(public received: string) {
    super(`sourceId "${received}" is not a valid UUID.`);
    this.name = "InvalidSourceIdError";
  }
}

export class InvalidSourceKindError extends LedgerError {
  readonly code = "ledger.invalid_source_kind" as const;
  constructor(public received: string) {
    super(`sourceKind "${received}" is not a valid JournalEntrySourceKind.`);
    this.name = "InvalidSourceKindError";
  }
}

export class IdempotencyConflictError extends LedgerError {
  readonly code = "ledger.idempotency_conflict" as const;
  constructor(
    public idempotencyKey: string,
    public reason: string,
  ) {
    super(`Idempotency conflict for key "${idempotencyKey}": ${reason}`);
    this.name = "IdempotencyConflictError";
  }
}

export class EntryNotFoundError extends LedgerError {
  readonly code = "ledger.entry_not_found" as const;
  constructor(public entryId: string) {
    super(`Journal entry with id "${entryId}" not found.`);
    this.name = "EntryNotFoundError";
  }
}

export class InvalidCursorError extends LedgerError {
  readonly code = "ledger.invalid_cursor" as const;
  constructor(public received: string) {
    super(`Invalid statement cursor: "${received}".`);
    this.name = "InvalidCursorError";
  }
}

export class StatementLimitExceededError extends LedgerError {
  readonly code = "ledger.statement_limit_exceeded" as const;
  constructor(public received: number, public max: number) {
    super(`Statement limit ${received} exceeds maximum ${max}.`);
    this.name = "StatementLimitExceededError";
  }
}

export class CannotReverseReversalError extends LedgerError {
  readonly code = "ledger.cannot_reverse_reversal" as const;
  constructor(public reversalEntryId: string, public originalEntryId: string) {
    super(
      `Cannot reverse a reversal entry (id=${reversalEntryId}, which itself reverses ${originalEntryId}). ` +
      `If you intend to "redo" the original effect, post a new entry instead.`,
    );
    this.name = "CannotReverseReversalError";
  }
}

export class EntryAlreadyReversedError extends LedgerError {
  readonly code = "ledger.entry_already_reversed" as const;
  constructor(
    public originalEntryId: string,
    public existingReversalId: string,
  ) {
    super(
      `Journal entry ${originalEntryId} has already been reversed by entry ${existingReversalId}. ` +
      `If you need a different effect, post a new entry instead of attempting another reversal.`,
    );
    this.name = "EntryAlreadyReversedError";
  }
}

export class MissingReversalReasonError extends LedgerError {
  readonly code = "ledger.missing_reversal_reason" as const;
  constructor() {
    super(
      `Reversal requires an explicit reason. Pass options.reason as a non-empty string explaining why.`,
    );
    this.name = "MissingReversalReasonError";
  }
}
