"use client";

import Link from "next/link";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { type Crumb } from "./handbook-breadcrumbs";
import { HandbookEntryActions } from "./handbook-entry-actions";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  crumbs: Crumb[];
  title: string;
  description: string;
  /** Owners are intentionally NOT rendered (the `@nick` chip was noisy). Kept
   * in the type for API compatibility with callers that still pass it. */
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb-as-title: ancestors are muted links, the title is the
              last (bold, dark) crumb. Status pill sits inline on the right. */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 flex-wrap"
          >
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {crumbs.map((c, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && <span className="select-none">/</span>}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </Fragment>
              ))}
              {crumbs.length > 0 && <span className="select-none">/</span>}
            </div>
            <h1 className="text-base font-semibold text-foreground m-0">
              {title}
            </h1>
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status}
            </Badge>
          </nav>

          <p className="text-sm text-muted-foreground mt-2">{description}</p>

          <p
            className="text-xs text-muted-foreground/70 mt-1"
            title={updated}
          >
            {locale === "pt-BR" ? "Atualizado " : "Updated "}
            {formatRelative(updated, locale)}
          </p>
        </div>

        <div data-handbook-toolbar className="shrink-0">
          <HandbookEntryActions
            markdown={markdownRaw}
            githubEditUrl={githubEditUrl}
            selfUrl={selfUrl}
            locale={locale}
            setOverride={setOverride}
            clearOverride={clearOverride}
            hasOverride={hasOverride}
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
