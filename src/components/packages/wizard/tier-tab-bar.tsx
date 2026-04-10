"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import type { TierInfo, TierState } from "@/stores/package-wizard-store";

interface TierTabBarProps {
  tiers: TierInfo[];
  activeTierId: string | null;
  tierProducts: Record<string, TierState>;
  onSelectTier: (tierId: string) => void;
}

export function TierTabBar({
  tiers,
  activeTierId,
  tierProducts,
  onSelectTier,
}: TierTabBarProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-px">
      {tiers.map((tier) => {
        const isActive = tier.id === activeTierId;
        const state = tierProducts[tier.id];
        const productCount = state?.products.length ?? 0;
        const hasProducts = productCount > 0;
        const isLoading = state?.aiLoading ?? false;

        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onSelectTier(tier.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 shrink-0",
              "border border-b-0",
              isActive
                ? "bg-card text-foreground border-border"
                : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
            )}
          >
            {/* Tier color dot, loading spinner, or check */}
            {isLoading ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin shrink-0"
                style={{ color: tier.colorAccent }}
              />
            ) : hasProducts ? (
              <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            ) : (
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: tier.colorAccent }}
              />
            )}

            <span>{tier.name}</span>

            <span className="text-xs text-muted-foreground">
              ${tier.monthlyPrice}/mo
            </span>

            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ backgroundColor: tier.colorAccent }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
