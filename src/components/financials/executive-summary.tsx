"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Layers,
  DollarSign,
  Users,
  Building2,
  Handshake,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import { AccountingBasisBadge } from "./accounting-basis-reconciliation";
import Link from "next/link";

interface ExecutiveSummaryProps {
  locale: Locale;
  /** Public/shared view — hides the assumption-source provenance block. */
  hideAssumptions?: boolean;
}

export function ExecutiveSummary({ locale, hideAssumptions = false }: ExecutiveSummaryProps) {
  const t = useT();
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("financials.summary.empty_title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("financials.summary.empty_description")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const netMarginPercent = results.netMarginPercent;
  const ltvCacRatio = results.ltvCac.ltvCacRatio;
  const breakevenMonth = results.operationBreakevenMonth;

  const getMarginInterpretation = (margin: number): string => {
    if (margin >= 25) return t("financials.summary.margin.interpretation.strong");
    if (margin >= 15) return t("financials.summary.margin.interpretation.healthy");
    if (margin >= 5) return t("financials.summary.margin.interpretation.thin");
    if (margin >= 0) return t("financials.summary.margin.interpretation.breakeven");
    return t("financials.summary.margin.interpretation.negative");
  };

  const getLTVCACInterpretation = (ratio: number): string => {
    if (ratio === Infinity) return t("financials.summary.ltvcac.interpretation.infinite");
    if (ratio >= 5) return t("financials.summary.ltvcac.interpretation.excellent");
    if (ratio >= 3) return t("financials.summary.ltvcac.interpretation.healthy");
    if (ratio >= 1.5) return t("financials.summary.ltvcac.interpretation.cautious");
    if (ratio >= 1) return t("financials.summary.ltvcac.interpretation.barely_positive");
    return t("financials.summary.ltvcac.interpretation.negative");
  };

  const getBreakevenInterpretation = (month: number): string => {
    if (month === Infinity) return t("financials.summary.breakeven.interpretation.never");
    if (month <= 6) return t("financials.summary.breakeven.interpretation.fast");
    if (month <= 12) return t("financials.summary.breakeven.interpretation.solid");
    if (month <= 18) return t("financials.summary.breakeven.interpretation.moderate");
    return t("financials.summary.breakeven.interpretation.long");
  };

  return (
    <div className="space-y-4">
      {/* Accounting basis — sub-etapa 3b: this whole panel reads from
          accrual-basis aggregates (`results.mrr` = period avg,
          `results.arr` = exit ARR per Thread D.3.3 alias,
          `results.netMarginDollars`, `results.cohortProjection[].*`).
          See engine doc block for the full categorization. */}
      <div className="flex flex-wrap items-center gap-2">
        <AccountingBasisBadge basis="accrual" />
      </div>
      {/* Verdict Cards */}
      <div className="grid grid-cols-3 gap-3">
        <VerdictCard
          label={t("financials.summary.verdict.net_margin")}
          value={formatNumber(netMarginPercent / 100, locale, "percent")}
          subvalue={t("financials.summary.verdict.net_margin_sub", { value: formatNumberAsMoney(results.netMarginDollars, locale) })}
          rating={getMarginRating(netMarginPercent)}
          interpretation={getMarginInterpretation(netMarginPercent)}
          icon={netMarginPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        />
        <VerdictCard
          label={t("financials.summary.verdict.ltv_cac")}
          value={ltvCacRatio === Infinity ? "∞" : `${ltvCacRatio.toFixed(1)}x`}
          subvalue={t("financials.summary.verdict.ltv_cac_sub", {
            ltv: results.ltvCac.blendedLTV === Infinity ? "∞" : formatNumberAsMoney(results.ltvCac.blendedLTV, locale),
            cac: formatNumberAsMoney(results.ltvCac.blendedCAC, locale),
          })}
          rating={getLTVCACRating(ltvCacRatio)}
          interpretation={getLTVCACInterpretation(ltvCacRatio)}
          icon={<Target className="h-4 w-4" />}
        />
        <VerdictCard
          label={t("financials.summary.verdict.breakeven")}
          value={breakevenMonth === Infinity ? t("common.time.never") : t("financials.summary.verdict.breakeven_month", { month: breakevenMonth })}
          subvalue={
            breakevenMonth !== Infinity
              ? breakevenMonth <= 12
                ? t("financials.summary.verdict.breakeven_year1")
                : t("financials.summary.verdict.breakeven_year2")
              : t("financials.summary.verdict.breakeven_negative")
          }
          rating={getBreakevenRating(breakevenMonth)}
          interpretation={getBreakevenInterpretation(breakevenMonth)}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Key Metrics At-a-Glance */}
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("financials.summary.key_metrics.title")}
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <MetricRow label={t("financials.summary.key_metrics.mrr")} value={formatNumberAsMoney(results.mrr, locale)} />
            <MetricRow label={t("financials.summary.key_metrics.arr")} value={formatNumberAsMoney(results.arr, locale)} />
            <MetricRow label={t("financials.summary.key_metrics.gross_margin")} value={formatNumber(results.grossMarginPercent / 100, locale, "percent")} color={results.grossMarginPercent >= 50} />
            <MetricRow label={t("financials.summary.key_metrics.new_subs_per_mo")} value={formatNumber(results.newSubscribersPerMonth, locale, "integer")} />
            <MetricRow label={t("financials.summary.key_metrics.commission_pct_revenue")} value={formatNumber(results.commissionPercentOfRevenue / 100, locale, "percent")} />
            <MetricRow label={t("financials.summary.key_metrics.cost_per_sub")} value={formatNumberAsMoney(results.costPerSubscriber, locale)} />
            <MetricRow label={t("financials.summary.key_metrics.payback_period")} value={results.ltvCac.monthsToPayback === Infinity ? "∞" : t("financials.summary.key_metrics.months_value", { months: results.ltvCac.monthsToPayback.toFixed(1) })} />
            <MetricRow label={t("financials.summary.key_metrics.mo24_subscribers")} value={results.cohortProjection[23]?.subscribers !== undefined ? formatNumber(results.cohortProjection[23].subscribers, locale, "integer") : "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Assumption Provenance — hidden in the public/shared view (it surfaces
          the underlying inputs, which a shared projection must not reveal). */}
      {!hideAssumptions && (
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("financials.summary.provenance.title")}
          </h4>
          <div className="space-y-2">
            <ProvenanceRow
              icon={<Layers className="h-3.5 w-3.5" />}
              label={t("financials.summary.provenance.tier_pricing")}
              detail={t("financials.summary.provenance.tiers_configured", { count: inputs.tiers.length })}
              href="/admin/blocks/subscriptions"
              source={t("financials.summary.provenance.source_plans")}
            />
            <ProvenanceRow
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label={t("financials.summary.provenance.commissions")}
              detail={t("financials.summary.provenance.commissions_detail", {
                bonus: inputs.commissionStructure.flatBonusPerSale,
                residual: inputs.commissionStructure.residualPercent,
              })}
              source={t("financials.summary.provenance.source_promoters")}
            />
            <ProvenanceRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label={t("financials.summary.provenance.opex")}
              detail={inputs.operationalOverhead.mode === "milestone-scaled"
                ? t("financials.summary.provenance.opex_scaled", { count: inputs.operationalOverhead.opexData?.length ?? 0 })
                : t("financials.summary.provenance.opex_fixed", { value: formatNumberAsMoney(inputs.operationalOverhead.fixedMonthly, locale) })}
              href="/admin/operation"
              source={inputs.operationalOverhead.mode === "milestone-scaled" ? t("financials.summary.provenance.source_operations_live") : t("financials.summary.provenance.source_manual_override")}
              isLive={inputs.operationalOverhead.mode === "milestone-scaled"}
            />
            <ProvenanceRow
              icon={<Users className="h-3.5 w-3.5" />}
              label={t("financials.summary.provenance.sales_rep_channel")}
              detail={t("financials.summary.provenance.sales_rep_detail", {
                reps: inputs.salesRepChannel.startingReps,
                sales: inputs.salesRepChannel.salesPerRepPerMonth,
              })}
              source={t("financials.summary.provenance.source_manual_input")}
            />
            <ProvenanceRow
              icon={<Handshake className="h-3.5 w-3.5" />}
              label={t("financials.summary.provenance.partner_kickbacks")}
              detail={t("financials.summary.provenance.partners_count", { count: inputs.partnerKickbacks.length })}
              source={t("financials.summary.provenance.source_brands")}
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* 24-Month Trajectory Summary */}
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("financials.summary.trajectory.title")}
          </h4>
          <div className="space-y-2">
            {[1, 6, 12, 24].map((month) => {
              const mo = results.cohortProjection[month - 1];
              if (!mo) return null;
              return (
                <div key={month} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium w-16">{t("financials.summary.trajectory.month_label", { month })}</span>
                  <span className="tabular-nums text-muted-foreground">{t("financials.summary.trajectory.subs_label", { count: formatNumber(mo.subscribers, locale, "integer") })}</span>
                  <span className="tabular-nums">{formatNumberAsMoney(mo.revenue, locale)}</span>
                  <span className={cn("tabular-nums font-medium", mo.netProfit >= 0 ? "text-green-600" : "text-red-500")}>
                    {formatNumberAsMoney(mo.netProfit, locale)}
                  </span>
                  <span className={cn("tabular-nums text-xs", mo.cumulativeProfit >= 0 ? "text-green-600" : "text-red-500")}>
                    {t("financials.summary.trajectory.cum_label", { value: formatNumberAsMoney(mo.cumulativeProfit, locale) })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validation placeholder — will be populated in Phase 2 */}
      <ValidationPlaceholder inputs={inputs} results={results} />
    </div>
  );
}

/* ─── Sub-components ─── */

type Rating = "green" | "amber" | "red";

function VerdictCard({
  label,
  value,
  subvalue,
  rating,
  interpretation,
  icon,
}: {
  label: string;
  value: string;
  subvalue: string;
  rating: Rating;
  interpretation: string;
  icon: React.ReactNode;
}) {
  const ratingStyles: Record<Rating, string> = {
    green: "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30",
    amber: "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30",
    red: "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30",
  };

  const ratingTextStyles: Record<Rating, string> = {
    green: "text-green-700 dark:text-green-400",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-700 dark:text-red-400",
  };

  const ratingIcon: Record<Rating, React.ReactNode> = {
    green: <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />,
    amber: <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
    red: <Shield className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
  };

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", ratingStyles[rating])}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <span className={ratingTextStyles[rating]}>{icon}</span>
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", ratingTextStyles[rating])}>
        {value}
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums">{subvalue}</p>
      <div className="flex items-center gap-1.5 pt-1 border-t border-current/10">
        {ratingIcon[rating]}
        <p className={cn("text-[11px] font-medium", ratingTextStyles[rating])}>{interpretation}</p>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", color === false && "text-red-500")}>
        {value}
      </span>
    </div>
  );
}

function ProvenanceRow({
  icon,
  label,
  detail,
  href,
  source,
  isLive,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  href?: string;
  source: string;
  isLive?: boolean;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{label}</span>
          {isLive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 font-semibold uppercase tracking-wider">
              {t("financials.summary.provenance.live_badge")}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {source}
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        ) : (
          <span className="text-[10px] text-muted-foreground">{source}</span>
        )}
      </div>
    </div>
  );
}

function ValidationPlaceholder({
  inputs,
  results,
}: {
  inputs: ReturnType<typeof useFinancialStore.getState>["inputs"];
  results: NonNullable<ReturnType<typeof useFinancialStore.getState>["results"]>;
}) {
  const t = useT();
  // Basic sanity checks — full validation engine comes in Phase 2
  const warnings: string[] = [];

  const billingSum =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.biannual +
    inputs.billingCycleDistribution.annual;
  if (Math.abs(billingSum - 100) > 0.1) {
    warnings.push(t("financials.summary.validation.billing_distribution", { value: billingSum }));
  }

  const tierSum = inputs.tiers.reduce((s, tt) => s + tt.subscriberPercent, 0);
  if (inputs.tiers.length > 0 && Math.abs(tierSum - 100) > 0.1) {
    warnings.push(t("financials.summary.validation.tier_distribution", { value: tierSum }));
  }

  if (results.netMarginPercent < -50) {
    warnings.push(t("financials.summary.validation.deeply_negative"));
  }

  const profitSplitTotal = inputs.profitSplitParties?.reduce((s, p) => s + p.percent, 0) ?? 0;
  if (inputs.profitSplitParties?.length > 0 && Math.abs(profitSplitTotal - 100) > 0.1) {
    warnings.push(t("financials.summary.validation.profit_split_total", { value: profitSplitTotal }));
  }

  const avgChurn = inputs.tiers.length > 0
    ? inputs.tiers.reduce((s, tt) => s + tt.churnRateMonthly, 0) / inputs.tiers.length
    : 0;
  if (avgChurn < 2) {
    warnings.push(t("financials.summary.validation.churn_optimistic"));
  }
  if (avgChurn > 15) {
    warnings.push(t("financials.summary.validation.churn_high"));
  }

  if (warnings.length === 0) return null;

  return (
    <Card size="sm">
      <CardContent>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("financials.summary.validation.title")}
        </h4>
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <span className="text-amber-400 mt-0.5">-</span>
              {w}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Rating helpers ─── */

function getMarginRating(margin: number): Rating {
  if (margin >= 15) return "green";
  if (margin >= 0) return "amber";
  return "red";
}

function getLTVCACRating(ratio: number): Rating {
  if (ratio === Infinity || ratio >= 3) return "green";
  if (ratio >= 1.5) return "amber";
  return "red";
}

function getBreakevenRating(month: number): Rating {
  if (month <= 12) return "green";
  if (month <= 18) return "amber";
  return "red";
}
