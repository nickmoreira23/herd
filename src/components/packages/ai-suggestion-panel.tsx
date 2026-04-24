"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { PriceBreakdown } from "./price-breakdown";

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

export function AiSuggestionPanel({
  packageId,
  subscriptionTierId,
  fitnessGoal,
  onAcceptProducts,
}: AiSuggestionPanelProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const runSuggestion = useCallback(async () => {
    setLoading(true);
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
          mode: "products",
          ...(instruction.trim() ? { feedback: instruction.trim() } : {}),
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
                  setSelected(new Set(sugs.map((s: Suggestion) => s.productId)));
                  break;
                }
                case "error":
                  setError(data.message);
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
  }, [packageId, subscriptionTierId, fitnessGoal, instruction]);

  function toggleSelection(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function handleAccept() {
    const acceptedProducts = suggestions
      .filter((s) => selected.has(s.productId))
      .map((s) => ({
        productId: s.productId,
        name: s.productName,
        quantity: s.quantity,
        creditCost: s.creditCost,
      }));
    onAcceptProducts(acceptedProducts);
    setAccepted(true);
    setSuggestions([]);
    setSelected(new Set());
    setOpen(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v && loading) return; // prevent closing while loading
    setOpen(v);
    if (!v) {
      // reset on close so next open is fresh
      setSuggestions([]);
      setSelected(new Set());
      setError(null);
      setStatus("");
      setAccepted(false);
    }
  }

  const totalSelected = suggestions
    .filter((s) => selected.has(s.productId))
    .reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Suggestion
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6 pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C5F135]" />
              AI Product Suggestion
            </DialogTitle>
            <DialogDescription>
              Describe the changes or additions you&apos;d like, or leave blank to let AI suggest based on the fitness goal and remaining budget.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Instruction input — only show when not yet loading/showing results */}
            {!loading && suggestions.length === 0 && !error && (
              <div className="px-6 pb-4 space-y-3 shrink-0">
                <Textarea
                  placeholder="e.g. Add more recovery products, swap supplements for apparel, focus on protein only..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="resize-none h-24"
                />
                <Button onClick={runSuggestion} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Suggestions
                </Button>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
                <div className="h-10 w-10 rounded-xl bg-[#C5F135]/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#C5F135] animate-pulse" />
                </div>
                <p className="text-sm font-medium">{status || "Analyzing..."}</p>
                <p className="text-xs text-muted-foreground">
                  Product specialist is selecting the best products for this tier
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-6 mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg shrink-0">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setError(null); setSuggestions([]); }}
                  className="ml-2"
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Suggestions list */}
            {!loading && suggestions.length > 0 && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between px-6 py-2 shrink-0 border-t border-b bg-muted/30">
                  <p className="text-sm font-medium">
                    Product Recommendations ({suggestions.length})
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Selected: ${totalSelected.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSuggestions([]); setError(null); }}
                      className="gap-1 text-muted-foreground h-7"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Re-run
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
                  {suggestions.map((s) => (
                    <div
                      key={s.productId}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        selected.has(s.productId)
                          ? "border-primary/30 bg-primary/5"
                          : "border-zinc-200"
                      }`}
                      onClick={() => toggleSelection(s.productId)}
                    >
                      <button
                        className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          selected.has(s.productId)
                            ? "bg-primary border-primary text-white"
                            : "border-zinc-300"
                        }`}
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
                        <div className="text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                          <p className="text-sm font-medium">${s.totalCost.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">${s.creditCost.toFixed(2)}/ea</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-6 py-4 border-t shrink-0">
                  <Button onClick={handleAccept} disabled={selected.size === 0} className="gap-1.5">
                    <Check className="h-4 w-4" />
                    Accept Selected ({selected.size})
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
