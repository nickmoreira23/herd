"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Eye,
  Pencil,
} from "lucide-react";
import { CreditBudgetBar } from "./credit-budget-bar";

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

const DEFAULT_IMAGES: Record<string, string> = {
  WEIGHT_LOSS: "/images/packages/weight-loss.svg",
  MUSCLE_GAIN: "/images/packages/muscle-gain.svg",
  PERFORMANCE: "/images/packages/performance.svg",
  ENDURANCE: "/images/packages/endurance.svg",
  GENERAL_WELLNESS: "/images/packages/general-wellness.svg",
  RECOVERY: "/images/packages/recovery.svg",
  STRENGTH: "/images/packages/strength.svg",
  BODY_RECOMP: "/images/packages/body-recomp.svg",
  CUSTOM: "/images/packages/custom.svg",
};

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

interface SharedPackageViewProps {
  token: string;
}

export function SharedPackageView({ token }: SharedPackageViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [pkg, setPkg] = useState<Record<string, unknown> | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || "Failed to load package");
        }
        const json = await res.json();
        setPermission(json.data.permission);
        setPkg(json.data.package);
        // Auto-expand tiers with products
        const expanded = new Set<string>();
        for (const v of json.data.package.variants || []) {
          if (v.products?.length > 0) expanded.add(v.id);
        }
        setExpandedTiers(expanded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function toggleTier(variantId: string) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading package...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-3">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Link Unavailable</h2>
            <p className="text-sm text-muted-foreground">
              {error || "This share link is no longer valid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const variants = (pkg.variants || []) as Array<{
    id: string;
    totalCreditsUsed: number;
    subscriptionTier: {
      name: string;
      monthlyCredits: number;
      monthlyPrice: number;
      iconUrl: string | null;
    };
    products: Array<{
      productId: string;
      quantity: number;
      creditCost: number;
      product: {
        name: string;
        sku: string;
        category: string;
        imageUrl: string | null;
      };
    }>;
  }>;

  const imageUrl =
    (pkg.imageUrl as string) ||
    DEFAULT_IMAGES[pkg.fitnessGoal as string] ||
    DEFAULT_IMAGES.GENERAL_WELLNESS;

  const totalProducts = variants.reduce(
    (sum, v) => sum + v.products.length,
    0
  );
  const configuredCount = variants.filter(
    (v) => v.products.length > 0
  ).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Permission banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Boxes className="h-4 w-4" />
            <span>Shared Package</span>
          </div>
          <Badge
            variant="secondary"
            className={
              permission === "edit"
                ? "bg-emerald-100 text-emerald-700 gap-1"
                : "bg-zinc-100 text-zinc-700 gap-1"
            }
          >
            {permission === "edit" ? (
              <Pencil className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            {permission === "edit" ? "Can edit" : "View only"}
          </Badge>
        </div>

        {/* Hero banner */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="relative h-48">
            <img
              src={imageUrl}
              alt={pkg.name as string}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4">
              <Badge className={GOAL_COLORS[pkg.fitnessGoal as string]}>
                {GOAL_LABELS[pkg.fitnessGoal as string]}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white">
                {pkg.name as string}
              </h1>
              {pkg.description ? (
                <p className="text-sm text-white/80 mt-1 line-clamp-2">
                  {String(pkg.description)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Tiers</p>
            <p className="text-lg font-semibold">
              {configuredCount}
              <span className="text-sm font-normal text-muted-foreground">
                /{variants.length}
              </span>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-lg font-semibold">{totalProducts}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Tiers Configured</p>
            <p className="text-lg font-semibold">{configuredCount}</p>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tier Breakdown</h2>

          {variants.map((variant) => {
            const tier = variant.subscriptionTier;
            const products = variant.products;
            const isExpanded = expandedTiers.has(variant.id);
            const isEmpty = products.length === 0;

            return (
              <Card key={variant.id} className="overflow-hidden !py-0">
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleTier(variant.id)}
                  >
                    <div className="flex items-center gap-3">
                      {tier.iconUrl ? (
                        <img
                          src={tier.iconUrl}
                          alt={tier.name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                          {tier.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {tier.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            ${tier.monthlyPrice}/mo
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {products.length} product
                            {products.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            ${variant.totalCreditsUsed.toFixed(2)} / $
                            {tier.monthlyCredits.toFixed(2)} credits
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isEmpty &&
                      (isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ))}
                  </button>

                  {isExpanded && !isEmpty && (
                    <div className="px-4 pb-4 space-y-3">
                      <CreditBudgetBar
                        used={variant.totalCreditsUsed}
                        budget={tier.monthlyCredits}
                      />
                      <div className="space-y-2">
                        {products.map((p) => (
                          <div
                            key={p.productId}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50"
                          >
                            {p.product.imageUrl ? (
                              <img
                                src={p.product.imageUrl}
                                alt={p.product.name}
                                className="h-10 w-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {p.product.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${CATEGORY_COLORS[p.product.category] || ""}`}
                                >
                                  {p.product.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {p.product.sku}
                                </span>
                              </div>
                            </div>
                            {p.quantity > 1 && (
                              <Badge
                                variant="secondary"
                                className="text-xs shrink-0"
                              >
                                x{p.quantity}
                              </Badge>
                            )}
                            <span className="text-sm font-medium shrink-0">
                              ${(p.creditCost * p.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEmpty && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground">
                        No products configured for this tier.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
