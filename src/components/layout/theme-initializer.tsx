"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

export function ThemeInitializer() {
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          const settings = json.data as Record<string, string>;
          const saved = settings.themeMode as "light" | "dark" | undefined;
          if (saved === "light" || saved === "dark") {
            setTheme(saved);
          } else {
            // Default to dark
            setTheme("dark");
          }
        }
      })
      .catch(() => {
        setTheme("dark");
      });
  }, [setTheme]);

  return null;
}
