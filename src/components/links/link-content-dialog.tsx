"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, RefreshCw, Loader2, Search, Globe } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";
import type { MessageKey } from "@/lib/i18n/t";
import { linkStatusLabelKey } from "@/lib/links/status-options";
import { CrawlProgress } from "./crawl-progress";
import type { LinkRow, LinkPageRow } from "./types";

interface LinkContentDialogProps {
  link: LinkRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescrape: (link: LinkRow) => void;
}

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

const STATUS_CLASSNAMES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_DOT: Record<string, string> = {
  READY: "bg-emerald-500",
  ERROR: "bg-red-500",
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
};

function formatContentLength(chars: number, t: TranslateFn): string {
  if (chars < 1000) return t("links.list.content.chars_short", { count: chars });
  if (chars < 1_000_000)
    return t("links.list.content.chars_thousands", {
      count: (chars / 1000).toFixed(1),
    });
  return t("links.list.content.chars_millions", {
    count: (chars / 1_000_000).toFixed(1),
  });
}

export function LinkContentDialog({
  link,
  open,
  onOpenChange,
  onRescrape,
}: LinkContentDialogProps) {
  if (!link) return null;

  if (link.scrapeMode === "FULL_SITE") {
    return (
      <FullSiteContentDialog
        link={link}
        open={open}
        onOpenChange={onOpenChange}
        onRescrape={onRescrape}
      />
    );
  }

  return (
    <SinglePageContentDialog
      link={link}
      open={open}
      onOpenChange={onOpenChange}
      onRescrape={onRescrape}
    />
  );
}

function SinglePageContentDialog({
  link,
  open,
  onOpenChange,
  onRescrape,
}: LinkContentDialogProps) {
  const t = useT();
  const locale = useLocale();
  if (!link) return null;
  const statusClass = STATUS_CLASSNAMES[link.status] ?? STATUS_CLASSNAMES.PENDING;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{link.name}</DialogTitle>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground truncate max-w-md inline-flex items-center gap-1"
            >
              {link.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <Badge
              variant="outline"
              className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20"
            >
              {link.domain}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${statusClass}`}
            >
              {t(linkStatusLabelKey(link.status))}
            </Badge>
            {link.lastScrapedAt && (
              <span className="text-xs text-muted-foreground">
                {t("links.content_dialog.scraped_at", {
                  date: formatDate(new Date(link.lastScrapedAt), locale, "short"),
                })}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4 min-h-0">
          {link.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">
                {t("links.content_dialog.scraping_in_progress")}
              </p>
            </div>
          )}
          {link.status === "PENDING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <p className="text-sm">
                {t("links.content_dialog.scraping_not_started")}
              </p>
            </div>
          )}
          {link.status === "ERROR" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-sm text-destructive">
                {link.errorMessage ||
                  t("links.content_dialog.error_default")}
              </p>
            </div>
          )}
          {link.status === "READY" && link.textContent && (
            <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed">
              {link.textContent}
            </pre>
          )}
          {link.status === "READY" && !link.textContent && (
            <p className="text-sm text-muted-foreground">
              {t("links.content_dialog.no_content_extracted")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(link.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {t("links.content_dialog.actions.open_url")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRescrape(link)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t("links.content_dialog.actions.rescrape")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FullSiteContentDialog({
  link,
  open,
  onOpenChange,
  onRescrape,
}: LinkContentDialogProps) {
  const t = useT();
  const locale = useLocale();
  if (!link) return null;

  const [pages, setPages] = useState<LinkPageRow[]>(
    link.pages || []
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [pageSearch, setPageSearch] = useState("");

  const statusClass = STATUS_CLASSNAMES[link.status] ?? STATUS_CLASSNAMES.PENDING;

  // Load pages list when dialog opens
  useEffect(() => {
    if (open && link.scrapeMode === "FULL_SITE") {
      fetch(`/api/links/${link.id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.pages) {
            setPages(json.data.pages);
          }
        });
    }
  }, [open, link.id, link.scrapeMode]);

  // Load individual page content
  const loadPageContent = useCallback(
    async (pageId: string) => {
      setSelectedPageId(pageId);
      setLoadingContent(true);
      setPageContent(null);
      try {
        const res = await fetch(
          `/api/links/${link.id}/pages/${pageId}`
        );
        const json = await res.json();
        if (json.data?.textContent) {
          setPageContent(json.data.textContent);
        } else {
          setPageContent(null);
        }
      } catch {
        setPageContent(null);
      } finally {
        setLoadingContent(false);
      }
    },
    [link.id]
  );

  const handleCrawlComplete = useCallback(() => {
    fetch(`/api/links/${link.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.pages) {
          setPages(json.data.pages);
        }
      });
  }, [link.id]);

  const filteredPages = pageSearch
    ? pages.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(pageSearch.toLowerCase()) ||
          p.url.toLowerCase().includes(pageSearch.toLowerCase()) ||
          p.path.toLowerCase().includes(pageSearch.toLowerCase())
      )
    : pages;

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-orange-500" />
            <DialogTitle className="pr-8">{link.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground truncate max-w-md inline-flex items-center gap-1"
            >
              {link.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <Badge
              variant="outline"
              className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20"
            >
              {t("links.content_dialog.pages_count", {
                count: link.pagesScraped,
              })}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${statusClass}`}
            >
              {t(linkStatusLabelKey(link.status))}
            </Badge>
            {link.lastScrapedAt && (
              <span className="text-xs text-muted-foreground">
                {t("links.content_dialog.crawled_at", {
                  date: formatDate(new Date(link.lastScrapedAt), locale, "short"),
                })}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Crawl in progress */}
        {link.status === "PROCESSING" && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <CrawlProgress
              linkId={link.id}
              onComplete={handleCrawlComplete}
            />
          </div>
        )}

        {/* Page browser */}
        {link.status !== "PROCESSING" && (
          <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
            {/* Left panel — page list */}
            <div className="w-[250px] shrink-0 flex flex-col rounded-lg border bg-muted/30">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder={t("links.content_dialog.search_placeholder")}
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {filteredPages.map((page) => (
                  <button
                    key={page.id}
                    className={`w-full text-left px-3 py-2 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      selectedPageId === page.id ? "bg-muted" : ""
                    }`}
                    onClick={() => loadPageContent(page.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          STATUS_DOT[page.status] || STATUS_DOT.PENDING
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {page.title || page.path}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {page.path}
                        </p>
                        {page.contentLength > 0 && (
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {formatContentLength(page.contentLength, t)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredPages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {t("links.content_dialog.no_pages")}
                  </p>
                )}
              </div>
            </div>

            {/* Right panel — page content */}
            <div className="flex-1 rounded-lg border bg-muted/30 p-4 overflow-auto min-h-0">
              {!selectedPageId && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <p className="text-sm">
                    {t("links.content_dialog.empty_selection")}
                  </p>
                </div>
              )}
              {selectedPageId && loadingContent && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {selectedPageId && !loadingContent && selectedPage && (
                <>
                  <div className="mb-3 pb-3 border-b">
                    <h4 className="text-sm font-medium">
                      {selectedPage.title || selectedPage.path}
                    </h4>
                    <a
                      href={selectedPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      {selectedPage.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {pageContent ? (
                    <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {pageContent}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedPage.status === "ERROR"
                        ? t("links.content_dialog.page.error_scrape")
                        : t("links.content_dialog.page.no_content")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(link.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {t("links.content_dialog.actions.open_url")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRescrape(link)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t("links.content_dialog.actions.recrawl")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

