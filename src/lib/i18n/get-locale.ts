import { headers, cookies } from "next/headers";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./locales";

/**
 * Resolve the active locale for the current request, in priority order:
 *   1. `?locale=…` query param (testing override, forwarded by middleware)
 *   2. `locale` cookie (set by login flow / settings page)
 *   3. `Accept-Language` header
 *   4. DEFAULT_LOCALE
 *
 * `normalizeLocale` returns null when the input does not match any
 * SUPPORTED_LOCALES (or any of their accepted prefixes). When that happens,
 * we fall through to the next strategy in the chain.
 *
 * NOTE: We deliberately do not query the DB for `NetworkProfile.locale` here —
 * doing so blocks the root layout render (Next 15 warning). The login handler
 * (and the locale-switcher UI from Etapa 1.5.3) is responsible for syncing
 * the user's preferred locale into the `locale` cookie via `setLocaleCookie`.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();

  // 1. Query string override (forwarded by middleware as x-locale-override)
  const override = h.get("x-locale-override");
  if (override) {
    const normalized = normalizeLocale(override);
    if (normalized) return normalized;
  }

  // 2. Cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale) {
    const normalized = normalizeLocale(cookieLocale);
    if (normalized) return normalized;
  }

  // 3. Accept-Language
  const accept = h.get("accept-language");
  if (accept) {
    const first = accept.split(",")[0]?.trim();
    if (first) {
      const normalized = normalizeLocale(first);
      if (normalized) return normalized;
    }
  }

  return DEFAULT_LOCALE;
}
