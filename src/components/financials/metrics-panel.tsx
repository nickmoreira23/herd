"use client";

import { useState } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Package,
  DollarSign,
  Handshake,
  BarChart3,
  Layers,
  Target,
  UserPlus,
  HelpCircle,
  ChevronDown,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, getMarginColorClass } from "@/lib/utils";
interface MetricsPanelProps {
  multiplier: number;
  periodLabel: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetricsPanel({ multiplier: m, periodLabel }: MetricsPanelProps) {
  const results = useFinancialStore((s) => s.results);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No results yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the scenario inputs to see financial projections.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSubs = results.revenueByTier.reduce((s, t) => s + t.subscribers, 0) || 1;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* LTV / CAC Analysis */}
        <CollapsibleCard
          icon={<Target className="h-3.5 w-3.5" />}
          title="LTV / CAC Analysis"
          description="Lifetime value vs acquisition cost per customer"
          tooltip="Compares how much a customer is worth over their lifetime (LTV) to how much it costs to acquire them (CAC). A ratio of 3x+ is healthy."
        >
          {/* Top-line LTV:CAC metrics */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="rounded-xl border bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Blended LTV
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-green-700 dark:text-green-400">
                {results.ltvCac.blendedLTV === Infinity
                  ? "∞"
                  : formatCurrency(results.ltvCac.blendedLTV)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Lifetime value per customer
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Blended CAC
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-amber-700 dark:text-amber-400">
                {formatCurrency(results.ltvCac.blendedCAC)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cost to acquire a customer
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                LTV : CAC
              </p>
              <p className={`text-lg font-bold mt-0.5 tabular-nums ${
                results.ltvCac.ltvCacRatio >= 3
                  ? "text-green-600 dark:text-green-400"
                  : results.ltvCac.ltvCacRatio >= 1
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}>
                {results.ltvCac.ltvCacRatio === Infinity
                  ? "∞"
                  : `${results.ltvCac.ltvCacRatio.toFixed(1)}x`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {results.ltvCac.ltvCacRatio >= 3
                  ? "Healthy (3x+ is great)"
                  : results.ltvCac.ltvCacRatio >= 1
                    ? "Needs improvement (aim for 3x+)"
                    : "Losing money on acquisition"}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Payback Period
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-violet-700 dark:text-violet-400">
                {results.ltvCac.monthsToPayback === Infinity
                  ? "Never"
                  : `${results.ltvCac.monthsToPayback.toFixed(1)} mo`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Months to recover CAC
              </p>
            </div>
          </div>

          {/* Per-Tier LTV/CAC breakdown */}
          {results.ltvCac.perTier.length > 0 && (
            <div className="space-y-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Per-Tier Breakdown
              </p>
              {results.ltvCac.perTier.map((t, idx) => {
                const ratioColor =
                  t.ltvCacRatio >= 3
                    ? "text-green-600 dark:text-green-400"
                    : t.ltvCacRatio >= 1
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400";
                const barColor =
                  t.ltvCacRatio >= 3
                    ? "bg-green-500"
                    : t.ltvCacRatio >= 1
                      ? "bg-amber-500"
                      : "bg-red-500";
                const barWidth = Math.min(100, (t.ltvCacRatio / 5) * 100);

                return (
                  <div
                    key={t.tierId}
                    className={`py-2.5 ${idx < results.ltvCac.perTier.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{t.tierId}</span>
                      <span className={`text-xs font-bold tabular-nums ${ratioColor}`}>
                        {t.ltvCacRatio === Infinity ? "∞" : `${t.ltvCacRatio.toFixed(1)}x`} LTV:CAC
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground tabular-nums">
                      <span>LTV: {t.ltv === Infinity ? "∞" : formatCurrency(t.ltv)}</span>
                      <span>CAC: {formatCurrency(t.cac)}</span>
                      <span>Payback: {t.monthsToPayback === Infinity ? "Never" : `${t.monthsToPayback.toFixed(1)} mo`}</span>
                      <span>Avg life: {t.avgLifetimeMonths === Infinity ? "∞" : `${t.avgLifetimeMonths.toFixed(0)} mo`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleCard>

        {/* Acquisition Channels */}
        <CollapsibleCard
          icon={<UserPlus className="h-3.5 w-3.5" />}
          title="Sales Rep Channel"
          description="Rep count, new subscribers & growth"
          tooltip="Metrics from your sales rep acquisition channel — starting reps, month-1 subscriber generation, and projected reps at month 12."
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Mo 1 Reps" value={String(results.month1Reps)} />
            <MetricCard label="Mo 1 New Subs" value={String(results.newSubsFromReps)} accent="blue" />
            <MetricCard
              label="Reps @ Mo 12"
              value={results.cohortProjection[11] ? String(results.cohortProjection[11].activeReps) : "—"}
            />
          </div>
        </CollapsibleCard>

        {/* Revenue */}
        <CollapsibleCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title="Revenue"
          description="Total revenue & revenue per subscriber"
          tooltip="Total recurring revenue for the selected period, plus the blended average revenue per subscriber across all tiers and billing cycles."
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Revenue" value={formatCurrency(results.mrr * m)} accent="green" />
            <MetricCard label="Revenue/Sub" value={formatCurrency(results.mrr / totalSubs)} />
            <MetricCard label="ARR" value={formatCurrency(results.arr)} accent="green" />
          </div>
        </CollapsibleCard>

        {/* COGS */}
        <CollapsibleCard
          icon={<Package className="h-3.5 w-3.5" />}
          title="COGS"
          description="Product, fulfillment & per-subscriber costs"
          tooltip="Cost of goods sold — total product costs, fulfillment expenses, and the blended cost per subscriber."
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Total COGS" value={formatCurrency(results.totalProductCost * m)} accent="amber" />
            <MetricCard label="Fulfillment" value={formatCurrency(results.totalFulfillmentCost * m)} />
            <MetricCard label="Cost/Sub" value={formatCurrency(results.costPerSubscriber)} />
          </div>
        </CollapsibleCard>

        {/* Commissions */}
        <CollapsibleCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title="Commissions"
          description="Total expense, per-sub & % of revenue"
          tooltip="Total commission expense including upfront bonuses and residual payments, broken down per subscriber and as a percentage of total revenue."
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Total Commission" value={formatCurrency(results.totalCommissionExpense * m)} accent="purple" />
            <MetricCard label="Commission/Sub" value={formatCurrency(results.commissionPerSubscriber)} />
            <MetricCard
              label="% of Revenue"
              value={formatPercent(results.commissionPercentOfRevenue)}
              warn={results.commissionPercentOfRevenue > 15}
            />
          </div>
        </CollapsibleCard>

        {/* Partners & Breakage */}
        <CollapsibleCard
          icon={<Handshake className="h-3.5 w-3.5" />}
          title="Partners & Breakage"
          description="Kickback revenue & credit savings"
          tooltip="Revenue from partner brand kickbacks. Breakage savings represent COGS avoided from unredeemed credits — already reflected in lower COGS figures."
        >
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Kickback Revenue" value={formatCurrency(results.totalKickbackRevenue * m)} accent="blue" />
            <MetricCard label="Breakage Savings" value={formatCurrency(results.totalBreakageProfit * m)} />
          </div>
        </CollapsibleCard>

        {/* Margins */}
        <CollapsibleCard
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          title="Margins"
          description="Gross & net margin in dollars and percent"
          tooltip="Gross margin (revenue minus COGS) and net margin (after all expenses including commissions and overhead)."
        >
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Gross Margin" value={formatCurrency(results.grossMarginDollars * m)} />
            <MetricCard
              label="Gross Margin %"
              value={formatPercent(results.grossMarginPercent)}
              valueClassName={getMarginColorClass(results.grossMarginPercent)}
            />
            <MetricCard label="Net Margin" value={formatCurrency(results.netMarginDollars * m)} accent="green" highlight />
            <MetricCard
              label="Net Margin %"
              value={formatPercent(results.netMarginPercent)}
              accent="green"
              highlight
              valueClassName={getMarginColorClass(results.netMarginPercent)}
            />
          </div>
        </CollapsibleCard>

        {/* Profit Split */}
        {results.profitSplit.parties.length > 0 && (
          <CollapsibleCard
            icon={<PieChart className="h-3.5 w-3.5" />}
            title="Profit Split"
            description="How channel profits are divided between parties"
            tooltip="After all costs, the remaining net profit is split among the defined parties according to their agreed percentages."
          >
            <div className="grid grid-cols-2 gap-2">
              {results.profitSplit.parties.map((party) => (
                <MetricCard
                  key={party.id}
                  label={`${party.name || "Unnamed"} (${party.percent}%)`}
                  value={formatCurrency(party.monthlyAmount * m)}
                  accent="green"
                />
              ))}
              {results.profitSplit.undistributedPercent > 0 && (
                <MetricCard
                  label={`Undistributed (${results.profitSplit.undistributedPercent}%)`}
                  value={formatCurrency(
                    results.netMarginDollars > 0
                      ? results.netMarginDollars * m * (results.profitSplit.undistributedPercent / 100)
                      : 0
                  )}
                  accent="amber"
                />
              )}
            </div>
          </CollapsibleCard>
        )}

        {/* Per-Tier Details */}
        {results.tierDetails.length > 0 && (
          <CollapsibleCard
            icon={<Layers className="h-3.5 w-3.5" />}
            title="Per-Tier Breakdown"
            description="Revenue, COGS & margin per subscription tier"
            tooltip="Detailed per-tier analysis showing subscriber count, revenue per subscriber, cost structure, margin, and lifetime value for each tier."
          >
            <div className="space-y-0">
              {results.tierDetails.map((t, idx) => {
                const maxRev = Math.max(...results.tierDetails.map((d) => d.revenuePerSub));
                const barWidth = maxRev > 0 ? (t.revenuePerSub / maxRev) * 100 : 0;
                return (
                  <div
                    key={t.tierId}
                    className={`py-2.5 ${idx < results.tierDetails.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{t.tierId}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.subscribers.toLocaleString()} subscribers
                        </span>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${getMarginColorClass(t.marginPercent)}`}>
                        {formatPercent(t.marginPercent)} margin
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF0000] to-red-300 transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground tabular-nums">
                      <span>Rev: {formatCurrency(t.revenuePerSub)}/sub</span>
                      <span>COGS: {formatCurrency(t.cogsPerSub)}/sub</span>
                      <span>LTV: {formatCurrency(t.ltv)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleCard>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─── Sub-components ─── */

function CollapsibleCard({
  icon,
  title,
  description,
  tooltip,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tooltip: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-muted/30">
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">{icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider block">
              {title}
            </span>
            {description && (
              <span className="text-[11px] text-muted-foreground truncate block">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip>
            <TooltipTrigger
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Collapsible content */}
      {open && (
        <div className="px-3 pb-3">
          <div className="rounded-md bg-background p-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  highlight,
  warn,
  valueClassName,
}: {
  label: string;
  value: string;
  accent?: "green" | "amber" | "purple" | "blue";
  highlight?: boolean;
  warn?: boolean;
  valueClassName?: string;
}) {
  const accentColors = {
    green: "from-green-500/10 to-transparent border-green-500/20",
    amber: "from-amber-500/10 to-transparent border-amber-500/20",
    purple: "from-violet-500/10 to-transparent border-violet-500/20",
    blue: "from-blue-500/10 to-transparent border-blue-500/20",
  };
  const textColors = {
    green: "text-green-700 dark:text-green-400",
    amber: "text-amber-700 dark:text-amber-400",
    purple: "text-violet-700 dark:text-violet-400",
    blue: "text-blue-700 dark:text-blue-400",
  };

  const bgClass = accent ? `bg-gradient-to-br ${accentColors[accent]}` : "";
  const ringClass = highlight ? "ring-1 ring-green-500/30" : "";
  const colorClass = warn
    ? "text-red-600"
    : valueClassName || (accent ? textColors[accent] : "");

  return (
    <div className={`rounded-xl border p-3 ${bgClass} ${ringClass}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={`text-lg font-bold mt-0.5 tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
