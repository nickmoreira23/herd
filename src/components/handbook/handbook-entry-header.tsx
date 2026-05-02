"use client";

import { Badge } from "@/components/ui/badge";
import { HandbookBreadcrumbs, type Crumb } from "./handbook-breadcrumbs";
import { HandbookLanguageToggle } from "./handbook-language-toggle";
import { HandbookEntryActions } from "./handbook-entry-actions";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  crumbs: Crumb[];
  title: string;
  description: string;
  owners: string[];
  updated: string;
  status: string;
  locale: HandbookLocale;
  setOverride: (locale: HandbookLocale) => void;
  clearOverride: () => void;
  hasOverride: boolean;
  markdownRaw: string;
  githubEditUrl: string;
  selfUrl: string;
}

export function HandbookEntryHeader({
  crumbs,
  title,
  description,
  owners,
  updated,
  status,
  locale,
  setOverride,
  clearOverride,
  hasOverride,
  markdownRaw,
  githubEditUrl,
  selfUrl,
}: Props) {
  return (
    <header className="mb-8">
      <HandbookBreadcrumbs crumbs={crumbs} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
            <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
            {owners.map((o) => (
              <Badge key={o} variant="outline" className="font-mono text-xs">
                {o}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground mt-2">{description}</p>
          <p className="text-xs text-muted-foreground mt-1" title={updated}>
            {locale === "pt-BR" ? "Atualizado " : "Updated "}{formatRelative(updated, locale)}
          </p>
        </div>
        <div
          data-handbook-toolbar
          className="flex items-center gap-1 shrink-0"
        >
          <HandbookLanguageToggle
            locale={locale}
            setOverride={setOverride}
            clearOverride={clearOverride}
            hasOverride={hasOverride}
          />
          <HandbookEntryActions
            markdown={markdownRaw}
            githubEditUrl={githubEditUrl}
            selfUrl={selfUrl}
          />
        </div>
      </div>
    </header>
  );
}

function formatRelative(isoDate: string, locale: HandbookLocale): string {
  const d = new Date(isoDate);
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (locale === "pt-BR") {
    if (days <= 0) return "hoje";
    if (days === 1) return "ontem";
    if (days < 7) return `há ${days} dias`;
    if (days < 30) return `há ${Math.floor(days / 7)} semana(s)`;
    return `em ${d.toLocaleDateString("pt-BR")}`;
  }
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  return `on ${d.toLocaleDateString("en-US")}`;
}
