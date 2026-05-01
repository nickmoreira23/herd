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
import { useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import {
  LINK_SCRAPE_MODES,
  linkScrapeModeLabelKey,
  type LinkScrapeMode,
} from "@/lib/links/scrape-modes";

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const SCRAPE_MODE_ICONS: Record<LinkScrapeMode, typeof Link2> = {
  SINGLE: Link2,
  FULL_SITE: Globe,
};

export function AddLinkModal({
  open,
  onOpenChange,
  onComplete,
}: AddLinkModalProps) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scrapeMode, setScrapeMode] = useState<LinkScrapeMode>("SINGLE");
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
      notifyError("error.links.url_required", t);
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      notifyError("error.links.invalid_url", t);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/links", {
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
        notifyError("error.links.add_failed", t);
        return;
      }

      notifySuccess(
        scrapeMode === "FULL_SITE"
          ? "links.feedback.added_crawling"
          : "links.feedback.added_scraping",
        t,
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
          <DialogTitle>{t("links.add_modal.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("links.add_modal.url.label")}</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("links.add_modal.url.placeholder")}
              type="url"
            />
          </div>

          {/* Scrape mode toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("links.add_modal.scrape_mode.label")}
            </Label>
            <div className="flex rounded-lg border p-0.5 bg-muted/50">
              {LINK_SCRAPE_MODES.map((value) => {
                const Icon = SCRAPE_MODE_ICONS[value];
                return (
                  <button
                    key={value}
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      scrapeMode === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setScrapeMode(value)}
                  >
                    <Icon className="h-3 w-3" />
                    {t(linkScrapeModeLabelKey(value))}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max pages (only for full site) */}
          {scrapeMode === "FULL_SITE" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  {t("links.add_modal.max_pages.label")}
                </Label>
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
                {t("links.add_modal.max_pages.help", { count: maxPages })}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">{t("links.add_modal.name.label")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("links.add_modal.name.placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("links.add_modal.description.label")}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("links.add_modal.description.placeholder")}
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
                {t("links.add_modal.submit.adding")}
              </>
            ) : scrapeMode === "FULL_SITE" ? (
              <>
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                {t("links.add_modal.submit.add_and_crawl")}
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                {t("links.add_modal.submit.add_link")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
