-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE', 'EQUITY');

-- CreateEnum
CREATE TYPE "AccountOwnerKind" AS ENUM ('PLATFORM', 'PROFILE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "JournalLineDirection" AS ENUM ('D', 'C');

-- CreateEnum
CREATE TYPE "JournalEntrySourceKind" AS ENUM ('TRANSACTION', 'COMMISSION', 'REFUND', 'MANUAL_ADJUSTMENT', 'SEED', 'REVERSAL');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "ownerKind" "AccountOwnerKind" NOT NULL,
    "ownerId" UUID,
    "currency" CHAR(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceKind" "JournalEntrySourceKind" NOT NULL,
    "sourceId" UUID NOT NULL,
    "idempotencyKey" TEXT,
    "description" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" BIGSERIAL NOT NULL,
    "journalEntryId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "direction" "JournalLineDirection" NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

-- CreateIndex
CREATE INDEX "accounts_ownerKind_ownerId_idx" ON "accounts"("ownerKind", "ownerId");

-- CreateIndex
CREATE INDEX "accounts_accountType_idx" ON "accounts"("accountType");

-- CreateIndex
CREATE INDEX "accounts_currency_idx" ON "accounts"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_idempotencyKey_key" ON "journal_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "journal_entries_sourceKind_sourceId_idx" ON "journal_entries"("sourceKind", "sourceId");

-- CreateIndex
CREATE INDEX "journal_entries_postedAt_idx" ON "journal_entries"("postedAt");

-- CreateIndex
CREATE INDEX "journal_lines_journalEntryId_idx" ON "journal_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_lines_accountId_idx" ON "journal_lines"("accountId");

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- Balance constraint — Phase 1, Etapa 1.2
-- Enforces: for every journal_entry, sum of debits = sum of credits, per currency.
-- Implemented as a deferrable constraint trigger so it fires at COMMIT time,
-- after all lines of an entry have been inserted within the transaction.
--
-- Note on column casing: this project keeps Prisma camelCase field names as
-- the actual Postgres column names (no per-field @map). All references below
-- use double-quoted camelCase identifiers accordingly.
-- ============================================================

CREATE OR REPLACE FUNCTION ledger_check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_id UUID;
  v_unbalanced_count INT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_entry_id := OLD.id;
  ELSE
    v_entry_id := NEW.id;
  END IF;

  -- Count rows where the per-currency sum doesn't balance to zero.
  -- D contributes positively, C negatively; total must be 0 per currency.
  SELECT COUNT(*) INTO v_unbalanced_count
  FROM (
    SELECT
      currency,
      SUM(CASE WHEN direction = 'D' THEN "amountCents" ELSE -"amountCents" END) AS net
    FROM journal_lines
    WHERE "journalEntryId" = v_entry_id
    GROUP BY currency
    HAVING SUM(CASE WHEN direction = 'D' THEN "amountCents" ELSE -"amountCents" END) <> 0
  ) AS unbalanced;

  IF v_unbalanced_count > 0 THEN
    RAISE EXCEPTION
      'Journal entry % is unbalanced: debits do not equal credits for at least one currency.',
      v_entry_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Also reject entries with zero lines (a JournalEntry without lines is meaningless).
  IF NOT EXISTS (SELECT 1 FROM journal_lines WHERE "journalEntryId" = v_entry_id) THEN
    RAISE EXCEPTION
      'Journal entry % has no lines.',
      v_entry_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_journal_entry_balance
AFTER INSERT OR UPDATE ON journal_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION ledger_check_journal_entry_balance();

-- Also enforce: every JournalLine.currency must match its Account.currency.
-- This prevents the per-currency balance check from being subverted by
-- mismatching the line's currency from its account's.

CREATE OR REPLACE FUNCTION ledger_check_line_currency_matches_account()
RETURNS TRIGGER AS $$
DECLARE
  v_account_currency CHAR(3);
BEGIN
  SELECT currency INTO v_account_currency
  FROM accounts
  WHERE id = NEW."accountId";

  IF v_account_currency IS NULL THEN
    RAISE EXCEPTION
      'Account % not found for journal line.',
      NEW."accountId"
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_account_currency <> NEW.currency THEN
    RAISE EXCEPTION
      'Journal line currency (%) does not match account currency (%) for account %.',
      NEW.currency, v_account_currency, NEW."accountId"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_line_currency_match
BEFORE INSERT OR UPDATE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION ledger_check_line_currency_matches_account();

-- Also enforce: amountCents on journal_lines must be strictly positive.
-- Direction is what indicates "subtraction"; never use a negative amount.

ALTER TABLE journal_lines
  ADD CONSTRAINT chk_journal_line_amount_positive
  CHECK ("amountCents" > 0);
