"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Check,
  X,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import {
  usePackageWizardStore,
  type LocalProduct,
  type Preferences,
  type AnalysisRecommendation,
} from "@/stores/package-wizard-store";
import { PriceBreakdown } from "../price-breakdown";

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
  imageUrl?: string | null;
  category?: string | null;
}

interface WizardAiPanelProps {
  packageId: string;
  subscriptionTierId: string;
  fitnessGoal: string;
  customGoalDescription?: string;
  preferences?: Preferences;
  recommendations?: AnalysisRecommendation[];
  autoTrigger?: boolean;
}

export function WizardAiPanel({
  packageId,
  subscriptionTierId,
  fitnessGoal,
  customGoalDescription,
  preferences,
  recommendations,
  autoTrigger,
}: WizardAiPanelProps) {
  const { addProduct, markAiRun, setTierAiLoading, tierProducts } =
    usePackageWizardStore();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const autoTriggered = useRef(false);

  const tierState = tierProducts[subscriptionTierId];
  const hasRun = tierState?.aiRun ?? false;

  const runSuggestion = useCallback(async () => {
    setLoading(true);
    setTierAiLoading(subscriptionTierId, true);
    setStatus("Matching products from catalog...");
    setSuggestions([]);
    setSelected(new Set());
    setError(null);
    setAccepted(false);

    try {
      const res = await fetch(`/api/packages/${packageId}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTierId,
          fitnessGoal,
          customGoalDescription: fitnessGoal === "CUSTOM" ? customGoalDescription : undefined,
          mode: "products",
          preferences,
          recommendations,
        }),
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
                case "suggestions": {
                  const sugs = data.suggestions || [];
                  setSuggestions(sugs);
                  setSelected(
                    new Set(sugs.map((s: Suggestion) => s.productId))
                  );
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

      markAiRun(subscriptionTierId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setLoading(false);
      setTierAiLoading(subscriptionTierId, false);
      setStatus("");
    }
  }, [packageId, subscriptionTierId, fitnessGoal, customGoalDescription, preferences, recommendations, markAiRun, setTierAiLoading]);

  // Auto-trigger on mount if requested and not already run
  useEffect(() => {
    if (autoTrigger && !hasRun && !autoTriggered.current) {
      autoTriggered.current = true;
      runSuggestion();
    }
  }, [autoTrigger, hasRun, runSuggestion]);

  function toggleSelection(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function handleAccept() {
    const acceptedSuggestions = suggestions.filter((s) =>
      selected.has(s.productId)
    );
    for (const s of acceptedSuggestions) {
      const product: LocalProduct = {
        productId: s.productId,
        name: s.productName,
        sku: "",
        category: s.category || "",
        subCategory: null,
        imageUrl: s.imageUrl || null,
        memberPrice: s.memberPrice || s.creditCost,
        retailPrice: s.memberPrice || s.creditCost,
        quantity: s.quantity,
        creditCost: s.creditCost,
      };
      addProduct(subscriptionTierId, product);
    }
    setAccepted(true);
    setSuggestions([]);
    setSelected(new Set());
  }

  const totalSelected = suggestions
    .filter((s) => selected.has(s.productId))
    .reduce((sum, s) => sum + s.totalCost, 0);

  // Accepted state — show re-run option
  if (accepted && !loading && suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 gap-1"
        >
          <Check className="h-3 w-3" />
          AI suggestions accepted
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={runSuggestion}
          className="gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Re-run
        </Button>
      </div>
    );
  }

  // Idle state after dismiss or initial — show trigger button
  if (!loading && !error && suggestions.length === 0 && !accepted) {
    // If hasRun but was dismissed, or if manual mode before first trigger
    if (hasRun) {
      return (
        <div className="flex items-center gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runSuggestion}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Suggestion
          </Button>
          <span className="text-xs text-muted-foreground">
            Generate new product recommendations
          </span>
        </div>
      );
    }
    // Not yet run and not auto-triggering — nothing to show
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#C5F135]/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#C5F135] animate-pulse" />
            </div>
            <p className="text-sm font-medium">{status || "Analyzing..."}</p>
            <p className="text-xs text-muted-foreground">
              Product specialist is selecting the best products for this tier
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={runSuggestion}
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Product suggestions */}
      {!loading && suggestions.length > 0 && (
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
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                selected.has(s.productId)
                  ? "border-primary/30 bg-primary/5"
                  : "border-zinc-200"
              }`}
            >
              <button
                className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(s.productId)
                    ? "bg-primary border-primary text-white"
                    : "border-zinc-300"
                }`}
                onClick={() => toggleSelection(s.productId)}
              >
                {selected.has(s.productId) && <Check className="h-3 w-3" />}
              </button>

              {/* Product image */}
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.productName}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {s.productName}
                  </p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    x{s.quantity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {s.reasoning}
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
                  <p className="text-sm font-medium">
                    ${s.totalCost.toFixed(2)}
                  </p>
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
