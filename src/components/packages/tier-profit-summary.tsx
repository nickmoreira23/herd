"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  type HealthStatus,
  type TierFinancials,
} from "@/lib/package-financials";

const STATUS_META: Record<
  HealthStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  healthy: {
    label: "Healthy",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Icon: TrendingUp,
  },
  tight: {
    label: "Tight margin",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    Icon: AlertTriangle,
  },
  loss: {
    label: "Losing money",
    className: "bg-red-100 text-red-700 border-red-200",
    Icon: TrendingDown,
  },
  empty: {
    label: "No products yet",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
    Icon: Minus,
  },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", meta.className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

interface TierProfitSummaryProps {
  fin: TierFinancials;
  /** Heading shown above the headline. Defaults to "Profitability". */
  heading?: string;
  /** Inline (detail page) vs prominent (wizard) layout. */
  variant?: "inline" | "prominent";
  footnote?: string;
}

export function TierProfitSummary({
  fin,
  heading = "Profitability",
  variant = "prominent",
  footnote,
}: TierProfitSummaryProps) {
  const isLoss = fin.profitPerSubscriber < 0;
  const headlineColor = isLoss
    ? "text-red-600"
    : fin.healthStatus === "tight"
      ? "text-amber-700"
      : "text-emerald-700";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {heading}
        </h4>
        <HealthBadge status={fin.healthStatus} />
      </div>

      <div>
        <div className="text-xs text-muted-foreground">
          Monthly profit per subscriber
        </div>
        <div
          className={cn(
            "font-semibold mt-1",
            variant === "prominent" ? "text-3xl" : "text-2xl",
            headlineColor
          )}
        >
          {formatCurrency(fin.profitPerSubscriber)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {fin.grossMarginPct.toFixed(1)}% gross margin
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Row label="Monthly revenue" value={fin.revenue} positive />
        <Row label="Product COGS" value={-fin.productCOGS} muted={fin.productCOGS === 0} />
        <Row
          label="Shipping + handling"
          value={-fin.fulfillmentCost}
          muted={fin.fulfillmentCost === 0}
        />
        <Row
          label="Payment processing"
          value={-fin.paymentProcessing}
          muted={fin.paymentProcessing === 0}
        />
        <div className="border-t border-border pt-2 mt-2 flex items-center justify-between text-sm font-medium">
          <span>Profit</span>
          <span className={cn(isLoss ? "text-red-600" : "text-emerald-700")}>
            {formatCurrency(fin.profitPerSubscriber)}
          </span>
        </div>
      </div>

      {footnote && (
        <p className="text-xs text-muted-foreground">{footnote}</p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  muted,
}: {
  label: string;
  value: number;
  positive?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", muted && "opacity-60")}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          muted && "opacity-60",
          positive && "text-foreground",
          !positive && value < 0 && "text-foreground"
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
