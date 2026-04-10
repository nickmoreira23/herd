"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RotateCcw,
  X,
  Loader2,
  Send,
  MessageSquare,
} from "lucide-react";
import {
  usePackageWizardStore,
  type AnalysisRecommendation,
} from "@/stores/package-wizard-store";

interface StepAnalysisProps {
  onNext: () => void;
  onBack: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-600",
};

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

export function StepAnalysis({ onNext, onBack }: StepAnalysisProps) {
  const {
    packageId,
    fitnessGoal,
    customGoalDescription,
    preferences,
    creationPath,
    analysisRecommendations,
    aiAnalysisRun,
    setAnalysisRecommendations,
    setAiAnalysisRun,
  } = usePackageWizardStore();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
  const [refineOpen, setRefineOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const autoTriggered = useRef(false);

  const visibleRecs = analysisRecommendations.filter(
    (_, i) => !removedIndices.has(i)
  );

  const runAnalysis = useCallback(
    async (opts?: {
      feedback?: string;
      previousRecs?: AnalysisRecommendation[];
    }) => {
      if (!packageId) return;

      setLoading(true);
      setStatus("Starting analysis...");
      setError(null);
      setRemovedIndices(new Set());

      try {
        const body: Record<string, unknown> = {
          fitnessGoal,
          customGoalDescription: fitnessGoal === "CUSTOM" ? customGoalDescription : undefined,
          mode: "analysis",
          preferences,
        };
        if (opts?.feedback && opts.previousRecs) {
          body.feedback = opts.feedback;
          body.previousRecommendations = opts.previousRecs;
        }

        const res = await fetch(`/api/packages/${packageId}/ai-suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || "Analysis failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                switch (eventType) {
                  case "status":
                    setStatus(data.message);
                    break;
                  case "recommendations": {
                    const recs: AnalysisRecommendation[] =
                      data.recommendations || [];
                    setAnalysisRecommendations(recs);
                    break;
                  }
                  case "error":
                    setError(data.message);
                    break;
                  case "done":
                    break;
                }
              } catch {
                // malformed JSON, skip
              }
              eventType = "";
            }
          }
        }

        setAiAnalysisRun(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
        setStatus("");
      }
    },
    [
      packageId,
      fitnessGoal,
      customGoalDescription,
      preferences,
      setAnalysisRecommendations,
      setAiAnalysisRun,
    ]
  );

  // Auto-trigger in co-pilot mode on first mount
  useEffect(() => {
    if (
      creationPath === "copilot" &&
      !aiAnalysisRun &&
      !autoTriggered.current
    ) {
      autoTriggered.current = true;
      runAnalysis();
    }
  }, [creationPath, aiAnalysisRun, runAnalysis]);

  function removeRecommendation(idx: number) {
    setRemovedIndices((prev) => new Set([...prev, idx]));
  }

  function handleRefineSubmit() {
    if (!feedbackText.trim()) return;
    const fb = feedbackText.trim();
    setFeedbackText("");
    setRefineOpen(false);
    runAnalysis({ feedback: fb, previousRecs: visibleRecs });
  }

  function handleNext() {
    setAnalysisRecommendations(visibleRecs);
    onNext();
  }

  const totalBudget = visibleRecs.reduce((sum, r) => sum + r.budgetPercent, 0);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Fitness Specialist Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Our AI nutritionist analyzes the best product types based on your
            goal and category preferences. Review, adjust, or give feedback
            before we select specific products.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="py-8 flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#C5F135]/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#C5F135] animate-pulse" />
              </div>
              <p className="text-sm font-medium">{status || "Analyzing..."}</p>
              <p className="text-xs text-muted-foreground">
                AI is analyzing your fitness goal and category preferences to
                recommend the ideal product mix
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => runAnalysis()}
              className="ml-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Recommendations list */}
        {!loading && visibleRecs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Recommended Product Types ({visibleRecs.length})
              </p>
              <p className="text-sm text-muted-foreground">
                {totalBudget}% budget allocated
              </p>
            </div>

            {analysisRecommendations.map((rec, i) => {
              if (removedIndices.has(i)) return null;

              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{rec.type}</p>
                      <Badge
                        variant="secondary"
                        className={PRIORITY_COLORS[rec.priority] || ""}
                      >
                        {rec.priority}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[rec.category] || ""}
                      >
                        {rec.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {rec.budgetPercent}% budget
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rec.reasoning}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => removeRecommendation(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {/* Action buttons — Start Over and Refine as separate buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => runAnalysis()}
                className="gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Start Over
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefineOpen(true)}
                className="gap-1.5"
              >
                <MessageSquare className="h-3 w-3" />
                Refine
              </Button>
            </div>
          </div>
        )}

        {/* Empty state for manual mode before triggering */}
        {!loading && !error && visibleRecs.length === 0 && !aiAnalysisRun && (
          <div className="text-center py-10 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Ready to analyze your fitness goal
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Run the AI analysis to get product type recommendations based on
                your goal and preferences.
              </p>
            </div>
            <Button onClick={() => runAnalysis()} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Run Analysis
            </Button>
          </div>
        )}

        {/* All removed state */}
        {!loading && !error && visibleRecs.length === 0 && aiAnalysisRun && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              All recommendations removed. You can re-run the analysis or
              continue to select products manually.
            </p>
            <Button
              variant="outline"
              onClick={() => runAnalysis()}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-run Analysis
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          Next: Package
        </Button>
      </div>

      {/* Refine modal */}
      <Dialog open={refineOpen} onOpenChange={setRefineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refine Recommendations</DialogTitle>
            <DialogDescription>
              Describe what you&apos;d like changed. The fitness specialist will
              adjust the recommendations based on your feedback.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRefineSubmit();
              }
            }}
            placeholder='e.g. "Drop the shaker, add more apparel instead" or "I want more protein options"'
            className="w-full text-sm bg-background rounded-md border border-border px-3 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefineOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefineSubmit}
              disabled={!feedbackText.trim()}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Refine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
