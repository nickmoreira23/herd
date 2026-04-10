"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface PriceBreakdownProps {
  memberPrice: number;
  creditCost: number;
  discountPercent: number;
  quantity?: number;
  variant?: "compact" | "full";
  className?: string;
  /** If provided and differs from creditCost, shows a stale-cost warning */
  expectedCost?: number;
}

export function PriceBreakdown({
  memberPrice,
  creditCost,
  discountPercent,
  quantity = 1,
  variant = "compact",
  className,
  expectedCost,
}: PriceBreakdownProps) {
  const totalCost = creditCost * quantity;
  const hasDiscount = discountPercent > 0;
  const isStale = expectedCost !== undefined && Math.abs(expectedCost - creditCost) > 0.01;

  if (variant === "full") {
    return (
      <div className={cn("text-right shrink-0 space-y-0.5", className)}>
        <p className="text-sm font-semibold">${creditCost.toFixed(2)}</p>
        {hasDiscount && (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-muted-foreground line-through">
              ${memberPrice.toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#C5F135]/20 text-[#8BA620]">
              -{discountPercent}%
            </span>
          </div>
        )}
        {!hasDiscount && (
          <p className="text-xs text-muted-foreground">credit cost</p>
        )}
      </div>
    );
  }

  // Compact variant
  return (
    <div className={cn("text-right shrink-0", className)}>
      <div className="flex items-center justify-end gap-1">
        {isStale && (
          <span title={`Current rules would price this at $${expectedCost!.toFixed(2)}`}>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          </span>
        )}
        <p className="text-sm font-semibold">${totalCost.toFixed(2)}</p>
      </div>
      {hasDiscount ? (
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-muted-foreground line-through">
            ${memberPrice.toFixed(2)}
          </span>
          <span className="text-[10px] font-semibold px-1 py-px rounded-full bg-[#C5F135]/20 text-[#8BA620]">
            -{discountPercent}%
          </span>
        </div>
      ) : (
        quantity > 1 && (
          <p className="text-xs text-muted-foreground">
            ${creditCost.toFixed(2)}/ea
          </p>
        )
      )}
      {hasDiscount && quantity > 1 && (
        <p className="text-[10px] text-muted-foreground">
          ${creditCost.toFixed(2)}/ea × {quantity}
        </p>
      )}
    </div>
  );
}
