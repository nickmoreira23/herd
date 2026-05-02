"use client";

import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  locale: HandbookLocale;
  setOverride: (locale: HandbookLocale) => void;
  clearOverride: () => void;
  hasOverride: boolean;
}

export function HandbookLanguageToggle({
  locale,
  setOverride,
  clearOverride,
  hasOverride,
}: Props) {
  const localeLabel = locale === "pt-BR" ? "PT" : "EN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <Languages className="h-4 w-4 mr-1" />
        {localeLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setOverride("pt-BR")}
          className={locale === "pt-BR" ? "bg-accent" : ""}
        >
          Português
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setOverride("en-US")}
          className={locale === "en-US" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        {hasOverride && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearOverride}>
              Reset to admin language
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
