/**
 * Supported locales for the system. Each locale is identified by a full
 * region tag (e.g. "pt-BR", "en-US") so that Intl APIs (NumberFormat,
 * DateTimeFormat, RelativeTimeFormat, PluralRules, Collator) receive
 * unambiguous identifiers without needing region defaults.
 *
 * To add a new locale:
 *   1. Add the tag to SUPPORTED_LOCALES.
 *   2. Create src/lib/i18n/messages/{tag}.ts mirroring pt-BR.ts.
 *   3. Update the CHECK constraint on network_profiles.locale (new migration).
 *   4. Update normalizeLocale() if the input mapping needs adjustment.
 *
 * The dictionary src/lib/i18n/messages/es.ts is preserved as an experimental
 * template; es-ES is NOT in SUPPORTED_LOCALES and not officially supported in
 * production rotation.
 */
export const SUPPORTED_LOCALES = ["pt-BR", "en-US"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English (US)",
};

/**
 * Normalizes a raw locale-like string into one of the SUPPORTED_LOCALES,
 * or returns null if no match. Used by getLocale() when reading from
 * cookies, headers, or other untrusted sources.
 *
 * Matching strategy:
 *   - Exact match against SUPPORTED_LOCALES (case-insensitive).
 *   - Prefix match: "en" → "en-US", "pt" → "pt-BR" (legacy compat).
 *   - Anything else → null.
 */
export function normalizeLocale(raw: string | undefined | null): Locale | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  for (const locale of SUPPORTED_LOCALES) {
    if (lower === locale.toLowerCase()) return locale;
  }

  // Legacy compat: prefix match for short forms.
  for (const locale of SUPPORTED_LOCALES) {
    const prefix = locale.split("-")[0].toLowerCase();
    if (lower === prefix) return locale;
    if (lower.startsWith(prefix + "-")) return locale;
  }

  return null;
}

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * @deprecated Use `isSupportedLocale` instead. Kept for backwards compatibility.
 */
export const isLocale = isSupportedLocale;
