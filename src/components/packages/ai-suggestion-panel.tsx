"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { PriceBreakdown } from "./price-breakdown";

interface Recommendation {
  type: string;
  category: string;
  priority: string;
  budgetPercent: number;
  reasoning: string;
}

interface Suggestion {
  productId: string;
  productName: string;
  quantity: number;
  creditCost: number;
  totalCost: number;
  reasoning: string;
  matchedType: string;
  memberPrice?: number;
  discountPercent?: number;
}

interface AiSuggestionPanelProps {
  packageId: string;
  subscriptionTierId: string;
  fitnessGoal: string;
  onAcceptProducts: (
    products: { productId: string; name: string; quantity: number; creditCost: number }[]
  ) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-600",
};

export function AiSuggestionPanel({
  packageId,
  subscriptionTierId,
  fitnessGoal,
  onAcceptProducts,
}: AiSuggestionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRecs, setShowRecs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSuggestion = useCallback(async () => {
    setLoading(true);
    setStatus("Starting AI analysis...");
    setRecommendations([]);
    setSuggestions([]);
    setSelected(new Set());
    setError(null);

    try {
      const res = await fetch(`/api/packages/${packageId}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTierId, fitnessGoal }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "AI suggestion failed");
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
                case "recommendations":
                  setRecommendations(data.recommendations || []);
                  break;
                case "suggestions": {
                  const sugs = data.suggestions || [];
                  setSuggestions(sugs);
                  setSelected(new Set(sugs.map((s: Suggestion) => s.productId)));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }, [packageId, subscriptionTierId, fitnessGoal]);

  function toggleSelection(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function handleAccept() {
    const accepted = suggestions
      .filter((s) => selected.has(s.productId))
      .map((s) => ({
        productId: s.productId,
        name: s.productName,
        quantity: s.quantity,
        creditCost: s.creditCost,
      }));
    onAcceptProducts(accepted);
    setSuggestions([]);
    setRecommendations([]);
    setSelected(new Set());
  }

  const totalSelected = suggestions
    .filter((s) => selected.has(s.productId))
    .reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={runSuggestion}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? status || "Analyzing..." : "AI Suggest"}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Agent 1 recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent className="pt-3 pb-3">
            <button
              className="flex items-center gap-2 text-sm font-medium w-full"
              onClick={() => setShowRecs(!showRecs)}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Fitness Specialist Analysis
              {showRecs ? (
                <ChevronUp className="h-3.5 w-3.5 ml-auto" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-auto" />
              )}
            </button>
            {showRecs && (
              <div className="mt-3 space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-zinc-50"
                  >
                    <Badge
                      variant="secondary"
                      className={PRIORITY_COLORS[rec.priority] || ""}
                    >
                      {rec.priority}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {rec.type}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({rec.budgetPercent}% budget)
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {rec.reasoning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent 2 suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Product Recommendations ({suggestions.length})
            </p>
            <p className="text-sm text-muted-foreground">
              Selected: ${totalSelected.toFixed(2)}
            </p>
          </div>

          {suggestions.map((s) => (
            <div
              key={s.productId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selected.has(s.productId)
                  ? "border-primary/30 bg-primary/5"
                  : "border-zinc-200"
              }`}
            >
              <button
                className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                  selected.has(s.productId)
                    ? "bg-primary border-primary text-white"
                    : "border-zinc-300"
                }`}
                onClick={() => toggleSelection(s.productId)}
              >
                {selected.has(s.productId) && <Check className="h-3 w-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{s.productName}</p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    x{s.quantity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.reasoning}
                </p>
                <p className="text-xs text-muted-foreground">
                  Matches: {s.matchedType}
                </p>
              </div>

              {s.memberPrice && s.discountPercent ? (
                <PriceBreakdown
                  memberPrice={s.memberPrice}
                  creditCost={s.creditCost}
                  discountPercent={s.discountPercent}
                  quantity={s.quantity}
                />
              ) : (
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">${s.totalCost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ${s.creditCost.toFixed(2)}/ea
                  </p>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={handleAccept} disabled={selected.size === 0}>
              <Check className="h-4 w-4 mr-1" />
              Accept Selected ({selected.size})
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSuggestions([]);
                setRecommendations([]);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
