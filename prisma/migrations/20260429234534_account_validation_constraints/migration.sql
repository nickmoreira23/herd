-- ============================================================
-- CHECK constraints — Phase 1, Etapa 1.6
-- Protects accounts against:
-- 1. Naming convention violations (typos, wrong separator, etc.)
-- 2. Unsupported currencies (typos like "BR" instead of "BRL")
--
-- These constraints are kept narrow on purpose: they prevent obviously
-- malformed data from reaching the ledger. Enforcement of business rules
-- (which codes are "expected") lives in the seed layer, not here.
-- ============================================================

-- Code naming convention: lowercase alphanumeric + ':' + '-' + '_'
ALTER TABLE accounts
  ADD CONSTRAINT chk_account_code_format
  CHECK (code ~ '^[a-z0-9_:-]+$' AND length(code) > 0);

-- Supported currencies: BRL and USD only.
-- To add a new currency: (1) update src/lib/money/currency.ts;
-- (2) create a new migration that drops and recreates this constraint
-- with the additional code listed.
ALTER TABLE accounts
  ADD CONSTRAINT chk_account_currency_supported
  CHECK (currency IN ('BRL', 'USD'));
