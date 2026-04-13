"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { formatCurrency, cn } from "@/lib/utils";

interface CohortSpreadsheetProps {
  months?: number;
}

export function CohortSpreadsheet({ months = 12 }: CohortSpreadsheetProps) {
  const results = useFinancialStore((s) => s.results);

  if (!results) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border rounded-md">
        No results yet. Configure inputs to generate the cohort analysis.
      </div>
    );
  }

  const data = results.cohortProjection.slice(0, months);
  const costPerSub = results.costPerSubscriber;
  const inputs = useFinancialStore((s) => s.inputs);

  // Collect unique tier IDs for per-tier breakdown
  const tierIds = data[0]?.newSubsByTier?.map((t) => t.tierId) ?? inputs?.tiers?.map((t) => t.tierId) ?? [];

  // Derived row values for each month
  const rows = data.map((m, i) => {
    const grossNewSales = m.newSubsFromReps + (m.chargebacks ?? 0);
    const netNewSubs = m.newSubsFromReps;
    const prevSubs = i > 0 ? data[i - 1].subscribers : 0;
    const churnedSubs = Math.max(0, prevSubs + netNewSubs - m.subscribers);
    const cogs = m.subscribers * costPerSub;
    const chargebackCost = (m.chargebacks ?? 0) * costPerSub; // COGS lost on chargebacks
    const commissions = m.costs - cogs - m.operationalOverhead - chargebackCost;
    const marginPercent = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0;
    return { ...m, grossNewSales, netNewSubs, churnedSubs, cogs, commissions, marginPercent };
  });

  // Running cumulative revenue
  let cumulativeRevenue = 0;
  const cumulativeRevenues = rows.map((r) => {
    cumulativeRevenue += r.revenue;
    return cumulativeRevenue;
  });

  // Totals column
  const totals = {
    activeReps: rows[rows.length - 1]?.activeReps ?? 0,
    grossNewSales: rows.reduce((s, r) => s + r.grossNewSales, 0),
    chargebacks: rows.reduce((s, r) => s + (r.chargebacks ?? 0), 0),
    netNewSubs: rows.reduce((s, r) => s + r.netNewSubs, 0),
    churnedSubs: rows.reduce((s, r) => s + r.churnedSubs, 0),
    subscribers: rows[rows.length - 1]?.subscribers ?? 0,
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    cumulativeRevenue: cumulativeRevenues[cumulativeRevenues.length - 1] ?? 0,
    cogs: rows.reduce((s, r) => s + r.cogs, 0),
    commissions: rows.reduce((s, r) => s + r.commissions, 0),
    operationalOverhead: rows.reduce((s, r) => s + r.operationalOverhead, 0),
    costs: rows.reduce((s, r) => s + r.costs, 0),
    netProfit: rows.reduce((s, r) => s + r.netProfit, 0),
    cumulativeProfit: rows[rows.length - 1]?.cumulativeProfit ?? 0,
    marginPercent: 0,
  };
  const totalRevSum = totals.revenue;
  const totalProfitSum = totals.netProfit;
  totals.marginPercent = totalRevSum > 0 ? (totalProfitSum / totalRevSum) * 100 : 0;

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
    label: `  └ ${tierId}`,
    getValue: (i: number) => {
      const entry = rows[i].newSubsByTier?.find((t) => t.tierId === tierId);
      return entry?.count ?? 0;
    },
    getTotal: () => rows.reduce((s, r) => {
      const entry = r.newSubsByTier?.find((t) => t.tierId === tierId);
      return s + (entry?.count ?? 0);
    }, 0),
    format: "number" as const,
  })) : [];

  // Per-billing-cycle revenue breakdown rows
  const hasBillingBreakdown = data[0]?.revenueByBillingCycle != null;
  const billingCycleRevenueRows: RowDef[] = hasBillingBreakdown ? [
    {
      label: "  └ Monthly Billing",
      getValue: (i: number) => rows[i].revenueByBillingCycle?.monthly ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.monthly ?? 0), 0),
      format: "currency" as const,
    },
    {
      label: "  └ Quarterly Billing",
      getValue: (i: number) => rows[i].revenueByBillingCycle?.quarterly ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.quarterly ?? 0), 0),
      format: "currency" as const,
    },
    {
      label: "  └ Annual Billing",
      getValue: (i: number) => rows[i].revenueByBillingCycle?.annual ?? 0,
      getTotal: () => rows.reduce((s, r) => s + (r.revenueByBillingCycle?.annual ?? 0), 0),
      format: "currency" as const,
    },
  ] : [];

  const sections: SectionDef[] = [
    {
      section: "Acquisition",
      rows: [
        {
          label: "Active Reps",
          getValue: (i) => rows[i].activeReps,
          getTotal: () => totals.activeReps,
          format: "number",
        },
        {
          label: "Gross New Sales",
          getValue: (i) => rows[i].grossNewSales,
          getTotal: () => totals.grossNewSales,
          format: "number",
        },
        ...perTierNewSubsRows,
        ...(totals.chargebacks > 0 ? [{
          label: "Chargebacks",
          getValue: (i: number) => rows[i].chargebacks ?? 0,
          getTotal: () => totals.chargebacks,
          format: "number" as const,
          lossColor: true,
        }] : []),
        {
          label: "Net New Subs",
          getValue: (i) => rows[i].netNewSubs,
          getTotal: () => totals.netNewSubs,
          format: "number",
          bold: true,
        },
        {
          label: "Lost to Churn",
          getValue: (i) => rows[i].churnedSubs,
          getTotal: () => totals.churnedSubs,
          format: "number",
          lossColor: true,
        },
        {
          label: "Total Active Subs",
          getValue: (i) => rows[i].subscribers,
          getTotal: () => totals.subscribers,
          format: "number",
          bold: true,
        },
      ],
    },
    {
      section: "Revenue",
      rows: [
        {
          label: "Monthly Revenue",
          getValue: (i) => rows[i].revenue,
          getTotal: () => totals.revenue,
          format: "currency",
          bold: true,
        },
        ...billingCycleRevenueRows,
        {
          label: "Cumulative Revenue",
          getValue: (i) => cumulativeRevenues[i],
          getTotal: () => totals.cumulativeRevenue,
          format: "currency",
          bold: true,
        },
      ],
    },
    {
      section: "Costs",
      rows: [
        {
          label: "COGS",
          getValue: (i) => rows[i].cogs,
          getTotal: () => totals.cogs,
          format: "currency",
        },
        {
          label: "Commissions",
          getValue: (i) => rows[i].commissions,
          getTotal: () => totals.commissions,
          format: "currency",
        },
        {
          label: "Overhead",
          getValue: (i) => rows[i].operationalOverhead,
          getTotal: () => totals.operationalOverhead,
          format: "currency",
        },
        {
          label: "Total Costs",
          getValue: (i) => rows[i].costs,
          getTotal: () => totals.costs,
          format: "currency",
          bold: true,
        },
      ],
    },
    {
      section: "Profitability",
      rows: [
        {
          label: "Monthly Net Profit",
          getValue: (i) => rows[i].netProfit,
          getTotal: () => totals.netProfit,
          format: "currency",
          bold: true,
        },
        {
          label: "Cumulative Profit",
          getValue: (i) => rows[i].cumulativeProfit,
          getTotal: () => totals.cumulativeProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: "Monthly Margin %",
          getValue: (i) => rows[i].marginPercent,
          getTotal: () => totals.marginPercent,
          format: "percent",
          bold: true,
        },
      ],
    },
  ];

  function formatValue(value: number, format: "currency" | "number" | "percent"): string {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "number":
        return new Intl.NumberFormat("en-US").format(Math.round(value));
      case "percent":
        return `${value.toFixed(1)}%`;
    }
  }

  function valueCellClass(value: number, format: string, profitColor?: boolean, lossColor?: boolean): string {
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
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 min-w-[160px] px-3 py-2 text-left font-medium text-muted-foreground">
              Metric
            </th>
            {rows.map((_, i) => (
              <th
                key={i}
                className="min-w-[100px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
              >
                Month {i + 1}
              </th>
            ))}
            <th className="min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
              Total
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
