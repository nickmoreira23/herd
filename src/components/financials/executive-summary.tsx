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
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import Link from "next/link";

export function ExecutiveSummary() {
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No results yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the scenario inputs to see the executive summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  const netMarginPercent = results.netMarginPercent;
  const ltvCacRatio = results.ltvCac.ltvCacRatio;
  const breakevenMonth = results.operationBreakevenMonth;

  return (
    <div className="space-y-4">
      {/* Verdict Cards */}
      <div className="grid grid-cols-3 gap-3">
        <VerdictCard
          label="Net Margin"
          value={formatPercent(netMarginPercent)}
          subvalue={`${formatCurrency(results.netMarginDollars)}/mo`}
          rating={getMarginRating(netMarginPercent)}
          interpretation={getMarginInterpretation(netMarginPercent)}
          icon={netMarginPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        />
        <VerdictCard
          label="LTV:CAC Ratio"
          value={ltvCacRatio === Infinity ? "∞" : `${ltvCacRatio.toFixed(1)}x`}
          subvalue={`LTV ${results.ltvCac.blendedLTV === Infinity ? "∞" : formatCurrency(results.ltvCac.blendedLTV)} / CAC ${formatCurrency(results.ltvCac.blendedCAC)}`}
          rating={getLTVCACRating(ltvCacRatio)}
          interpretation={getLTVCACInterpretation(ltvCacRatio)}
          icon={<Target className="h-4 w-4" />}
        />
        <VerdictCard
          label="Breakeven"
          value={breakevenMonth === Infinity ? "Never" : `Month ${breakevenMonth}`}
          subvalue={breakevenMonth !== Infinity ? `${breakevenMonth <= 12 ? "Within Year 1" : "Year 2"}` : "Cumulative profit stays negative"}
          rating={getBreakevenRating(breakevenMonth)}
          interpretation={getBreakevenInterpretation(breakevenMonth)}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Key Metrics At-a-Glance */}
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <MetricRow label="MRR" value={formatCurrency(results.mrr)} />
            <MetricRow label="ARR" value={formatCurrency(results.arr)} />
            <MetricRow label="Gross Margin" value={formatPercent(results.grossMarginPercent)} color={results.grossMarginPercent >= 50} />
            <MetricRow label="New Subs/Mo" value={results.newSubscribersPerMonth.toLocaleString()} />
            <MetricRow label="Commission % of Revenue" value={formatPercent(results.commissionPercentOfRevenue)} />
            <MetricRow label="Cost/Subscriber" value={formatCurrency(results.costPerSubscriber)} />
            <MetricRow label="Payback Period" value={results.ltvCac.monthsToPayback === Infinity ? "∞" : `${results.ltvCac.monthsToPayback.toFixed(1)} months`} />
            <MetricRow label="Mo 24 Subscribers" value={results.cohortProjection[23]?.subscribers.toLocaleString() ?? "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Assumption Provenance */}
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Assumption Sources
          </h4>
          <div className="space-y-2">
            <ProvenanceRow
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Tier Pricing"
              detail={`${inputs.tiers.length} tiers configured`}
              href="/admin/tiers"
              source="Plans page"
            />
            <ProvenanceRow
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Commissions"
              detail={`$${inputs.commissionStructure.flatBonusPerSale} bonus + ${inputs.commissionStructure.residualPercent}% residual`}
              href="/admin/network/promoters"
              source="Promoters page"
            />
            <ProvenanceRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="OPEX"
              detail={inputs.operationalOverhead.mode === "milestone-scaled"
                ? `Auto-scaled from ${inputs.operationalOverhead.opexData?.length ?? 0} categories`
                : `Fixed at ${formatCurrency(inputs.operationalOverhead.fixedMonthly)}/mo`}
              href="/admin/operation"
              source={inputs.operationalOverhead.mode === "milestone-scaled" ? "Operations page (live)" : "Manual override"}
              isLive={inputs.operationalOverhead.mode === "milestone-scaled"}
            />
            <ProvenanceRow
              icon={<Users className="h-3.5 w-3.5" />}
              label="Sales Rep Channel"
              detail={`${inputs.salesRepChannel.startingReps} reps, ${inputs.salesRepChannel.salesPerRepPerMonth} sales/rep/mo`}
              source="Manual input"
            />
            <ProvenanceRow
              icon={<Handshake className="h-3.5 w-3.5" />}
              label="Partner Kickbacks"
              detail={`${inputs.partnerKickbacks.length} active partners`}
              href="/admin/blocks/partners"
              source="Brands page"
            />
          </div>
        </CardContent>
      </Card>

      {/* 24-Month Trajectory Summary */}
      <Card size="sm">
        <CardContent>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            24-Month Trajectory
          </h4>
          <div className="space-y-2">
            {[1, 6, 12, 24].map((month) => {
              const mo = results.cohortProjection[month - 1];
              if (!mo) return null;
              return (
                <div key={month} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium w-16">Mo {month}</span>
                  <span className="tabular-nums text-muted-foreground">{mo.subscribers.toLocaleString()} subs</span>
                  <span className="tabular-nums">{formatCurrency(mo.revenue)}</span>
                  <span className={cn("tabular-nums font-medium", mo.netProfit >= 0 ? "text-green-600" : "text-red-500")}>
                    {formatCurrency(mo.netProfit)}
                  </span>
                  <span className={cn("tabular-nums text-xs", mo.cumulativeProfit >= 0 ? "text-green-600" : "text-red-500")}>
                    Cum: {formatCurrency(mo.cumulativeProfit)}
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
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{label}</span>
          {isLive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 font-semibold uppercase tracking-wider">
              Live
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
  // Basic sanity checks — full validation engine comes in Phase 2
  const warnings: string[] = [];

  const billingSum =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.quarterly +
    inputs.billingCycleDistribution.annual;
  if (Math.abs(billingSum - 100) > 0.1) {
    warnings.push(`Billing distribution sums to ${billingSum}%, not 100%`);
  }

  const tierSum = inputs.tiers.reduce((s, t) => s + t.subscriberPercent, 0);
  if (inputs.tiers.length > 0 && Math.abs(tierSum - 100) > 0.1) {
    warnings.push(`Tier subscriber distribution sums to ${tierSum}%, not 100%`);
  }

  if (results.netMarginPercent < -50) {
    warnings.push("Net margin is deeply negative — review cost assumptions");
  }

  const profitSplitTotal = inputs.profitSplitParties?.reduce((s, p) => s + p.percent, 0) ?? 0;
  if (inputs.profitSplitParties?.length > 0 && Math.abs(profitSplitTotal - 100) > 0.1) {
    warnings.push(`Profit split percentages total ${profitSplitTotal}%, not 100%`);
  }

  const avgChurn = inputs.tiers.length > 0
    ? inputs.tiers.reduce((s, t) => s + t.churnRateMonthly, 0) / inputs.tiers.length
    : 0;
  if (avgChurn < 2) {
    warnings.push("Average churn below 2% is very optimistic for a subscription business");
  }
  if (avgChurn > 15) {
    warnings.push("Average churn above 15% is very high — retention strategy needed");
  }

  if (warnings.length === 0) return null;

  return (
    <Card size="sm">
      <CardContent>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Validation Notes
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

function getMarginInterpretation(margin: number): string {
  if (margin >= 25) return "Strong unit economics — supports aggressive scaling";
  if (margin >= 15) return "Healthy margins — room to invest in growth";
  if (margin >= 5) return "Thin margins — monitor costs closely";
  if (margin >= 0) return "Breaking even — optimize before scaling";
  return "Negative margins — restructure costs before scaling";
}

function getLTVCACRating(ratio: number): Rating {
  if (ratio === Infinity || ratio >= 3) return "green";
  if (ratio >= 1.5) return "amber";
  return "red";
}

function getLTVCACInterpretation(ratio: number): string {
  if (ratio === Infinity) return "Infinite — zero churn means customers never leave";
  if (ratio >= 5) return "Excellent — every dollar spent acquires 5x+ in lifetime value";
  if (ratio >= 3) return "Healthy — unit economics support scaling";
  if (ratio >= 1.5) return "Cautious — positive but low margin for error";
  if (ratio >= 1) return "Barely positive — acquisition cost nearly equals lifetime value";
  return "Negative — you lose money on every customer acquired";
}

function getBreakevenRating(month: number): Rating {
  if (month <= 12) return "green";
  if (month <= 18) return "amber";
  return "red";
}

function getBreakevenInterpretation(month: number): string {
  if (month === Infinity) return "Does not break even within 24 months";
  if (month <= 6) return "Fast payback — capital efficient model";
  if (month <= 12) return "Solid — profitability within Year 1";
  if (month <= 18) return "Moderate runway — plan for 18 months of funding";
  return "Long runway needed — 2+ years to profitability";
}
