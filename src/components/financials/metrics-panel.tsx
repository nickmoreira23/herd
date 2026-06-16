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
import { cn, getMarginColorClass } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import { AccountingBasisBadge } from "./accounting-basis-reconciliation";

interface MetricsPanelProps {
  multiplier: number;
  periodLabel: string;
  locale: Locale;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetricsPanel({ multiplier: m, periodLabel, locale }: MetricsPanelProps) {
  const t = useT();
  const results = useFinancialStore((s) => s.results);

  // Thread D.2 — period totals derived from `cohortProjection` first
  // `m` months. See engine doc block + pl-statement.tsx for the pattern.
  // Helper closes over `results` so cards can call `period(field)`
  // inline without re-deriving the slice each time. Defined defensively
  // for the no-results return path below.
  const sumOver = <K extends keyof NonNullable<typeof results>["cohortProjection"][number]>(
    key: K,
  ): number => {
    if (!results) return 0;
    return results.cohortProjection
      .slice(0, m)
      .reduce((s, mo) => s + (Number(mo[key]) || 0), 0);
  };

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("financials.metrics.empty_title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("financials.metrics.empty_description")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSubs = results.revenueByTier.reduce((s, tier) => s + tier.subscribers, 0) || 1;

  const ltvCacInterpretation =
    results.ltvCac.ltvCacRatio >= 3
      ? t("financials.metrics.ltv_cac.healthy")
      : results.ltvCac.ltvCacRatio >= 1
        ? t("financials.metrics.ltv_cac.needs_improvement")
        : t("financials.metrics.ltv_cac.losing_money");

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Accounting basis — every metric on this panel (LTV, CAC,
            margins, cost-per-sub, profit split) is accrual-derived. */}
        <div className="flex flex-wrap items-center gap-2">
          <AccountingBasisBadge basis="accrual" />
        </div>
        {/* LTV / CAC Analysis */}
        <CollapsibleCard
          icon={<Target className="h-3.5 w-3.5" />}
          title={t("financials.metrics.ltv_cac.title")}
          description={t("financials.metrics.ltv_cac.description")}
          tooltip={t("financials.metrics.ltv_cac.tooltip")}
        >
          {/* Top-line LTV:CAC metrics */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="rounded-xl border bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t("financials.metrics.ltv_cac.blended_ltv")}
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-green-700 dark:text-green-400">
                {results.ltvCac.blendedLTV === Infinity
                  ? "∞"
                  : formatNumberAsMoney(results.ltvCac.blendedLTV, locale)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("financials.metrics.ltv_cac.blended_ltv_sub")}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t("financials.metrics.ltv_cac.blended_cac")}
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-amber-700 dark:text-amber-400">
                {formatNumberAsMoney(results.ltvCac.blendedCAC, locale)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("financials.metrics.ltv_cac.blended_cac_sub")}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t("financials.metrics.ltv_cac.ratio")}
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
                {ltvCacInterpretation}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t("financials.metrics.ltv_cac.payback_period")}
              </p>
              <p className="text-lg font-bold mt-0.5 tabular-nums text-violet-700 dark:text-violet-400">
                {results.ltvCac.monthsToPayback === Infinity
                  ? t("common.time.never")
                  : t("financials.metrics.tier_details.months_short", { months: results.ltvCac.monthsToPayback.toFixed(1) })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("financials.metrics.ltv_cac.months_to_recover")}
              </p>
            </div>
          </div>

          {/* Per-Tier LTV/CAC breakdown */}
          {results.ltvCac.perTier.length > 0 && (
            <div className="space-y-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {t("financials.metrics.per_tier_breakdown")}
              </p>
              {results.ltvCac.perTier.map((tier, idx) => {
                const ratioColor =
                  tier.ltvCacRatio >= 3
                    ? "text-green-600 dark:text-green-400"
                    : tier.ltvCacRatio >= 1
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400";
                const barColor =
                  tier.ltvCacRatio >= 3
                    ? "bg-green-500"
                    : tier.ltvCacRatio >= 1
                      ? "bg-amber-500"
                      : "bg-red-500";
                const barWidth = Math.min(100, (tier.ltvCacRatio / 5) * 100);

                return (
                  <div
                    key={tier.tierId}
                    className={`py-2.5 ${idx < results.ltvCac.perTier.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{tier.tierId}</span>
                      <span className={`text-xs font-bold tabular-nums ${ratioColor}`}>
                        {tier.ltvCacRatio === Infinity ? "∞" : `${tier.ltvCacRatio.toFixed(1)}x`} {t("financials.metrics.ltv_cac.ratio_short")}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground tabular-nums">
                      <span>{t("financials.metrics.ltv_cac.ltv_label")}: {tier.ltv === Infinity ? "∞" : formatNumberAsMoney(tier.ltv, locale)}</span>
                      <span>{t("financials.metrics.ltv_cac.cac_label")}: {formatNumberAsMoney(tier.cac, locale)}</span>
                      <span>{t("financials.metrics.ltv_cac.payback_label")}: {tier.monthsToPayback === Infinity ? t("common.time.never") : t("financials.metrics.tier_details.months_short", { months: tier.monthsToPayback.toFixed(1) })}</span>
                      <span>{t("financials.metrics.tier_details.avg_life")}: {tier.avgLifetimeMonths === Infinity ? "∞" : t("financials.metrics.tier_details.months_short", { months: tier.avgLifetimeMonths.toFixed(0) })}</span>
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
          title={t("financials.metrics.sales.title")}
          description={t("financials.metrics.sales.description")}
          tooltip={t("financials.metrics.sales.tooltip")}
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label={t("financials.metrics.sales.mo1_reps")} value={String(results.month1Reps)} />
            <MetricCard label={t("financials.metrics.sales.mo1_new_subs")} value={String(results.newSubsFromReps)} accent="blue" />
            <MetricCard
              label={t("financials.metrics.sales.reps_mo12")}
              value={results.cohortProjection[11] ? String(results.cohortProjection[11].activeReps) : "—"}
            />
          </div>
        </CollapsibleCard>

        {/* Revenue */}
        <CollapsibleCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title={t("financials.metrics.revenue.title")}
          description={t("financials.metrics.revenue.description")}
          tooltip={t("financials.metrics.revenue.tooltip")}
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label={t("financials.metrics.revenue.label")} value={formatNumberAsMoney(sumOver("revenue"), locale)} accent="green" />
            <MetricCard label={t("financials.metrics.revenue.revenue_per_sub")} value={formatNumberAsMoney(results.mrr / totalSubs, locale)} />
            <MetricCard label={t("financials.metrics.revenue.arr")} value={formatNumberAsMoney(results.arr, locale)} accent="green" />
          </div>
        </CollapsibleCard>

        {/* COGS */}
        <CollapsibleCard
          icon={<Package className="h-3.5 w-3.5" />}
          title={t("financials.metrics.cogs.title")}
          description={t("financials.metrics.cogs.description")}
          tooltip={t("financials.metrics.cogs.tooltip")}
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label={t("financials.metrics.cogs.total")} value={formatNumberAsMoney(sumOver("cogsExpense"), locale)} accent="amber" />
            <MetricCard label={t("financials.metrics.cogs.fulfillment")} value={formatNumberAsMoney(
              // Fulfillment derived proportionally from totalCOGS — see
              // pl-statement.tsx for the same pattern (totalProductCost
              // and totalFulfillmentCost are both averages now, ratio
              // is time-invariant).
              results.totalProductCost > 0
                ? sumOver("cogsExpense") * (results.totalFulfillmentCost / results.totalProductCost)
                : 0,
              locale,
            )} />
            <MetricCard label={t("financials.metrics.cogs.cost_per_sub")} value={formatNumberAsMoney(results.costPerSubscriber, locale)} />
          </div>
        </CollapsibleCard>

        {/* Commissions */}
        <CollapsibleCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title={t("financials.metrics.commissions.title")}
          description={t("financials.metrics.commissions.description")}
          tooltip={t("financials.metrics.commissions.tooltip")}
        >
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label={t("financials.metrics.commissions.total")} value={formatNumberAsMoney(sumOver("commissionExpense"), locale)} accent="purple" />
            <MetricCard label={t("financials.metrics.commissions.per_sub")} value={formatNumberAsMoney(results.commissionPerSubscriber, locale)} />
            <MetricCard
              label={t("financials.metrics.commissions.percent_of_revenue")}
              value={formatNumber(results.commissionPercentOfRevenue / 100, locale, "percent")}
              warn={results.commissionPercentOfRevenue > 15}
            />
          </div>
        </CollapsibleCard>

        {/* Partners & Breakage */}
        <CollapsibleCard
          icon={<Handshake className="h-3.5 w-3.5" />}
          title={t("financials.metrics.partners.title")}
          description={t("financials.metrics.partners.description")}
          tooltip={t("financials.metrics.partners.tooltip")}
        >
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label={t("financials.metrics.partners.kickback_revenue")} value={formatNumberAsMoney(results.totalKickbackRevenue * m, locale)} accent="blue" />
            <MetricCard label={t("financials.metrics.partners.breakage_savings")} value={formatNumberAsMoney(sumOver("breakageProfit"), locale)} />
          </div>
        </CollapsibleCard>

        {/* Margins */}
        <CollapsibleCard
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          title={t("financials.metrics.margins.title")}
          description={t("financials.metrics.margins.description")}
          tooltip={t("financials.metrics.margins.tooltip")}
        >
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label={t("financials.metrics.margins.gross")} value={formatNumberAsMoney(sumOver("revenue") - sumOver("cogsExpense"), locale)} />
            <MetricCard
              label={t("financials.metrics.margins.gross_percent")}
              value={formatNumber(results.grossMarginPercent / 100, locale, "percent")}
              valueClassName={getMarginColorClass(results.grossMarginPercent)}
            />
            <MetricCard label={t("financials.metrics.margins.net")} value={formatNumberAsMoney(sumOver("netProfit"), locale)} accent="green" highlight />
            <MetricCard
              label={t("financials.metrics.margins.net_percent")}
              value={formatNumber(results.netMarginPercent / 100, locale, "percent")}
              accent="green"
              highlight
              valueClassName={getMarginColorClass(results.netMarginPercent)}
            />
          </div>
        </CollapsibleCard>

        {/* Profit Split */}
        {/* Profit distribution (S3.6) — same cascade source as the
            Spreadsheet/P&L. Per party: net (headline), summed over the first
            `m` months to match the panel's period scope. Over-allocation is
            recomputed from the parties' percents (independent of the split
            source), keeping the banner without consuming legacy `profitSplit`. */}
        {results.profitDistribution.totals.accrual.length > 0 &&
          (() => {
            const dist = results.profitDistribution.accrual.slice(0, m);
            const partyNet = (id: string) =>
              dist.reduce(
                (s, mo) => s + (mo.byParty.find((b) => b.partyId === id)?.net ?? 0),
                0,
              );
            const undistributed = dist.reduce((s, mo) => s + mo.undistributed, 0);
            const totalPct = results.profitDistribution.totals.accrual.reduce(
              (s, p) => s + p.percent,
              0,
            );
            const isOver = totalPct > 100.01;
            return (
              <CollapsibleCard
                icon={<PieChart className="h-3.5 w-3.5" />}
                title={t("financials.metrics.profit_split.title")}
                description={t("financials.metrics.profit_split.description")}
                tooltip={t("financials.metrics.profit_split.tooltip")}
              >
                <div className="grid grid-cols-2 gap-2">
                  {results.profitDistribution.totals.accrual.map((party) => (
                    <MetricCard
                      key={party.partyId}
                      label={`${party.name || t("financials.metrics.profit_split.unnamed")} (${party.percent}%)`}
                      value={formatNumberAsMoney(partyNet(party.partyId), locale)}
                      accent="green"
                    />
                  ))}
                  {Math.abs(undistributed) > 0.005 && (
                    <MetricCard
                      label={t("financials.cascade.undistributed")}
                      value={formatNumberAsMoney(undistributed, locale)}
                      accent="amber"
                    />
                  )}
                </div>
                {/* Over-allocation warning — recomputed from the parties'
                    percents (Σ > 100), independent of the split source. */}
                {isOver && (
                  <div className="px-3 py-2 mt-3 rounded-md border border-rose-300 bg-rose-50 text-rose-700 text-xs">
                    <strong>{t("financials.profit_split.over_allocated.label")}</strong>{" "}
                    {t("financials.profit_split.over_allocated.body", {
                      total: totalPct.toFixed(1),
                      overage: (totalPct - 100).toFixed(1),
                    })}
                  </div>
                )}
              </CollapsibleCard>
            );
          })()}

        {/* Per-Tier Details */}
        {results.tierDetails.length > 0 && (
          <CollapsibleCard
            icon={<Layers className="h-3.5 w-3.5" />}
            title={t("financials.metrics.tier_details.title")}
            description={t("financials.metrics.tier_details.description")}
            tooltip={t("financials.metrics.tier_details.tooltip")}
          >
            <div className="space-y-0">
              {results.tierDetails.map((tier, idx) => {
                const maxRev = Math.max(...results.tierDetails.map((d) => d.revenuePerSub));
                const barWidth = maxRev > 0 ? (tier.revenuePerSub / maxRev) * 100 : 0;
                return (
                  <div
                    key={tier.tierId}
                    className={`py-2.5 ${idx < results.tierDetails.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{tier.tierId}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t("financials.metrics.tier_details.subscribers_count", { count: formatNumber(tier.subscribers, locale, "integer") })}
                        </span>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${getMarginColorClass(tier.marginPercent)}`}>
                        {t("financials.metrics.tier_details.margin_label", { value: formatNumber(tier.marginPercent / 100, locale, "percent") })}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF0000] to-red-300 transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground tabular-nums">
                      <span>{t("financials.metrics.tier_details.rev_per_sub", { value: formatNumberAsMoney(tier.revenuePerSub, locale) })}</span>
                      <span>{t("financials.metrics.tier_details.cogs_per_sub", { value: formatNumberAsMoney(tier.cogsPerSub, locale) })}</span>
                      <span>{t("financials.metrics.tier_details.ltv_label", { value: formatNumberAsMoney(tier.ltv, locale) })}</span>
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
