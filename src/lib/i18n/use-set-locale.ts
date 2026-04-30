"use client";

import { useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setLocaleCookie } from "./set-locale-cookie";
import type { Locale } from "./locales";

/**
 * Hook for changing the user's locale from a client component.
 *
 * Returns:
 *   - setLocale(locale): function to invoke. Calls the server action and
 *     refreshes the route to apply the change.
 *   - isPending: boolean indicating whether the change is in flight.
 *
 * Usage:
 *   const { setLocale, isPending } = useSetLocale();
 *   <button onClick={() => setLocale("en-US")}>English</button>
 */
export function useSetLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback(
    (locale: Locale) => {
      startTransition(async () => {
        await setLocaleCookie(locale);
        router.refresh();
      });
    },
    [router],
  );

  return { setLocale, isPending };
}
