"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { pluralize } from "@/lib/i18n/pluralize";

interface CrawlProgressProps {
  linkId: string;
  onComplete: () => void;
}

interface CrawlStatus {
  status: string;
  pagesDiscovered: number;
  pagesScraped: number;
  pagesErrored: number;
  recentPages: { title: string | null; url: string; status: string }[];
}

export function CrawlProgress({
  linkId,
  onComplete,
}: CrawlProgressProps) {
  const t = useT();
  const locale = useLocale();
  const [status, setStatus] = useState<CrawlStatus | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/links/${linkId}/crawl/status`
      );
      const json = await res.json();
      if (json.data) {
        setStatus(json.data);
        if (json.data.status !== "PROCESSING") {
          onComplete();
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, [linkId, onComplete]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t("links.crawl_progress.starting")}</span>
      </div>
    );
  }

  const total = status.pagesScraped + status.pagesErrored;
  const percent =
    status.pagesDiscovered > 0
      ? Math.round((total / status.pagesDiscovered) * 100)
      : 0;

  const lastPage = status.recentPages[0];

  const errorsLabel = pluralize(status.pagesErrored, locale, {
    one: t("links.crawl_progress.errors_one"),
    other: t("links.crawl_progress.errors_other", {
      count: status.pagesErrored,
    }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm font-medium">
          {t("links.crawl_progress.crawling", {
            scraped: status.pagesScraped,
            total: status.pagesDiscovered,
          })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t("links.crawl_progress.percent_complete", { percent })}
        </span>
        <span>
          {status.pagesErrored > 0 && (
            <span className="text-red-500">{errorsLabel}</span>
          )}
        </span>
      </div>

      {lastPage && (
        <p className="text-xs text-muted-foreground truncate">
          {t("links.crawl_progress.last_scraped", {
            label: lastPage.title || lastPage.url,
          })}
        </p>
      )}
    </div>
  );
}
