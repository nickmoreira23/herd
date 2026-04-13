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
import { toast } from "sonner";

interface AddFeedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type Frequency = "HOURLY" | "DAILY" | "WEEKLY";

const FREQUENCY_OPTIONS: { value: Frequency; label: string; icon: typeof Clock }[] = [
  { value: "HOURLY", label: "Hourly", icon: Clock },
  { value: "DAILY", label: "Daily", icon: CalendarDays },
  { value: "WEEKLY", label: "Weekly", icon: CalendarRange },
];

export function AddFeedModal({
  open,
  onOpenChange,
  onComplete,
}: AddFeedModalProps) {
  const [feedUrl, setFeedUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
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
      toast.error("Feed URL is required");
      return;
    }

    try {
      new URL(feedUrl.trim());
    } catch {
      toast.error("Please enter a valid URL");
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
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to add feed");
        return;
      }

      toast.success("Feed added — syncing articles");
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
          <DialogTitle>Add RSS Feed</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Feed URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">Feed URL</Label>
            <Input
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://blog.example.com/rss.xml"
              type="url"
            />
            <p className="text-[10px] text-muted-foreground">
              RSS or Atom feed URL. Blog URLs with feed auto-discovery also work.
            </p>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs">Check Frequency</Label>
            <div className="flex rounded-lg border p-0.5 bg-muted/50">
              {FREQUENCY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      frequency === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setFrequency(opt.value)}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Instructions — primary filter */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <Label className="text-xs font-medium">Agent Instructions</Label>
            </div>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe what you're looking for in natural language. For example: 'I'm interested in fitness apps, startups that have raised money, new product launches, and anything related to health tech AI.'"
              rows={4}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              An AI agent will read each article&apos;s title, summary, and categories to decide if it matches your intent. Be descriptive — the more context you give, the better the results.
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
            Advanced Filters & Options
            {(includeKeywords.length > 0 || excludeKeywords.length > 0) && (
              <Badge variant="outline" className="text-[10px] ml-1 px-1.5 py-0">
                {includeKeywords.length + excludeKeywords.length} keywords
              </Badge>
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pl-2 border-l-2 border-muted">
              {/* Include keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs">Include Keywords (optional)</Label>
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
                  placeholder="Type keyword and press Enter"
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
                  Pre-filter by keyword before AI evaluation. Articles must match at least one keyword to be considered.
                </p>
              </div>

              {/* Exclude keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs">Exclude Keywords (optional)</Label>
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
                  placeholder="Type keyword and press Enter"
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
                  <Label className="text-xs">Max Articles Per Sync</Label>
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
                <Label className="text-xs">Name (optional)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Auto-detected from feed"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this feed about?"
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
                Adding...
              </>
            ) : (
              <>
                <Rss className="h-3.5 w-3.5 mr-1.5" />
                Add Feed
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
