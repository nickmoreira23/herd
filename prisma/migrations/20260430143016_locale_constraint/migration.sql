-- ============================================================
-- Locale standardization — Phase 1.5, Etapa 1.5.2
-- 1. Migrates legacy short-form locale values to full region form.
-- 2. Adds CHECK constraint enforcing the supported locales whitelist.
--
-- Strategy: full region only ("pt-BR", "en-US") matches what Intl APIs
-- expect natively. Adding a new locale in the future requires:
--   (a) updating SUPPORTED_LOCALES in src/lib/i18n/locales.ts;
--   (b) creating a migration that drops and recreates this constraint
--       with the additional locale included.
-- ============================================================

-- Step 1: backfill legacy values.
-- Any existing row with locale = 'en' becomes 'en-US'.
-- Any with empty/null/short 'pt' becomes 'pt-BR'.
-- Any other unsupported value (incl. 'es', 'es-ES', etc.) defaults to 'pt-BR'
-- to avoid CHECK constraint violation. If any row needs preservation, run
-- a migration BEFORE this one that captures the original value into a
-- separate audit column.

UPDATE network_profiles
SET "locale" = 'en-US'
WHERE "locale" = 'en';

UPDATE network_profiles
SET "locale" = 'pt-BR'
WHERE "locale" IS NULL OR "locale" = '' OR "locale" = 'pt';

UPDATE network_profiles
SET "locale" = 'pt-BR'
WHERE "locale" NOT IN ('pt-BR', 'en-US');

-- Step 2: add CHECK constraint.

ALTER TABLE network_profiles
  ADD CONSTRAINT chk_network_profile_locale_supported
  CHECK ("locale" IN ('pt-BR', 'en-US'));
