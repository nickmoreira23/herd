"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useSetLocale } from "@/lib/i18n/use-set-locale";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";

/**
 * Locale selector for the profile dropdown.
 *
 * Renders custom buttons in a column layout to match the visual pattern of
 * the theme switcher (custom buttons inside the Popover, not a shadcn
 * <DropdownMenuRadioGroup>). Coherence with the surrounding profile
 * dropdown UI takes precedence over the shadcn default.
 */
export function LocaleSelector() {
  const currentLocale = useLocale();
  const { setLocale, isPending } = useSetLocale();

  return (
    <div className="px-4 py-2">
      <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <Languages className="h-3.5 w-3.5" />
        Idioma
      </p>
      <div className="flex flex-col gap-1.5">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => setLocale(locale)}
            disabled={isPending}
            className={`flex items-center justify-center rounded-md border px-3 py-1.5 text-xs transition-colors ${
              currentLocale === locale
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/20"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
