"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeAddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function KnowledgeAddLinkModal({
  open,
  onOpenChange,
  onComplete,
}: KnowledgeAddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scrapeMode, setScrapeMode] = useState<"SINGLE" | "FULL_SITE">("SINGLE");
  const [maxPages, setMaxPages] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setUrl("");
    setName("");
    setDescription("");
    setScrapeMode("SINGLE");
    setMaxPages(100);
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/knowledge/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          scrapeMode,
          maxPages: scrapeMode === "FULL_SITE" ? maxPages : 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to add link");
        return;
      }

      toast.success(
        scrapeMode === "FULL_SITE"
          ? "Site added — crawling in progress"
          : "Link added — scraping in progress"
      );
      reset();
      onOpenChange(false);
      onComplete();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/docs"
              type="url"
            />
          </div>

          {/* Scrape mode toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs">Scrape Mode</Label>
            <div className="flex rounded-lg border p-0.5 bg-muted/50">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  scrapeMode === "SINGLE"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setScrapeMode("SINGLE")}
              >
                <Link2 className="h-3 w-3" />
                Single Page
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  scrapeMode === "FULL_SITE"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setScrapeMode("FULL_SITE")}
              >
                <Globe className="h-3 w-3" />
                Full Site
              </button>
            </div>
          </div>

          {/* Max pages (only for full site) */}
          {scrapeMode === "FULL_SITE" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Max Pages</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {maxPages}
                </span>
              </div>
              <Slider
                value={[maxPages]}
                onValueChange={(val) =>
                  setMaxPages(Array.isArray(val) ? val[0] : val)
                }
                min={10}
                max={500}
                step={10}
              />
              <p className="text-[10px] text-muted-foreground">
                Crawl up to {maxPages} pages under this URL
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-detected from page title"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this page about?"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Adding...
              </>
            ) : scrapeMode === "FULL_SITE" ? (
              <>
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Add & Crawl Site
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Add Link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
