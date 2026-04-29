import { headers, cookies } from "next/headers";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./locales";

/**
 * Resolve the active locale for the current request, in priority order:
 *   1. `?locale=…` query param (testing override, forwarded by middleware)
 *   2. `locale` cookie (set by login flow / settings page)
 *   3. `Accept-Language` header
 *   4. DEFAULT_LOCALE
 *
 * NOTE: We deliberately do not query the DB for `NetworkProfile.locale` here —
 * doing so blocks the root layout render (Next 15 warning). The login handler
 * (and a future profile/settings UI) is responsible for syncing the user's
 * preferred locale into the `locale` cookie.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();

  // 1. Query string override
  const override = h.get("x-locale-override");
  if (override) return normalizeLocale(override);

  // 2. Cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);

  // 3. Accept-Language
  const accept = h.get("accept-language");
  if (accept) {
    const first = accept.split(",")[0]?.trim();
    if (first) return normalizeLocale(first);
  }

  return DEFAULT_LOCALE;
}
