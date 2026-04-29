import { messages as ptBR, type MessageKey } from "./messages/pt-BR";
import { messages as en } from "./messages/en";
import { messages as es } from "./messages/es";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = {
  "pt-BR": ptBR,
  en,
  es,
};

export type { MessageKey };

/**
 * Translate a key for a given locale.
 * Falls back to the default locale, then to the key itself if missing.
 * Supports `{name}` style interpolation.
 */
export function t(
  key: MessageKey,
  locale: Locale,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  let raw = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? (key as string);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      raw = raw.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return raw;
}
