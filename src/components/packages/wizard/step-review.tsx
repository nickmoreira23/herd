"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { CreditBudgetBar } from "../credit-budget-bar";
import { usePackageWizardStore } from "@/stores/package-wizard-store";
import {
  computeTierFinancials,
  formatCurrency,
} from "@/lib/package-financials";

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  PERFORMANCE: "Performance",
  ENDURANCE: "Endurance",
  GENERAL_WELLNESS: "General Wellness",
  RECOVERY: "Recovery",
  STRENGTH: "Strength",
  BODY_RECOMP: "Body Recomp",
  CUSTOM: "Custom",
};

const GOAL_COLORS: Record<string, string> = {
  WEIGHT_LOSS: "bg-red-100 text-red-800",
  MUSCLE_GAIN: "bg-blue-100 text-blue-800",
  PERFORMANCE: "bg-purple-100 text-purple-800",
  ENDURANCE: "bg-green-100 text-green-800",
  GENERAL_WELLNESS: "bg-amber-100 text-amber-800",
  RECOVERY: "bg-teal-100 text-teal-800",
  STRENGTH: "bg-orange-100 text-orange-800",
  BODY_RECOMP: "bg-cyan-100 text-cyan-800",
  CUSTOM: "bg-zinc-100 text-zinc-800",
};

interface StepReviewProps {
  onBack: () => void;
  goToStep: (step: number) => void;
}

export function StepReview({ onBack, goToStep }: StepReviewProps) {
  const router = useRouter();
  const {
    packageId,
    name,
    fitnessGoal,
    description,
    imageUrl,
    tiers,
    tierProducts,
    isSubmitting,
    setIsSubmitting,
    setActiveTier,
  } = usePackageWizardStore();

  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [savingStatus, setSavingStatus] = useState("");

  // Stats
  const totalProducts = tiers.reduce(
    (sum, t) => sum + (tierProducts[t.id]?.products.length ?? 0),
    0
  );
  const configuredCount = tiers.filter(
    (t) => (tierProducts[t.id]?.products.length ?? 0) > 0
  ).length;
  const avgUtilization =
    tiers.length > 0
      ? tiers.reduce((sum, t) => {
          const used = tierProducts[t.id]?.totalCreditsUsed ?? 0;
          return sum + (t.monthlyCredits > 0 ? (used / t.monthlyCredits) * 100 : 0);
        }, 0) / tiers.length
      : 0;

  const tierFinancials = tiers.map((t) => ({
    tierId: t.id,
    tierName: t.name,
    fin: computeTierFinancials(tierProducts[t.id]?.products ?? [], t),
  }));
  const lossTiers = tierFinancials.filter((t) => t.fin.healthStatus === "loss");

  function toggleExpand(tierId: string) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      return next;
    });
  }

  function editTier(tierId: string) {
    setActiveTier(tierId);
    goToStep(5);
  }

  async function handlePublish() {
    if (!packageId) return;

    setIsSubmitting(true);
    try {
      // Save products for each tier that has them
      for (const tier of tiers) {
        const state = tierProducts[tier.id];
        if (!state || state.products.length === 0) continue;

        setSavingStatus(`Saving ${tier.name}...`);

        const res = await fetch(
          `/api/packages/${packageId}/variants/${tier.id}/products`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              products: state.products.map((p) => ({
                productId: p.productId,
                quantity: p.quantity,
                creditCost: p.creditCost,
              })),
            }),
          }
        );

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(
            json?.error || `Failed to save ${tier.name} products`
          );
        }
      }

      // Persist identity (name, description, image)
      setSavingStatus("Finalizing...");
      await fetch(`/api/packages/${packageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description?.trim() || null,
          imageUrl,
        }),
      });

      toast.success("Package created successfully!");
      router.push(`/admin/program/packages/${packageId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create package"
      );
    } finally {
      setIsSubmitting(false);
      setSavingStatus("");
    }
  }

  return (
    <div className="space-y-6">
      {lossTiers.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-red-800">
              {lossTiers.length} tier{lossTiers.length === 1 ? "" : "s"} will
              lose money at 100% redemption
            </div>
            <div className="text-red-700 mt-1">
              {lossTiers
                .map(
                  (t) =>
                    `${t.tierName} (${formatCurrency(t.fin.profitPerSubscriber)}/mo)`
                )
                .join(", ")}
              . You can still publish — review the product mix or tier price
              first.
            </div>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{name}</h2>
              <Badge className={GOAL_COLORS[fitnessGoal]}>
                {GOAL_LABELS[fitnessGoal]}
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(6)}
            className="shrink-0"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit Identity
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Tiers</p>
            <p className="text-lg font-semibold">
              {configuredCount}
              <span className="text-sm font-normal text-muted-foreground">
                /{tiers.length}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-lg font-semibold">{totalProducts}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
            <p className="text-lg font-semibold">
              {avgUtilization.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tier Breakdown
        </h3>

        {tiers.map((tier) => {
          const state = tierProducts[tier.id];
          const products = state?.products ?? [];
          const totalUsed = state?.totalCreditsUsed ?? 0;
          const isExpanded = expandedTiers.has(tier.id);
          const isEmpty = products.length === 0;
          const isOverBudget = totalUsed > tier.monthlyCredits;
          const fin = computeTierFinancials(products, tier);

          return (
            <Card
              key={tier.id}
              className="overflow-hidden"
              style={{ borderLeftColor: tier.colorAccent, borderLeftWidth: 3 }}
            >
              <CardContent className="p-4 space-y-3">
                {/* Tier header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{tier.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      ${tier.monthlyPrice}/mo
                    </Badge>
                    {isEmpty && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-yellow-100 text-yellow-700 gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Empty
                      </Badge>
                    )}
                    {isOverBudget && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-red-100 text-red-700 gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Over budget
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editTier(tier.id)}
                    className="text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>

                {/* Compact budget bar */}
                <CreditBudgetBar
                  used={totalUsed}
                  budget={tier.monthlyCredits}
                />

                {/* Profit summary */}
                {!isEmpty && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground">
                      Profit / subscriber
                    </span>
                    <span
                      className={
                        fin.profitPerSubscriber < 0
                          ? "font-semibold text-red-600"
                          : fin.healthStatus === "tight"
                            ? "font-semibold text-amber-700"
                            : "font-semibold text-emerald-700"
                      }
                    >
                      {formatCurrency(fin.profitPerSubscriber)} /mo
                      <span className="text-muted-foreground font-normal ml-2">
                        ({fin.grossMarginPct.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                )}

                {/* Product list (collapsible) */}
                {products.length > 0 && (
                  <div>
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => toggleExpand(tier.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {products.length} product
                      {products.length !== 1 ? "s" : ""}
                      {!isExpanded &&
                        products.length > 3 &&
                        ` (showing 3 of ${products.length})`}
                    </button>

                    <div className="mt-2 space-y-1">
                      {(isExpanded ? products : products.slice(0, 3)).map(
                        (p) => (
                          <div
                            key={p.productId}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{p.name}</span>
                              {p.quantity > 1 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] shrink-0"
                                >
                                  x{p.quantity}
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              ${(p.creditCost * p.quantity).toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                      {!isExpanded && products.length > 3 && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => toggleExpand(tier.id)}
                        >
                          Show all {products.length} products
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isEmpty && (
                  <p className="text-xs text-muted-foreground">
                    No products configured. You can add products later from the
                    package detail page.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handlePublish}
          disabled={isSubmitting}
          className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {savingStatus || "Saving..."}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Package
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
