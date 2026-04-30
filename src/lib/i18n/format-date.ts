import type { Locale } from "./locales";

/**
 * Formats a Date according to the user's locale.
 *
 * Presets:
 *   - "short":     "15/01/2024"            (pt-BR) | "01/15/2024" (en-US)
 *   - "long":      "15 de janeiro de 2024" (pt-BR) | "January 15, 2024" (en-US)
 *   - "dateTime":  "15/01/2024 10:30"      (pt-BR) | "01/15/2024 10:30 AM" (en-US)
 *   - "time":      "10:30"                 (24h pt-BR) | "10:30 AM" (en-US)
 *
 * For relative time ("2 hours ago"), use formatRelativeTime instead.
 */
export type DateFormatPreset = "short" | "long" | "dateTime" | "time";

export function formatDate(
  date: Date,
  locale: Locale,
  preset: DateFormatPreset = "short",
): string {
  const options: Intl.DateTimeFormatOptions = (() => {
    switch (preset) {
      case "short":
        return { year: "numeric", month: "2-digit", day: "2-digit" };
      case "long":
        return { year: "numeric", month: "long", day: "numeric" };
      case "dateTime":
        return {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        };
      case "time":
        return { hour: "2-digit", minute: "2-digit" };
    }
  })();

  return new Intl.DateTimeFormat(locale, options).format(date);
}
