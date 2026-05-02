import type { Locale } from "./locales";

/**
 * Formats a Date as relative time from now.
 *
 * Picks the appropriate unit (seconds/minutes/hours/days/months/years) based
 * on magnitude. Uses Intl.RelativeTimeFormat under the hood.
 *
 * Examples:
 *   - 30 seconds ago: "há 30 segundos" (pt-BR) | "30 seconds ago" (en-US)
 *   - 2 hours ago:    "há 2 horas"     (pt-BR) | "2 hours ago"    (en-US)
 *   - in 3 days:      "em 3 dias"      (pt-BR) | "in 3 days"      (en-US)
 */
export function formatRelativeTime(
  date: Date,
  locale: Locale,
  now: Date = new Date(),
): string {
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, divisor] of units) {
    if (Math.abs(diffSeconds) >= divisor || unit === "second") {
      const value = Math.round(diffSeconds / divisor);
      return formatter.format(value, unit);
    }
  }

  return formatter.format(0, "second");
}
