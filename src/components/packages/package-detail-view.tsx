"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Pencil,
  Boxes,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { CreditBudgetBar } from "./credit-budget-bar";
import { PriceBreakdown } from "./price-breakdown";
import { SharePackageDialog } from "./share-package-dialog";
import { resolveDiscount, computeCreditCost, type RedemptionRule } from "@/lib/credit-cost";

// ─── Types ────────────────────────────────────────────────────

interface ProductInVariant {
  id: string;
  productId: string;
  quantity: number;
  creditCost: number;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    subCategory: string | null;
    retailPrice: number;
    memberPrice: number;
    imageUrl: string | null;
  };
}

interface Variant {
  id: string;
  packageId: string;
  subscriptionTierId: string;
  isComplete: boolean;
  totalCreditsUsed: number;
  notes: string | null;
  subscriptionTier: {
    id: string;
    name: string;
    slug: string;
    monthlyCredits: number;
    monthlyPrice: number;
    colorAccent: string;
    sortOrder: number;
    iconUrl: string | null;
  };
  products: ProductInVariant[];
}

interface PackageData {
  id: string;
  name: string;
  slug: string;
  fitnessGoal: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
  variants: Variant[];
}

interface PackageDetailViewProps {
  pkg: PackageData;
  redemptionRulesByTier?: Record<string, RedemptionRule[]>;
}

// ─── Constants ───────────────────────────────────────────────

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

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 border-zinc-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
};

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

const DEFAULT_IMAGES: Record<string, string> = {
  WEIGHT_LOSS: "/images/packages/weight-loss.svg",
  MUSCLE_GAIN: "/images/packages/muscle-gain.svg",
  PERFORMANCE: "/images/packages/performance.svg",
  ENDURANCE: "/images/packages/endurance.svg",
  GENERAL_WELLNESS: "/images/packages/general-wellness.svg",
  RECOVERY: "/images/packages/recovery.svg",
};

// ─── Component ───────────────────────────────────────────────

export function PackageDetailView({ pkg, redemptionRulesByTier = {} }: PackageDetailViewProps) {
  const router = useRouter();
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(
    () => new Set(pkg.variants.filter((v) => v.products.length > 0).map((v) => v.id))
  );
  const [shareOpen, setShareOpen] = useState(false);

  const imageUrl = pkg.imageUrl || DEFAULT_IMAGES[pkg.fitnessGoal] || DEFAULT_IMAGES.GENERAL_WELLNESS;
  const configuredCount = pkg.variants.filter((v) => v.products.length > 0).length;
  const totalProducts = pkg.variants.reduce((sum, v) => sum + v.products.length, 0);
  const avgUtilization =
    pkg.variants.length > 0
      ? pkg.variants.reduce((sum, v) => {
          const budget = v.subscriptionTier.monthlyCredits;
          return sum + (budget > 0 ? (v.totalCreditsUsed / budget) * 100 : 0);
        }, 0) / pkg.variants.length
      : 0;

  function toggleTier(variantId: string) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Navigation + actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/program/packages")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Packages
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={() => router.push(`/admin/program/packages/${pkg.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Package
          </Button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="relative h-48 md:h-56">
          <img
            src={imageUrl}
            alt={pkg.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className={STATUS_STYLES[pkg.status] || STATUS_STYLES.DRAFT}>
              {pkg.status}
            </Badge>
            <Badge className={GOAL_COLORS[pkg.fitnessGoal]}>
              {GOAL_LABELS[pkg.fitnessGoal]}
            </Badge>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white">{pkg.name}</h1>
            {pkg.description && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">
                {pkg.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Boxes className="h-4 w-4" />}
          label="Tiers Configured"
          value={`${configuredCount}/${pkg.variants.length}`}
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Total Products"
          value={String(totalProducts)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Utilization"
          value={`${avgUtilization.toFixed(0)}%`}
          accent={avgUtilization >= 90}
        />
        <StatCard
          icon={
            <div
              className="h-4 w-4 rounded-full border-2"
              style={{
                borderColor:
                  pkg.status === "ACTIVE"
                    ? "#10b981"
                    : pkg.status === "DRAFT"
                      ? "#a1a1aa"
                      : "#6b7280",
              }}
            />
          }
          label="Status"
          value={pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
        />
      </div>

      {/* Tier breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tier Breakdown</h2>
        <p className="text-sm text-muted-foreground">
          Product bundles configured for each subscription plan.
        </p>

        <div className="space-y-3">
          {pkg.variants.map((variant) => {
            const tier = variant.subscriptionTier;
            const products = variant.products;
            const tierRules = redemptionRulesByTier[variant.subscriptionTierId] || [];
            const isExpanded = expandedTiers.has(variant.id);
            const isEmpty = products.length === 0;
            const utilization =
              tier.monthlyCredits > 0
                ? (variant.totalCreditsUsed / tier.monthlyCredits) * 100
                : 0;

            return (
              <Card
                key={variant.id}
                className="overflow-hidden !py-0"
              >
                <CardContent className="p-0">
                  {/* Tier header — always visible */}
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
                          {isEmpty && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-yellow-100 text-yellow-700"
                            >
                              Not configured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            ${variant.totalCreditsUsed.toFixed(2)} / $
                            {tier.monthlyCredits.toFixed(2)} credits
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {utilization.toFixed(0)}% used
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

                  {/* Expanded content */}
                  {isExpanded && !isEmpty && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Credit bar */}
                      <CreditBudgetBar
                        used={variant.totalCreditsUsed}
                        budget={tier.monthlyCredits}
                      />

                      {/* Product list */}
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

                            <PriceBreakdown
                              memberPrice={p.product.memberPrice}
                              creditCost={p.creditCost}
                              discountPercent={resolveDiscount(
                                {
                                  sku: p.product.sku,
                                  category: p.product.category,
                                  subCategory: p.product.subCategory,
                                  memberPrice: p.product.memberPrice,
                                },
                                tierRules
                              )}
                              quantity={p.quantity}
                              expectedCost={computeCreditCost(
                                {
                                  sku: p.product.sku,
                                  category: p.product.category,
                                  subCategory: p.product.subCategory,
                                  memberPrice: p.product.memberPrice,
                                },
                                tierRules
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty tier */}
                  {isEmpty && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground">
                        No products configured for this tier yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <SharePackageDialog
        packageId={pkg.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={`text-xl font-bold ${accent ? "text-emerald-600" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
