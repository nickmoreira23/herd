import type { Locale } from "./locales";

/**
 * Returns the appropriate plural form for a given count and locale.
 *
 * The forms object must include at least "one" and "other". Locales with
 * more plural categories (Arabic, Polish, Russian, etc.) need additional
 * forms when those locales are added to SUPPORTED_LOCALES.
 *
 * For pt-BR and en-US (both 2-form languages), only "one" and "other" are
 * needed.
 *
 * Example:
 *   pluralize(1, "pt-BR", { one: "1 entrada", other: "{count} entradas" })
 *     → "1 entrada"
 *   pluralize(5, "pt-BR", { one: "1 entrada", other: "{count} entradas" })
 *     → "5 entradas"
 */
export interface PluralForms {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export function pluralize(
  count: number,
  locale: Locale,
  forms: PluralForms,
): string {
  const rules = new Intl.PluralRules(locale);
  const category = rules.select(count) as keyof PluralForms;

  const template = forms[category] ?? forms.other;
  return template.replace("{count}", String(count));
}
