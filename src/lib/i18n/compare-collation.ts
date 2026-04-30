import type { Locale } from "./locales";

/**
 * Returns a comparator suitable for Array.sort(), respecting locale-specific
 * collation rules (e.g., "ç" in pt-BR sorts before "d", not after "z" as
 * raw character comparison would).
 *
 * Use when sorting user-facing strings. For internal IDs or technical
 * identifiers (where consistency matters more than user perception), use
 * raw `<` comparison instead.
 *
 * Example:
 *   const sorted = items.sort(compareCollation("pt-BR"));
 */
export function compareCollation(
  locale: Locale,
  options: Intl.CollatorOptions = {},
): (a: string, b: string) => number {
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
    ...options,
  });
  return (a, b) => collator.compare(a, b);
}
