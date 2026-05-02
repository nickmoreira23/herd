"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  markdown: string;
  githubEditUrl: string;
  selfUrl: string;
  locale: HandbookLocale;
  setOverride: (locale: HandbookLocale) => void;
  clearOverride: () => void;
  hasOverride: boolean;
}

export function HandbookEntryActions({
  markdown,
  githubEditUrl,
  selfUrl,
  locale,
  setOverride,
  clearOverride,
  hasOverride,
}: Props) {
  const t = (pt: string, en: string) => (locale === "pt-BR" ? pt : en);

  function copyMarkdown() {
    navigator.clipboard.writeText(markdown);
    toast.success(t("Markdown copiado", "Markdown copied"));
  }

  function copyLink() {
    const fullUrl = `${window.location.origin}${selfUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success(t("Link copiado", "Link copied"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" />}
        aria-label={t("Opções", "Options")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyMarkdown}>
          <Copy className="h-4 w-4 mr-2" />
          {t("Copiar markdown", "Copy markdown")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <LinkIcon className="h-4 w-4 mr-2" />
          {t("Copiar link", "Copy link")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t("Idioma", "Language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => setOverride(v as HandbookLocale)}
        >
          <DropdownMenuRadioItem value="pt-BR">Português</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en-US">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {hasOverride && (
          <DropdownMenuItem onClick={clearOverride}>
            {t("Usar idioma do admin", "Reset to admin language")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            window.open(githubEditUrl, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t("Editar no GitHub", "Edit on GitHub")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
