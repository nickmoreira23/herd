// i18n-aware label helpers for blocks and categories.
// Migrate callsites from BLOCK_LABEL_MAP[name] to getBlockLabel(name, locale).

import type { Locale } from "@/lib/i18n/locales";
import { t, type MessageKey } from "@/lib/i18n/t";

/** Translated short label for a block (e.g. "Companies" / "Empresas"). */
export function getBlockLabel(blockName: string, locale: Locale): string {
  const key = `blocks.${blockName}` as MessageKey;
  const out = t(key, locale);
  return out === key ? blockName : out;
}

/** Translated label for a block category (e.g. "Sales" / "Comercial"). */
export function getCategoryLabel(categoryId: string, locale: Locale): string {
  const key = `categories.${categoryId}` as MessageKey;
  const out = t(key, locale);
  return out === key ? categoryId : out;
}
