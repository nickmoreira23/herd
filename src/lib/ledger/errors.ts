/**
 * Base class for all ledger-domain errors. Service callers should catch
 * `LedgerError` to handle any ledger-specific failure generically.
 */
export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

export class AccountNotFoundError extends LedgerError {
  constructor(public accountCode: string) {
    super(`Account with code "${accountCode}" not found.`);
    this.name = "AccountNotFoundError";
  }
}

export class AccountArchivedError extends LedgerError {
  constructor(public accountCode: string, public archivedAt: Date) {
    super(`Account "${accountCode}" is archived (since ${archivedAt.toISOString()}) and cannot receive new lines.`);
    this.name = "AccountArchivedError";
  }
}

export class InvalidCurrencyError extends LedgerError {
  constructor(public received: string) {
    super(`Invalid currency code: "${received}". Must be a 3-character ISO 4217 string.`);
    this.name = "InvalidCurrencyError";
  }
}

export class UnsupportedCurrencyError extends LedgerError {
  constructor(public received: string) {
    super(`Unsupported currency: "${received}". Add it to SUPPORTED_CURRENCIES first.`);
    this.name = "UnsupportedCurrencyError";
  }
}

export class CurrencyMismatchError extends LedgerError {
  constructor(public accountCode: string, public accountCurrency: string, public lineCurrency: string) {
    super(`Currency mismatch on line for account "${accountCode}": account is ${accountCurrency}, line declared ${lineCurrency}.`);
    this.name = "CurrencyMismatchError";
  }
}

export class InsufficientLinesError extends LedgerError {
  constructor(public received: number) {
    super(`A journal entry must have at least 2 lines; received ${received}.`);
    this.name = "InsufficientLinesError";
  }
}

export class NonPositiveAmountError extends LedgerError {
  constructor(public accountCode: string, public received: bigint) {
    super(`Amount on line for account "${accountCode}" must be strictly positive; received ${received.toString()}.`);
    this.name = "NonPositiveAmountError";
  }
}

export class UnbalancedEntryError extends LedgerError {
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
  constructor(public received: string) {
    super(`sourceId "${received}" is not a valid UUID.`);
    this.name = "InvalidSourceIdError";
  }
}

export class InvalidSourceKindError extends LedgerError {
  constructor(public received: string) {
    super(`sourceKind "${received}" is not a valid JournalEntrySourceKind.`);
    this.name = "InvalidSourceKindError";
  }
}

export class IdempotencyConflictError extends LedgerError {
  constructor(
    public idempotencyKey: string,
    public reason: string,
  ) {
    super(`Idempotency conflict for key "${idempotencyKey}": ${reason}`);
    this.name = "IdempotencyConflictError";
  }
}

export class EntryNotFoundError extends LedgerError {
  constructor(public entryId: string) {
    super(`Journal entry with id "${entryId}" not found.`);
    this.name = "EntryNotFoundError";
  }
}

export class InvalidCursorError extends LedgerError {
  constructor(public received: string) {
    super(`Invalid statement cursor: "${received}".`);
    this.name = "InvalidCursorError";
  }
}

export class StatementLimitExceededError extends LedgerError {
  constructor(public received: number, public max: number) {
    super(`Statement limit ${received} exceeds maximum ${max}.`);
    this.name = "StatementLimitExceededError";
  }
}
