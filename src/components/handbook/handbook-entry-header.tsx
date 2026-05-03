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
  /** `updated` is preserved on the prop API but not rendered here yet — moves
   * to a dedicated metadata strip in a later iteration. */
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

/**
 * Page header for a Handbook entry. Shape mirrors `/admin/blocks` (the
 * "All Blocks" page) for visual consistency: large bold title, muted
 * subtitle, no chrome above. The breadcrumb is folded into the title line —
 * ancestors render muted, the current entry's title renders in foreground —
 * so we don't repeat the entry name twice.
 */
export function HandbookEntryHeader({
  crumbs,
  title,
  description,
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
    <header className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            aria-label={title}
            className="m-0 text-2xl flex items-baseline gap-2 flex-wrap"
          >
            {crumbs.length > 0 && (
              <span className="flex items-baseline gap-2 text-muted-foreground font-medium">
                {crumbs.map((c, idx) => (
                  <Fragment key={idx}>
                    {idx > 0 && (
                      <span className="text-muted-foreground/40 select-none">
                        /
                      </span>
                    )}
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
                <span className="text-muted-foreground/40 select-none">/</span>
              </span>
            )}
            <span className="font-bold text-foreground">{title}</span>
          </h1>
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
    </header>
  );
}
