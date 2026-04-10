"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface KnowledgeCrawlProgressProps {
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

export function KnowledgeCrawlProgress({
  linkId,
  onComplete,
}: KnowledgeCrawlProgressProps) {
  const [status, setStatus] = useState<CrawlStatus | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/knowledge/links/${linkId}/crawl/status`
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
        <span className="text-sm">Starting crawl...</span>
      </div>
    );
  }

  const total = status.pagesScraped + status.pagesErrored;
  const percent =
    status.pagesDiscovered > 0
      ? Math.round((total / status.pagesDiscovered) * 100)
      : 0;

  const lastPage = status.recentPages[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm font-medium">
          Crawling... {status.pagesScraped} of {status.pagesDiscovered} pages
          scraped
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
        <span>{percent}% complete</span>
        <span>
          {status.pagesErrored > 0 && (
            <span className="text-red-500">
              {status.pagesErrored} errors
            </span>
          )}
        </span>
      </div>

      {lastPage && (
        <p className="text-xs text-muted-foreground truncate">
          Last scraped: {lastPage.title || lastPage.url}
        </p>
      )}
    </div>
  );
}
