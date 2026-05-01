"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Clock, CalendarDays, CalendarRange, X, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import {
  FEED_SYNC_INTERVALS,
  feedSyncIntervalLabelKey,
  type FeedSyncInterval,
} from "@/lib/feeds/sync-intervals";
import type { RSSFeedRow } from "./types";

interface FeedSettingsDialogProps {
  feed: RSSFeedRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const FREQUENCY_ICONS: Record<FeedSyncInterval, typeof Clock> = {
  HOURLY: Clock,
  DAILY: CalendarDays,
  WEEKLY: CalendarRange,
};

export function FeedSettingsDialog({
  feed,
  open,
  onOpenChange,
  onSave,
}: FeedSettingsDialogProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<FeedSyncInterval>("DAILY");
  const [instructions, setInstructions] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [maxEntriesPerSync, setMaxEntriesPerSync] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (feed && open) {
      setName(feed.name);
      setFrequency(feed.frequency as FeedSyncInterval);
      setInstructions(feed.instructions || "");
      setIncludeKeywords([...feed.includeKeywords]);
      setExcludeKeywords([...feed.excludeKeywords]);
      setMaxEntriesPerSync(feed.maxEntriesPerSync);
      setIncludeInput("");
      setExcludeInput("");
    }
  }, [feed, open]);

  if (!feed) return null;

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

  async function handleSave() {
    if (!feed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          frequency,
          instructions: instructions.trim() || null,
          includeKeywords,
          excludeKeywords,
          maxEntriesPerSync,
        }),
      });

      if (res.ok) {
        notifySuccess("feeds.feedback.settings_saved", t);
        onOpenChange(false);
        onSave();
      } else {
        notifyError("error.feeds.save_failed", t);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("feeds.settings_dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("feeds.settings_dialog.name.label")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("feeds.settings_dialog.frequency.label")}
            </Label>
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

          {/* Agent Instructions */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <Label className="text-xs font-medium">
                {t("feeds.settings_dialog.instructions.label")}
              </Label>
            </div>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("feeds.settings_dialog.instructions.placeholder")}
              rows={3}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("feeds.settings_dialog.instructions.help")}
            </p>
          </div>

          {/* Include keywords */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("feeds.settings_dialog.include_keywords.label")}
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
                        setIncludeKeywords(includeKeywords.filter((k) => k !== kw))
                      }
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exclude keywords */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("feeds.settings_dialog.exclude_keywords.label")}
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
                        setExcludeKeywords(excludeKeywords.filter((k) => k !== kw))
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
                {t("feeds.settings_dialog.max_articles.label")}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("feeds.settings_dialog.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {t("feeds.settings_dialog.saving")}
              </>
            ) : (
              t("feeds.settings_dialog.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
