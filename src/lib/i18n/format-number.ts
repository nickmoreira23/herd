import type { Locale } from "./locales";

/**
 * Formats a number according to the user's locale.
 *
 * Presets:
 *   - "integer": no decimals, with thousands separator
 *   - "decimal": 2 decimals by default, with thousands separator
 *   - "percent": as percentage (input 0.85 → "85%")
 *   - "compact": "1,2 mil" (pt-BR) / "1.2K" (en-US)
 */
export type NumberFormatPreset = "integer" | "decimal" | "percent" | "compact";

export function formatNumber(
  value: number | bigint,
  locale: Locale,
  preset: NumberFormatPreset = "decimal",
): string {
  const options: Intl.NumberFormatOptions = (() => {
    switch (preset) {
      case "integer":
        return { maximumFractionDigits: 0 };
      case "decimal":
        return { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      case "percent":
        return { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 2 };
      case "compact":
        return { notation: "compact", maximumFractionDigits: 1 };
    }
  })();

  return new Intl.NumberFormat(locale, options).format(value);
}
