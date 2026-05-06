"use client";

import { useState } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";

interface CohortSpreadsheetProps {
  months?: number;
  locale: Locale;
}

// "base" = aggregate view (all cohorts summed each month).
// number = acquisition month (1..24) → walks that single cohort forward.
type CohortView = "base" | number;

export function CohortSpreadsheet({ months = 12, locale }: CohortSpreadsheetProps) {
  const t = useT();
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);
  const [view, setView] = useState<CohortView>("base");

  if (!results) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border rounded-md">
        {t("financials.cohort.empty")}
      </div>
    );
  }

  // Selector lives above whichever view is active. When `view !== "base"`,
  // we render the per-cohort lifecycle table (each column is a month-of-life
  // for the chosen acquisition cohort) instead of the aggregate.
  const cohortLifecycles = results.cohortLifecycles ?? [];
  const lifecycleOptions = cohortLifecycles
    .filter((c) => c.netNewSubs > 0)
    .map((c) => ({ value: c.acquisitionMonth, label: `Cohort: Month ${c.acquisitionMonth} (${formatNumber(c.netNewSubs, locale, "integer")} subs)` }));

  const Selector = (
    <div className="flex items-center gap-2 pb-2">
      <label className="text-xs text-muted-foreground">View:</label>
      <select
        value={view === "base" ? "base" : `cohort-${view}`}
        onChange={(e) => {
          const v = e.target.value;
          setView(v === "base" ? "base" : Number(v.replace("cohort-", "")));
        }}
        className="text-xs border rounded-md bg-background px-2 py-1 min-w-[280px] hover:bg-muted/30 transition-colors"
      >
        <option value="base">All cohorts (base — aggregate)</option>
        {lifecycleOptions.map((o) => (
          <option key={o.value} value={`cohort-${o.value}`}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (view !== "base") {
    const lifecycle = cohortLifecycles.find((c) => c.acquisitionMonth === view);
    if (!lifecycle) {
      return (
        <div className="space-y-2">
          {Selector}
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border rounded-md">
            Cohort data unavailable.
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {Selector}
        <CohortLifecycleTable
          lifecycle={lifecycle}
          profitSplitParties={results.profitSplit?.parties ?? []}
          locale={locale}
        />
      </div>
    );
  }

  const data = results.cohortProjection.slice(0, months);
  const costPerSub = results.costPerSubscriber;

  // Collect unique tier IDs for per-tier breakdown
  const tierIds = data[0]?.newSubsByTier?.map((tier) => tier.tierId) ?? inputs?.tiers?.map((tier) => tier.tierId) ?? [];

  // Derived row values for each month — same shape the Spreadsheet view
  // builds, so the Cohort aggregate can render identical sections.
  const rows = data.map((mo, i) => {
    const grossNewSales = mo.newSubsFromReps + (mo.chargebacks ?? 0);
    const netNewSubs = mo.newSubsFromReps;
    const prevSubs = i > 0 ? data[i - 1].subscribers : 0;
    const churnedSubs = Math.max(0, prevSubs + netNewSubs - mo.subscribers);
    // Engine-emitted figures preferred (same source the Spreadsheet uses).
    // Fallback keeps backward compatibility with older snapshots.
    const productFulfillment = mo.cogsExpense ?? mo.subscribers * costPerSub;
    const chargebackCost = mo.chargebackCost ?? (mo.chargebacks ?? 0) * costPerSub;
    const welcomeKitCost = mo.welcomeKitCost ?? 0;
    const buckPlatform = mo.buckPlatformCost ?? 0;
    const buckLicense = mo.buckLicenseCost ?? 0;
    const buckTokens = mo.buckTokenCost ?? 0;
    const addOnCost = mo.addOnCost ?? 0;
    const commissions =
      mo.commissionExpense ??
      mo.costs -
        productFulfillment -
        mo.operationalOverhead -
        chargebackCost -
        welcomeKitCost -
        buckPlatform -
        addOnCost;
    const grossProfit = mo.revenue - productFulfillment;
    const grossMarginPct = mo.revenue > 0 ? (grossProfit / mo.revenue) * 100 : 0;
    const totalOpEx =
      commissions + buckPlatform + addOnCost + welcomeKitCost + mo.operationalOverhead;
    const netMarginPct = mo.revenue > 0 ? (mo.netProfit / mo.revenue) * 100 : 0;
    return {
      ...mo,
      grossNewSales,
      netNewSubs,
      churnedSubs,
      productFulfillment,
      grossProfit,
      grossMarginPct,
      commissions,
      buckPlatform,
      buckLicense,
      buckTokens,
      addOnCost,
      welcomeKitCost,
      totalOpEx,
      netMarginPct,
    };
  });

  // Running cumulative revenue
  const cumulativeRevenues = rows.reduce<number[]>((acc, r) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + r.revenue);
    return acc;
  }, []);

  // Totals column — same shape the Spreadsheet view's totals row uses.
  const totals = {
    activeReps: rows[rows.length - 1]?.activeReps ?? 0,
    grossNewSales: rows.reduce((s, r) => s + r.grossNewSales, 0),
    chargebacks: rows.reduce((s, r) => s + (r.chargebacks ?? 0), 0),
    netNewSubs: rows.reduce((s, r) => s + r.netNewSubs, 0),
    churnedSubs: rows.reduce((s, r) => s + r.churnedSubs, 0),
    subscribers: rows[rows.length - 1]?.subscribers ?? 0,
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    cumulativeRevenue: cumulativeRevenues[cumulativeRevenues.length - 1] ?? 0,
    productFulfillment: rows.reduce((s, r) => s + r.productFulfillment, 0),
    grossProfit: rows.reduce((s, r) => s + r.grossProfit, 0),
    grossMarginPct: 0, // averaged across months below
    commissions: rows.reduce((s, r) => s + r.commissions, 0),
    buckPlatform: rows.reduce((s, r) => s + r.buckPlatform, 0),
    buckLicense: rows.reduce((s, r) => s + r.buckLicense, 0),
    buckTokens: rows.reduce((s, r) => s + r.buckTokens, 0),
    addOnCost: rows.reduce((s, r) => s + r.addOnCost, 0),
    welcomeKitCost: rows.reduce((s, r) => s + r.welcomeKitCost, 0),
    operationalOverhead: rows.reduce((s, r) => s + r.operationalOverhead, 0),
    totalOpEx: rows.reduce((s, r) => s + r.totalOpEx, 0),
    costs: rows.reduce((s, r) => s + r.costs, 0),
    netProfit: rows.reduce((s, r) => s + r.netProfit, 0),
    cumulativeProfit: rows[rows.length - 1]?.cumulativeProfit ?? 0,
    netMarginPct: 0, // averaged across months below
  };
  totals.grossMarginPct =
    totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
  totals.netMarginPct =
    totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  // Row definitions
  type RowDef = {
    label: string;
    getValue: (idx: number) => number;
    getTotal: () => number;
    format: "currency" | "number" | "percent";
    bold?: boolean;
    profitColor?: boolean;
    lossColor?: boolean; // show in red when value > 0 (indicates a loss)
  };

  type SectionDef = {
    section: string;
    rows: RowDef[];
  };

  // Per-tier new subs breakdown rows
  const perTierNewSubsRows: RowDef[] = tierIds.length > 1 ? tierIds.map((tierId) => ({
    label: t("financials.projection.tier_indent", { tier: tierId }),
    getValue: (i: number) => {
      const entry = rows[i].newSubsByTier?.find((tier) => tier.tierId === tierId);
      return entry?.count ?? 0;
    },
    getTotal: () => rows.reduce((s, r) => {
      const entry = r.newSubsByTier?.find((tier) => tier.tierId === tierId);
      return s + (entry?.count ?? 0);
    }, 0),
    format: "number" as const,
  })) : [];

  // Per-billing-cycle revenue breakdown rows
  const hasBillingBreakdown = data[0]?.revenueByBillingCycle != null;
  const billingCycleRevenueRows: RowDef[] = hasBillingBreakdown ? [
    {
      label: t("financials.projection.row.monthly_billing"),
      getValue: (i: number) => rows[i].revenueByBillingCycle?.monthly ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.monthly ?? 0), 0),
      format: "currency" as const,
    },
    {
      label: t("financials.projection.row.biannual_billing"),
      getValue: (i: number) => rows[i].revenueByBillingCycle?.biannual ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.biannual ?? 0), 0),
      format: "currency" as const,
    },
    {
      label: t("financials.projection.row.annual_billing"),
      getValue: (i: number) => rows[i].revenueByBillingCycle?.annual ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.annual ?? 0), 0),
      format: "currency" as const,
    },
  ] : [];

  // Profit Split rows — one row per configured party. The party's share
  // of the month's net profit (only when profit is positive; losses
  // aren't distributed). Mirrors how the Spreadsheet view renders the
  // section.
  const profitSplitRows = (results.profitSplit?.parties ?? []).map((party) => ({
    label: t("financials.pl.party_label", { name: party.name, percent: party.percent }),
    getValue: (i: number) => {
      const np = rows[i].netProfit;
      return np > 0 ? np * (party.percent / 100) : 0;
    },
    getTotal: () => {
      return rows.reduce(
        (s, r) => s + (r.netProfit > 0 ? r.netProfit * (party.percent / 100) : 0),
        0,
      );
    },
    format: "currency" as const,
    profitColor: true,
  }));

  // Sections mirror the Spreadsheet view's structure (Subscribers /
  // Revenue / COGS / OpEx / Bottom Line / Profit Split) so the CFO
  // reads both tabs the same way — only the time axis differs.
  const sections: SectionDef[] = [
    {
      section: t("financials.projection.section.subscribers"),
      rows: [
        {
          label: t("financials.cohort.row.active_reps"),
          getValue: (i) => rows[i].activeReps,
          getTotal: () => totals.activeReps,
          format: "number",
        },
        {
          label: t("financials.projection.row.gross_new_sales"),
          getValue: (i) => rows[i].grossNewSales,
          getTotal: () => totals.grossNewSales,
          format: "number",
        },
        ...perTierNewSubsRows,
        ...(totals.chargebacks > 0 ? [{
          label: t("financials.projection.row.chargebacks"),
          getValue: (i: number) => rows[i].chargebacks ?? 0,
          getTotal: () => totals.chargebacks,
          format: "number" as const,
          lossColor: true,
        }] : []),
        {
          label: t("financials.projection.row.net_new_subs"),
          getValue: (i) => rows[i].netNewSubs,
          getTotal: () => totals.netNewSubs,
          format: "number",
          bold: true,
        },
        {
          label: t("financials.projection.row.lost_to_churn"),
          getValue: (i) => rows[i].churnedSubs,
          getTotal: () => totals.churnedSubs,
          format: "number",
          lossColor: true,
        },
        {
          label: t("financials.projection.row.total_active"),
          getValue: (i) => rows[i].subscribers,
          getTotal: () => totals.subscribers,
          format: "number",
          bold: true,
        },
      ],
    },
    {
      section: t("financials.projection.section.revenue"),
      rows: [
        {
          label: t("financials.projection.row.subscription_revenue"),
          getValue: (i) => rows[i].revenue,
          getTotal: () => totals.revenue,
          format: "currency",
          bold: true,
        },
        ...billingCycleRevenueRows,
      ],
    },
    {
      section: t("financials.projection.section.cogs"),
      rows: [
        {
          label: t("financials.projection.row.product_fulfillment"),
          getValue: (i) => rows[i].productFulfillment,
          getTotal: () => totals.productFulfillment,
          format: "currency",
        },
        {
          label: t("financials.projection.row.gross_profit"),
          getValue: (i) => rows[i].grossProfit,
          getTotal: () => totals.grossProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.gross_margin_pct"),
          getValue: (i) => rows[i].grossMarginPct,
          getTotal: () => totals.grossMarginPct,
          format: "percent",
        },
      ],
    },
    {
      section: t("financials.projection.section.opex"),
      rows: [
        {
          label: t("financials.projection.row.commissions"),
          getValue: (i) => rows[i].commissions,
          getTotal: () => totals.commissions,
          format: "currency",
        },
        {
          label: t("financials.projection.row.buck_license"),
          getValue: (i) => rows[i].buckLicense,
          getTotal: () => totals.buckLicense,
          format: "currency",
        },
        {
          label: t("financials.projection.row.buck_tokens"),
          getValue: (i) => rows[i].buckTokens,
          getTotal: () => totals.buckTokens,
          format: "currency",
        },
        {
          label: "Add-ons (Path Scale)",
          getValue: (i) => rows[i].addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        {
          label: "Welcome Kit",
          getValue: (i) => rows[i].welcomeKitCost,
          getTotal: () => totals.welcomeKitCost,
          format: "currency",
        },
        {
          label: t("financials.projection.row.overhead"),
          getValue: (i) => rows[i].operationalOverhead,
          getTotal: () => totals.operationalOverhead,
          format: "currency",
        },
        {
          label: t("financials.projection.row.total_opex"),
          getValue: (i) => rows[i].totalOpEx,
          getTotal: () => totals.totalOpEx,
          format: "currency",
          bold: true,
        },
      ],
    },
    {
      section: t("financials.projection.section.bottom_line"),
      rows: [
        {
          label: t("financials.projection.row.net_profit"),
          getValue: (i) => rows[i].netProfit,
          getTotal: () => totals.netProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.cumulative_profit"),
          getValue: (i) => rows[i].cumulativeProfit,
          getTotal: () => totals.cumulativeProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.net_margin_pct"),
          getValue: (i) => rows[i].netMarginPct,
          getTotal: () => totals.netMarginPct,
          format: "percent",
        },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [{
          section: t("financials.projection.section.profit_split"),
          rows: profitSplitRows,
        }]
      : []),
  ];

  function formatValue(value: number, format: "currency" | "number" | "percent"): string {
    switch (format) {
      case "currency":
        return formatNumberAsMoney(value, locale);
      case "number":
        return formatNumber(Math.round(value), locale, "integer");
      case "percent":
        return formatNumber(value / 100, locale, "percent");
    }
  }

  function valueCellClass(value: number, _format: string, profitColor?: boolean, lossColor?: boolean): string {
    const classes: string[] = ["tabular-nums text-right whitespace-nowrap px-2 py-1.5"];
    if (lossColor && value > 0) {
      classes.push("text-red-500");
    } else if (value < 0) {
      classes.push("text-red-500");
    } else if (profitColor && value > 0) {
      classes.push("text-green-600");
    } else if (profitColor && value === 0) {
      classes.push("text-muted-foreground");
    }
    return classes.join(" ");
  }

  return (
    <div className="space-y-2">
      {Selector}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 min-w-[160px] px-3 py-2 text-left font-medium text-muted-foreground">
                {t("financials.cohort.column.metric")}
              </th>
              {rows.map((_, i) => (
                <th
                  key={i}
                  className="min-w-[100px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                >
                  {t("financials.cohort.column.month_long", { month: i + 1 })}
                </th>
              ))}
              <th className="min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
                {t("financials.cohort.column.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionBlock key={section.section} section={section} months={months} formatValue={formatValue} valueCellClass={valueCellClass} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  months,
  formatValue,
  valueCellClass,
}: {
  section: { section: string; rows: { label: string; getValue: (i: number) => number; getTotal: () => number; format: "currency" | "number" | "percent"; bold?: boolean; profitColor?: boolean; lossColor?: boolean }[] };
  months: number;
  formatValue: (value: number, format: "currency" | "number" | "percent") => string;
  valueCellClass: (value: number, format: string, profitColor?: boolean, lossColor?: boolean) => string;
}) {
  return (
    <>
      {/* Section header */}
      <tr className="bg-muted/30">
        <td
          colSpan={months + 2}
          className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {section.section}
        </td>
      </tr>
      {/* Data rows */}
      {section.rows.map((row) => {
        const monthIndices = Array.from({ length: months }, (_, i) => i);
        const totalValue = row.getTotal();

        return (
          <tr key={row.label} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
            <td
              className={cn(
                "sticky left-0 z-10 bg-background min-w-[160px] px-3 py-1.5 text-muted-foreground whitespace-nowrap",
                row.bold && "font-semibold text-foreground"
              )}
            >
              {row.label}
            </td>
            {monthIndices.map((i) => {
              const value = row.getValue(i);
              return (
                <td
                  key={i}
                  className={cn(
                    valueCellClass(value, row.format, row.profitColor, row.lossColor),
                    row.bold && "font-semibold"
                  )}
                >
                  {formatValue(value, row.format)}
                </td>
              );
            })}
            {/* Total column */}
            <td
              className={cn(
                valueCellClass(totalValue, row.format, row.profitColor, row.lossColor),
                "border-l-2 border-border",
                row.bold && "font-semibold"
              )}
            >
              {formatValue(totalValue, row.format)}
            </td>
          </tr>
        );
      })}
    </>
  );
}

/**
 * Renders ONE acquisition cohort's lifetime in the 24-month window —
 * each column is a "month of life" (1 = acquisition month, 2 = first
 * month after, …) for the same starting group of subscribers, NOT a
 * calendar month with shifting active counts.
 *
 * Lets the CFO answer: "the 150 subs we acquired in January — how do
 * they pay back their CAC, where do their costs land, when do they
 * tip into profit?" The Total column is the cohort's lifetime contribution
 * within the window (revenue, cost-by-line, net profit, payback month).
 */
function CohortLifecycleTable({
  lifecycle,
  profitSplitParties,
  locale,
}: {
  lifecycle: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["cohortLifecycles"][number];
  profitSplitParties: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["profitSplit"]["parties"];
  locale: Locale;
}) {
  const t = useT();
  const {
    months,
    totals,
    acquisitionMonth,
    grossNewSubs,
    netNewSubs,
    chargebacks,
    grossNewSubsByTier,
  } = lifecycle;

  // Header summary chips — give the cohort a one-line identity above
  // the table so the user always sees what "this safra" is.
  const summaryRow = (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-muted/30 rounded-md text-xs">
      <span className="font-semibold">
        Acquired in Month {acquisitionMonth}
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">Gross:</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumber(grossNewSubs, locale, "integer")}
        </span>
      </span>
      {chargebacks > 0 && (
        <>
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="text-muted-foreground">Chargebacks:</span>{" "}
            <span className="font-semibold tabular-nums text-red-500">
              {formatNumber(chargebacks, locale, "integer")}
            </span>
          </span>
        </>
      )}
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">Net:</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumber(netNewSubs, locale, "integer")}
        </span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">Lifetime profit:</span>{" "}
        <span
          className={cn(
            "font-semibold tabular-nums",
            totals.netProfit >= 0 ? "text-emerald-600" : "text-red-500",
          )}
        >
          {formatNumberAsMoney(totals.netProfit, locale)}
        </span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">Payback:</span>{" "}
        <span className="font-semibold tabular-nums">
          {totals.paybackMonth != null
            ? `Month ${totals.paybackMonth} of life`
            : "Not within window"}
        </span>
      </span>
    </div>
  );

  type RowDef = {
    label: string;
    getValue: (m: typeof months[number]) => number;
    getTotal: () => number;
    format: "currency" | "number" | "percent";
    bold?: boolean;
    profitColor?: boolean;
    lossColor?: boolean;
  };

  type SectionDef = { section: string; rows: RowDef[] };

  // Per-month derived values: gross profit, gross margin, total opex,
  // net margin %. Same shape the aggregate (and Spreadsheet view) uses,
  // so the per-cohort table can render the same five sections —
  // Subscribers / Revenue / COGS / OpEx / Bottom Line.
  //
  // Buck Platform Fees ARE attributed per cohort (the engine emits
  // `buckCost = survivingSubs × buckCostPerSub` for each lifecycle month
  // — recurring license + AI tokens scale linearly with the cohort's
  // active subscribers). Operational overhead is the only OpEx line
  // intentionally left at $0 per cohort: it's a true scenario-level
  // fixed cost that doesn't scale with one acquisition.
  const lifecycleRows = months.map((m) => {
    const productFulfillment = m.productCost;
    const grossProfit = m.revenue - productFulfillment;
    const grossMarginPct = m.revenue > 0 ? (grossProfit / m.revenue) * 100 : 0;
    const commissions = m.commissionUpfront + m.commissionResidual;
    const overhead = 0; // not attributed per cohort
    const totalOpEx =
      commissions + m.buckCost + m.addOnCost + m.welcomeKitCost + overhead;
    const netMarginPct = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0;
    return {
      ...m,
      productFulfillment,
      grossProfit,
      grossMarginPct,
      commissions,
      overhead,
      totalOpEx,
      netMarginPct,
    };
  });

  const lifetimeTotals = {
    productFulfillment: totals.productCost,
    grossProfit: totals.revenue - totals.productCost,
    grossMarginPct:
      totals.revenue > 0
        ? ((totals.revenue - totals.productCost) / totals.revenue) * 100
        : 0,
    commissions: totals.commissionUpfront + totals.commissionResidual,
    overhead: 0,
    totalOpEx:
      totals.commissionUpfront +
      totals.commissionResidual +
      totals.buckCost +
      totals.addOnCost +
      totals.welcomeKitCost,
    netMarginPct:
      totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0,
  };

  // Profit Split — applied to the cohort's NET PROFIT each month-of-life.
  // (Only meaningful when split parties are configured at the scenario
  // level. Per-cohort attribution is informational: the actual split
  // distributes scenario-level monthly margin, not cohort-by-cohort.)
  const profitSplitRows = (profitSplitParties ?? []).map((party) => ({
    label: t("financials.pl.party_label", { name: party.name, percent: party.percent }),
    getValue: (m: CohortMonth) => (m.netProfit > 0 ? m.netProfit * (party.percent / 100) : 0),
    getTotal: () =>
      months.reduce(
        (s, m) => s + (m.netProfit > 0 ? m.netProfit * (party.percent / 100) : 0),
        0,
      ),
    format: "currency" as const,
    profitColor: true,
  }));

  // Index lookup so the lifecycle's derived rows can be read by month
  // index in the existing CohortSectionBlock signature.
  const lifecycleByMonthOfLife = new Map(
    lifecycleRows.map((r) => [r.monthOfLife, r]),
  );

  // Per-tier rows under "Subscribers" — show how the cohort's gross
  // acquisitions distribute across plans. Label carries the
  // structural tier % so the user sees both quantity and share
  // without an extra row per tier.
  const perTierSubsRows: {
    label: string;
    getValue: (m: CohortMonth) => number;
    getTotal: () => number;
    format: "number";
  }[] =
    grossNewSubsByTier && grossNewSubsByTier.length > 1
      ? grossNewSubsByTier.map((entry) => ({
          label: t("financials.projection.tier_indent_with_pct", {
            tier: entry.tierId,
            percent: formatNumber(entry.subscriberPercent / 100, locale, "percent"),
          }),
          getValue: (m: CohortMonth) =>
            m.monthOfLife === 1 ? entry.count : 0,
          getTotal: () => entry.count,
          format: "number" as const,
        }))
      : [];

  // Per-tier sub-rows under each billing cycle row — show which plan
  // generated each chunk of monthly/biannual/annual revenue. Sums per
  // cycle across tiers reconcile exactly with the parent cycle row.
  // Hidden when there's only one tier (the breakdown would be
  // redundant with the parent).
  const buildCyclePerTierRows = (
    cycle: "monthly" | "biannual" | "annual",
  ): {
    label: string;
    getValue: (m: CohortMonth) => number;
    getTotal: () => number;
    format: "currency";
  }[] => {
    if (!grossNewSubsByTier || grossNewSubsByTier.length <= 1) return [];
    return grossNewSubsByTier.map((tierEntry) => ({
      // Subscriber count alongside the plan name lets the user audit
      // each cycle's revenue: e.g. "Legend (34 subs)" + $X annual reads
      // as "34 Legend subs prepaid annual at $X/year". Counts come from
      // the engine's largest-remainder split, so they reconcile with
      // the cohort's per-tier total.
      label: t("financials.projection.tier_subindent_with_count", {
        tier: tierEntry.tierId,
        count: formatNumber(tierEntry.subsByCycle[cycle], locale, "integer"),
      }),
      getValue: (m: CohortMonth) => {
        const e = m.revenueByTierAndCycle?.find(
          (x) => x.tierId === tierEntry.tierId,
        );
        return e ? e[cycle] : 0;
      },
      getTotal: () => {
        const e = totals.revenueByTierAndCycle?.find(
          (x) => x.tierId === tierEntry.tierId,
        );
        return e ? e[cycle] : 0;
      },
      format: "currency" as const,
    }));
  };

  const sections: SectionDef[] = [
    {
      section: t("financials.projection.section.subscribers"),
      rows: [
        // Subscribers — the cohort's gross acquisitions. Static row:
        // the cohort's size at signup is `grossNewSubs`, shown in Mo 1
        // and zero everywhere after (no new subs join an existing cohort).
        {
          label: "Subscribers",
          getValue: (m) => (m.monthOfLife === 1 ? grossNewSubs : 0),
          getTotal: () => grossNewSubs,
          format: "number",
          bold: true,
        },
        // Per-tier breakdown of those gross acquisitions — counts sum to
        // `grossNewSubs`. Shown as nested rows so the user can see at a
        // glance which plan each new subscriber chose.
        ...perTierSubsRows,
        // Lost to Chargeback — chargebacks from this cohort's gross
        // acquisitions. One-time at Mo 1.
        {
          label: "Lost to Chargeback",
          getValue: (m) => (m.monthOfLife === 1 ? chargebacks : 0),
          getTotal: () => chargebacks,
          format: "number",
          lossColor: true,
        },
        // Active Subscribers — surviving subs at this month-of-life
        // (post-chargeback at Mo 1, then post-churn from Mo 4 onward
        // once the commit period ends).
        {
          label: "Active Subscribers",
          getValue: (m) => m.survivingSubs,
          getTotal: () => months[months.length - 1]?.survivingSubs ?? 0,
          format: "number",
          bold: true,
        },
        {
          label: t("financials.projection.row.lost_to_churn"),
          getValue: (m) => m.churned,
          getTotal: () => months.reduce((s, m) => s + m.churned, 0),
          format: "number",
          lossColor: true,
        },
      ],
    },
    {
      section: t("financials.projection.section.revenue"),
      rows: [
        {
          label: t("financials.projection.row.subscription_revenue"),
          getValue: (m) => m.revenue,
          getTotal: () => totals.revenue,
          format: "currency",
          bold: true,
        },
        // Per-billing-cycle breakdown — CASH-FLOW VIEW. Monthly
        // billing recurs every month; biannual lumps at Mo 1/7/13/19
        // (subs prepay 6 months at signup and again every 6 months);
        // annual lumps at Mo 1/13. Outside lump months these sub-rows
        // read $0.00 — that's the correct cash-flow truth, not a bug.
        // Each cycle row is followed by per-tier sub-rows showing
        // which plan generated each chunk of revenue (suppressed when
        // there's only one tier).
        {
          label: t("financials.projection.row.monthly_billing"),
          getValue: (m) => m.revenueByBillingCycle.monthly,
          getTotal: () => totals.revenueByBillingCycle.monthly,
          format: "currency",
        },
        ...buildCyclePerTierRows("monthly"),
        {
          label: t("financials.projection.row.biannual_billing"),
          getValue: (m) => m.revenueByBillingCycle.biannual,
          getTotal: () => totals.revenueByBillingCycle.biannual,
          format: "currency",
        },
        ...buildCyclePerTierRows("biannual"),
        {
          label: t("financials.projection.row.annual_billing"),
          getValue: (m) => m.revenueByBillingCycle.annual,
          getTotal: () => totals.revenueByBillingCycle.annual,
          format: "currency",
        },
        ...buildCyclePerTierRows("annual"),
      ],
    },
    {
      section: t("financials.projection.section.cogs"),
      rows: [
        // Three-line breakdown — product COGS and shipping/handling
        // recur every month with the active base; payment processing
        // lumps with the cash inflows (per-transaction fee).
        {
          label: "Product cost",
          getValue: (m) => m.productCogsCost,
          getTotal: () => totals.productCogsCost,
          format: "currency",
        },
        {
          label: "Shipping + Handling",
          getValue: (m) => m.shippingHandlingCost,
          getTotal: () => totals.shippingHandlingCost,
          format: "currency",
        },
        {
          label: "Payment Processing",
          getValue: (m) => m.paymentProcessingCost,
          getTotal: () => totals.paymentProcessingCost,
          format: "currency",
        },
        {
          label: t("financials.projection.row.gross_profit"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.grossProfit ?? 0,
          getTotal: () => lifetimeTotals.grossProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.gross_margin_pct"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.grossMarginPct ?? 0,
          getTotal: () => lifetimeTotals.grossMarginPct,
          format: "percent",
        },
      ],
    },
    {
      section: t("financials.projection.section.opex"),
      rows: [
        {
          label: t("financials.projection.row.commissions"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.commissions ?? 0,
          getTotal: () => lifetimeTotals.commissions,
          format: "currency",
        },
        {
          // License — Buck receives the full billing window upfront.
          // Monthly subs contribute every month; biannual subs lump at
          // Mo 1/7/13/19 (6× monthly license at signup and renewal);
          // annual subs lump at Mo 1/13. The lump pattern mirrors the
          // revenue rows above so audits reconcile cleanly.
          label: t("financials.projection.row.buck_license"),
          getValue: (m) => m.buckLicenseCost,
          getTotal: () => totals.buckLicenseCost,
          format: "currency",
        },
        {
          // Tokens — AI consumption accrues continuously, so the
          // platform charges per active sub every month regardless of
          // billing cycle.
          label: t("financials.projection.row.buck_tokens"),
          getValue: (m) => m.buckTokenCost,
          getTotal: () => totals.buckTokenCost,
          format: "currency",
        },
        {
          label: "Add-ons (Path Scale)",
          getValue: (m) => m.addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        {
          label: "Welcome Kit",
          getValue: (m) => m.welcomeKitCost,
          getTotal: () => totals.welcomeKitCost,
          format: "currency",
        },
        {
          label: t("financials.projection.row.overhead"),
          getValue: () => 0,
          getTotal: () => 0,
          format: "currency",
        },
        {
          label: t("financials.projection.row.total_opex"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.totalOpEx ?? 0,
          getTotal: () => lifetimeTotals.totalOpEx,
          format: "currency",
          bold: true,
        },
      ],
    },
    {
      section: t("financials.projection.section.bottom_line"),
      rows: [
        {
          label: t("financials.projection.row.net_profit"),
          getValue: (m) => m.netProfit,
          getTotal: () => totals.netProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.cumulative_profit"),
          getValue: (m) => m.cumulativeProfit,
          getTotal: () => months[months.length - 1]?.cumulativeProfit ?? 0,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.net_margin_pct"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.netMarginPct ?? 0,
          getTotal: () => lifetimeTotals.netMarginPct,
          format: "percent",
        },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [{
          section: t("financials.projection.section.profit_split"),
          rows: profitSplitRows,
        }]
      : []),
  ];

  function formatValue(v: number, fmt: "currency" | "number" | "percent"): string {
    switch (fmt) {
      case "currency":
        return formatNumberAsMoney(v, locale);
      case "number":
        return formatNumber(Math.round(v), locale, "integer");
      case "percent":
        return formatNumber(v / 100, locale, "percent");
    }
  }

  function valueCellClass(
    value: number,
    profitColor?: boolean,
    lossColor?: boolean,
  ): string {
    const classes = ["tabular-nums text-right whitespace-nowrap px-2 py-1.5"];
    if (lossColor && value > 0) classes.push("text-red-500");
    else if (value < 0) classes.push("text-red-500");
    else if (profitColor && value > 0) classes.push("text-emerald-600");
    else if (profitColor && value === 0) classes.push("text-muted-foreground");
    return classes.join(" ");
  }

  return (
    <div className="space-y-2">
      {summaryRow}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">
                {t("financials.cohort.column.metric")}
              </th>
              {months.map((m) => (
                <th
                  key={m.monthOfLife}
                  className="min-w-[90px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                  title={`Calendar Month ${m.monthIndex}`}
                >
                  Mo {m.monthOfLife}
                </th>
              ))}
              <th className="min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
                Lifetime
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <CohortSectionBlock
                key={section.section}
                section={section}
                months={months}
                formatValue={formatValue}
                valueCellClass={valueCellClass}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type CohortMonth = NonNullable<
  ReturnType<typeof useFinancialStore.getState>["results"]
>["cohortLifecycles"][number]["months"][number];

function CohortSectionBlock({
  section,
  months,
  formatValue,
  valueCellClass,
}: {
  section: {
    section: string;
    rows: {
      label: string;
      getValue: (m: CohortMonth) => number;
      getTotal: () => number;
      format: "currency" | "number" | "percent";
      bold?: boolean;
      profitColor?: boolean;
      lossColor?: boolean;
    }[];
  };
  months: CohortMonth[];
  formatValue: (v: number, f: "currency" | "number" | "percent") => string;
  valueCellClass: (v: number, profitColor?: boolean, lossColor?: boolean) => string;
}) {
  return (
    <>
      <tr className="bg-muted/30">
        <td
          colSpan={months.length + 2}
          className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {section.section}
        </td>
      </tr>
      {section.rows.map((row) => {
        const totalValue = row.getTotal();
        return (
          <tr
            key={row.label}
            className="border-b border-border/40 hover:bg-muted/10 transition-colors"
          >
            <td
              className={cn(
                "sticky left-0 z-10 bg-background min-w-[200px] px-3 py-1.5 text-muted-foreground whitespace-nowrap",
                row.bold && "font-semibold text-foreground",
              )}
            >
              {row.label}
            </td>
            {months.map((m) => {
              const value = row.getValue(m);
              return (
                <td
                  key={m.monthOfLife}
                  className={cn(
                    valueCellClass(value, row.profitColor, row.lossColor),
                    row.bold && "font-semibold",
                  )}
                >
                  {formatValue(value, row.format)}
                </td>
              );
            })}
            <td
              className={cn(
                valueCellClass(totalValue, row.profitColor, row.lossColor),
                "border-l-2 border-border",
                row.bold && "font-semibold",
              )}
            >
              {formatValue(totalValue, row.format)}
            </td>
          </tr>
        );
      })}
    </>
  );
}
