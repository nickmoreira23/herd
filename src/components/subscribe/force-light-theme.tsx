"use client";

import { useEffect } from "react";

/**
 * Strips the `.dark` class from <html> while this component is mounted, so the
 * subtree (e.g. /subscribe/[id]) renders in light mode regardless of the app's
 * default theme. Restores the prior class list on unmount.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    if (wasDark) html.classList.remove("dark");
    html.style.colorScheme = "light";
    return () => {
      if (wasDark) html.classList.add("dark");
      html.style.colorScheme = "";
    };
  }, []);
  return null;
}
