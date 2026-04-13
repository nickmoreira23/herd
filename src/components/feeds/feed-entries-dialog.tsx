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
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  Search,
  Rss,
} from "lucide-react";
import type { RSSFeedRow, RSSEntryRow } from "./types";

interface FeedEntriesDialogProps {
  feed: RSSFeedRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: (feed: RSSFeedRow) => void;
}

const STATUS_DOT: Record<string, string> = {
  READY: "bg-emerald-500",
  ERROR: "bg-red-500",
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    label: "Syncing",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function FeedEntriesDialog({
  feed,
  open,
  onOpenChange,
  onSync,
}: FeedEntriesDialogProps) {
  if (!feed) return null;

  const [entries, setEntries] = useState<RSSEntryRow[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [entryContent, setEntryContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [entrySearch, setEntrySearch] = useState("");

  const statusConfig = STATUS_CONFIG[feed.status] || STATUS_CONFIG.PENDING;

  useEffect(() => {
    if (open) {
      fetch(`/api/feeds/${feed.id}/entries`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.entries) {
            setEntries(json.data.entries);
          }
        });
    }
  }, [open, feed.id]);

  const loadEntryContent = useCallback(
    async (entryId: string) => {
      setSelectedEntryId(entryId);
      setLoadingContent(true);
      setEntryContent(null);
      try {
        const res = await fetch(
          `/api/feeds/${feed.id}/entries/${entryId}`
        );
        const json = await res.json();
        if (json.data?.textContent) {
          setEntryContent(json.data.textContent);
        }
      } catch {
        setEntryContent(null);
      } finally {
        setLoadingContent(false);
      }
    },
    [feed.id]
  );

  const filteredEntries = entrySearch
    ? entries.filter(
        (e) =>
          e.title.toLowerCase().includes(entrySearch.toLowerCase()) ||
          (e.author || "").toLowerCase().includes(entrySearch.toLowerCase()) ||
          e.categories.some((c) =>
            c.toLowerCase().includes(entrySearch.toLowerCase())
          )
      )
    : entries;

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {feed.faviconUrl ? (
              <img src={feed.faviconUrl} alt="" className="h-4 w-4 rounded" />
            ) : (
              <Rss className="h-4 w-4 text-orange-500" />
            )}
            <DialogTitle className="pr-8">{feed.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <a
              href={feed.feedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground truncate max-w-md inline-flex items-center gap-1"
            >
              {feed.feedUrl}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <Badge
              variant="outline"
              className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20"
            >
              {feed.entryCount} articles
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${statusConfig.className}`}
            >
              {statusConfig.label}
            </Badge>
            {feed.lastCheckedAt && (
              <span className="text-xs text-muted-foreground">
                Checked {new Date(feed.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Two-panel browser */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {/* Left panel — entry list */}
          <div className="w-[280px] shrink-0 flex flex-col rounded-lg border bg-muted/30">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Filter articles..."
                  value={entrySearch}
                  onChange={(e) => setEntrySearch(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  className={`w-full text-left px-3 py-2 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                    selectedEntryId === entry.id ? "bg-muted" : ""
                  }`}
                  onClick={() => loadEntryContent(entry.id)}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        STATUS_DOT[entry.status] || STATUS_DOT.PENDING
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium line-clamp-2">
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {entry.publishedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(entry.publishedAt).toLocaleDateString()}
                          </p>
                        )}
                        {entry.author && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {entry.author}
                          </p>
                        )}
                      </div>
                      {entry.categories.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {entry.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No articles found
                </p>
              )}
            </div>
          </div>

          {/* Right panel — article content */}
          <div className="flex-1 rounded-lg border bg-muted/30 p-4 overflow-auto min-h-0">
            {!selectedEntryId && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <p className="text-sm">
                  Select an article from the list to view its content
                </p>
              </div>
            )}
            {selectedEntryId && loadingContent && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {selectedEntryId && !loadingContent && selectedEntry && (
              <>
                <div className="mb-3 pb-3 border-b">
                  <h4 className="text-sm font-medium">{selectedEntry.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={selectedEntry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      {selectedEntry.sourceUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {selectedEntry.imageUrl && (
                    <img
                      src={selectedEntry.imageUrl}
                      alt=""
                      className="mt-2 rounded-md max-h-40 object-cover"
                    />
                  )}
                </div>
                {entryContent ? (
                  <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {entryContent}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.status === "ERROR"
                      ? "This article failed to scrape."
                      : selectedEntry.status === "PENDING"
                        ? "This article hasn't been scraped yet."
                        : "No content available for this article."}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => feed.siteUrl && window.open(feed.siteUrl, "_blank")}
            disabled={!feed.siteUrl}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open Site
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync(feed)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Sync Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
