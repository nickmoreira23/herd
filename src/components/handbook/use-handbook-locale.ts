"use client";

import { useEffect, useState } from "react";
import type { HandbookLocale } from "@/lib/handbook/config";

const STORAGE_KEY = "handbook:lang-override";

export function useHandbookLocale(userDefaultLocale: HandbookLocale): {
  locale: HandbookLocale;
  setOverride: (locale: HandbookLocale) => void;
  clearOverride: () => void;
  hasOverride: boolean;
} {
  const [override, setOverrideState] = useState<HandbookLocale | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pt-BR" || stored === "en-US") {
      setOverrideState(stored);
    }
    setHydrated(true);
  }, []);

  function setOverride(locale: HandbookLocale) {
    window.localStorage.setItem(STORAGE_KEY, locale);
    setOverrideState(locale);
  }

  function clearOverride() {
    window.localStorage.removeItem(STORAGE_KEY);
    setOverrideState(null);
  }

  const locale = hydrated && override ? override : userDefaultLocale;

  return {
    locale,
    setOverride,
    clearOverride,
    hasOverride: hydrated && override !== null,
  };
}
