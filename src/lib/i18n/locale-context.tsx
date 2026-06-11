"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { t as translate, type MessageKey } from "./t";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useLocale();
  // Stable identity per locale. The previous per-render arrow made `t` an
  // unstable hook dependency: roles-manager's load (useCallback([t])) fed a
  // useEffect([load]) that setState'd → render → new t → refetch, flooding
  // GET /api/org/roles several times per second in PROD.
  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      translate(key, locale, params),
    [locale],
  );
}
