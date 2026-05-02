"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rss, Clock, CalendarDays, CalendarRange, Loader2, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import {
  FEED_SYNC_INTERVALS,
  feedSyncIntervalLabelKey,
  type FeedSyncInterval,
} from "@/lib/feeds/sync-intervals";

interface AddFeedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const FREQUENCY_ICONS: Record<FeedSyncInterval, typeof Clock> = {
  HOURLY: Clock,
  DAILY: CalendarDays,
  WEEKLY: CalendarRange,
};

export function AddFeedModal({
  open,
  onOpenChange,
  onComplete,
}: AddFeedModalProps) {
  const t = useT();
  const [feedUrl, setFeedUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<FeedSyncInterval>("DAILY");
  const [instructions, setInstructions] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [maxEntriesPerSync, setMaxEntriesPerSync] = useState(20);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFeedUrl("");
    setName("");
    setDescription("");
    setFrequency("DAILY");
    setInstructions("");
    setIncludeKeywords([]);
    setExcludeKeywords([]);
    setIncludeInput("");
    setExcludeInput("");
    setMaxEntriesPerSync(20);
    setShowAdvanced(false);
    setSubmitting(false);
  }

  function handleKeywordAdd(
    e: KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (v: string) => void,
    keywords: string[],
    setKeywords: (v: string[]) => void
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim().replace(/,+$/, "");
      if (trimmed && !keywords.includes(trimmed) && keywords.length < 20) {
        setKeywords([...keywords, trimmed]);
        setInput("");
      }
    }
  }

  function removeKeyword(
    keyword: string,
    keywords: string[],
    setKeywords: (v: string[]) => void
  ) {
    setKeywords(keywords.filter((k) => k !== keyword));
  }

  async function handleSubmit() {
    if (!feedUrl.trim()) {
      notifyError("error.feeds.url_required", t);
      return;
    }

    try {
      new URL(feedUrl.trim());
    } catch {
      notifyError("error.feeds.invalid_url", t);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedUrl: feedUrl.trim(),
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          frequency,
          instructions: instructions.trim() || undefined,
          includeKeywords,
          excludeKeywords,
          maxEntriesPerSync,
        }),
      });

      if (!res.ok) {
        notifyError("error.feeds.add_failed", t);
        return;
      }

      notifySuccess("feeds.feedback.added", t);
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("feeds.add_modal.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Feed URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("feeds.add_modal.feed_url.label")}</Label>
            <Input
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder={t("feeds.add_modal.feed_url.placeholder")}
              type="url"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("feeds.add_modal.feed_url.help")}
            </p>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("feeds.add_modal.frequency.label")}</Label>
            <div className="flex rounded-lg border p-0.5 bg-muted/50">
              {FEED_SYNC_INTERVALS.map((value) => {
                const Icon = FREQUENCY_ICONS[value];
                return (
                  <button
                    key={value}
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      frequency === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setFrequency(value)}
                  >
                    <Icon className="h-3 w-3" />
                    {t(feedSyncIntervalLabelKey(value))}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Instructions — primary filter */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <Label className="text-xs font-medium">
                {t("feeds.add_modal.instructions.label")}
              </Label>
            </div>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("feeds.add_modal.instructions.placeholder")}
              rows={4}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("feeds.add_modal.instructions.help")}
            </p>
          </div>

          {/* Advanced section toggle */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {t("feeds.add_modal.advanced.toggle")}
            {(includeKeywords.length > 0 || excludeKeywords.length > 0) && (
              <Badge variant="outline" className="text-[10px] ml-1 px-1.5 py-0">
                {t("feeds.add_modal.advanced.keyword_count", {
                  count: includeKeywords.length + excludeKeywords.length,
                })}
              </Badge>
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pl-2 border-l-2 border-muted">
              {/* Include keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t("feeds.add_modal.include_keywords.label")}
                </Label>
                <Input
                  value={includeInput}
                  onChange={(e) => setIncludeInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeywordAdd(
                      e,
                      includeInput,
                      setIncludeInput,
                      includeKeywords,
                      setIncludeKeywords
                    )
                  }
                  placeholder={t("feeds.add_modal.include_keywords.placeholder")}
                />
                {includeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {includeKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() =>
                            removeKeyword(kw, includeKeywords, setIncludeKeywords)
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {t("feeds.add_modal.include_keywords.help")}
                </p>
              </div>

              {/* Exclude keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t("feeds.add_modal.exclude_keywords.label")}
                </Label>
                <Input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeywordAdd(
                      e,
                      excludeInput,
                      setExcludeInput,
                      excludeKeywords,
                      setExcludeKeywords
                    )
                  }
                  placeholder={t("feeds.add_modal.exclude_keywords.placeholder")}
                />
                {excludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {excludeKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-xs bg-red-500/10 text-red-500 border-red-500/20 gap-1"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() =>
                            removeKeyword(kw, excludeKeywords, setExcludeKeywords)
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Max entries */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {t("feeds.add_modal.max_articles.label")}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {maxEntriesPerSync}
                  </span>
                </div>
                <Slider
                  value={[maxEntriesPerSync]}
                  onValueChange={(val) =>
                    setMaxEntriesPerSync(Array.isArray(val) ? val[0] : val)
                  }
                  min={1}
                  max={50}
                  step={1}
                />
              </div>

              {/* Name (optional) */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("feeds.add_modal.name.label")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("feeds.add_modal.name.placeholder")}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t("feeds.add_modal.description.label")}
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("feeds.add_modal.description.placeholder")}
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !feedUrl.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {t("feeds.add_modal.submit.adding")}
              </>
            ) : (
              <>
                <Rss className="h-3.5 w-3.5 mr-1.5" />
                {t("feeds.add_modal.submit.add")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
