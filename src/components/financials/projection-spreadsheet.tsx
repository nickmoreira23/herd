"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

interface ProjectionSpreadsheetProps {
  months?: number;
}

type RowType = "currency" | "number" | "percent";
type TotalMode = "sum" | "average" | "latest";

interface RowDef {
  label: string;
  type: RowType;
  totalMode: TotalMode;
  values: number[];
  bold?: boolean;
  colorBySign?: boolean;
}

interface SectionDef {
  header: string;
  rows: RowDef[];
}

function formatCell(value: number, type: RowType): string {
  switch (type) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "number":
      return Math.round(value).toLocaleString("en-US");
  }
}

function computeTotal(values: number[], mode: TotalMode): number {
  if (values.length === 0) return 0;
  switch (mode) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "latest":
      return values[values.length - 1];
  }
}

export function ProjectionSpreadsheet({ months = 12 }: ProjectionSpreadsheetProps) {
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm font-medium">No results yet</p>
      </div>
    );
  }

  const projection = results.cohortProjection.slice(0, months);
  const costPerSub = results.costPerSubscriber;

  // Collect unique tier IDs for per-tier breakdown
  const tierIds = projection[0]?.newSubsByTier?.map((t) => t.tierId) ?? inputs?.tiers?.map((t) => t.tierId) ?? [];

  // Build row data for each month
  const grossNewSales: number[] = [];
  const chargebacks: number[] = [];
  const newSubs: number[] = [];
  const churned: number[] = [];
  const totalActive: number[] = [];
  const subscriptionRevenue: number[] = [];
  const productFulfillment: number[] = [];
  const grossProfit: number[] = [];
  const grossMarginPct: number[] = [];
  const commissions: number[] = [];
  const overhead: number[] = [];
  const totalOpEx: number[] = [];
  const netProfit: number[] = [];
  const cumulativeProfit: number[] = [];
  const netMarginPct: number[] = [];

  for (let i = 0; i < projection.length; i++) {
    const curr = projection[i];
    const prev = i > 0 ? projection[i - 1] : null;

    const monthChargebacks = curr.chargebacks ?? 0;
    const monthGrossNew = curr.newSubsFromReps + monthChargebacks;
    grossNewSales.push(monthGrossNew);
    chargebacks.push(monthChargebacks);
    const monthNewSubs = curr.newSubsFromReps;
    newSubs.push(monthNewSubs);

    const prevSubs = prev ? prev.subscribers : 0;
    const monthChurned = prevSubs + monthNewSubs - curr.subscribers;
    churned.push(monthChurned);

    totalActive.push(curr.subscribers);
    subscriptionRevenue.push(curr.revenue);

    const monthCOGS = curr.subscribers * costPerSub;
    productFulfillment.push(monthCOGS);

    const monthGross = curr.revenue - monthCOGS;
    grossProfit.push(monthGross);

    const monthGrossMargin = curr.revenue > 0 ? (monthGross / curr.revenue) * 100 : 0;
    grossMarginPct.push(monthGrossMargin);

    // Derive commissions: costs - subscriberCOGS - overhead
    const monthCommissions = curr.costs - monthCOGS - curr.operationalOverhead;
    commissions.push(monthCommissions);

    overhead.push(curr.operationalOverhead);

    const monthTotalOpEx = monthCommissions + curr.operationalOverhead;
    totalOpEx.push(monthTotalOpEx);

    netProfit.push(curr.netProfit);
    cumulativeProfit.push(curr.cumulativeProfit);

    const monthNetMargin = curr.revenue > 0 ? (curr.netProfit / curr.revenue) * 100 : 0;
    netMarginPct.push(monthNetMargin);
  }

  // Profit split rows
  const profitSplitRows: RowDef[] = [];
  if (results.profitSplit.parties.length > 0) {
    for (const party of results.profitSplit.parties) {
      const partyValues = netProfit.map((np) =>
        np > 0 ? np * (party.percent / 100) : 0
      );
      profitSplitRows.push({
        label: `${party.name} (${party.percent}%)`,
        type: "currency",
        totalMode: "sum",
        values: partyValues,
        colorBySign: true,
      });
    }
  }

  // Per-tier breakdown of new sales
  const perTierNewSalesRows: RowDef[] = tierIds.length > 1 ? tierIds.map((tierId) => ({
    label: `  └ ${tierId}`,
    type: "number" as const,
    totalMode: "sum" as const,
    values: projection.map((m) => {
      const entry = m.newSubsByTier?.find((t) => t.tierId === tierId);
      return entry?.count ?? 0;
    }),
  })) : [];

  // Per-billing-cycle revenue breakdown
  const hasBillingBreakdown = projection[0]?.revenueByBillingCycle != null;
  const billingCycleRows: RowDef[] = hasBillingBreakdown ? [
    { label: "  └ Monthly Billing", type: "currency" as const, totalMode: "sum" as const, values: projection.map((m) => m.revenueByBillingCycle?.monthly ?? 0) },
    { label: "  └ Quarterly Billing", type: "currency" as const, totalMode: "sum" as const, values: projection.map((m) => m.revenueByBillingCycle?.quarterly ?? 0) },
    { label: "  └ Annual Billing", type: "currency" as const, totalMode: "sum" as const, values: projection.map((m) => m.revenueByBillingCycle?.annual ?? 0) },
  ] : [];

  const sections: SectionDef[] = [
    {
      header: "Subscribers",
      rows: [
        { label: "Gross New Sales", type: "number", totalMode: "sum", values: grossNewSales },
        ...perTierNewSalesRows,
        ...(chargebacks.some((v) => v > 0) ? [
          { label: "Chargebacks", type: "number" as const, totalMode: "sum" as const, values: chargebacks, colorBySign: false },
        ] : []),
        { label: "Net New Subs", type: "number", totalMode: "sum", values: newSubs, bold: true },
        { label: "Lost to Churn", type: "number", totalMode: "sum", values: churned },
        { label: "Total Active", type: "number", totalMode: "latest", values: totalActive, bold: true },
      ],
    },
    {
      header: "Revenue",
      rows: [
        { label: "Subscription Revenue", type: "currency", totalMode: "sum", values: subscriptionRevenue },
        ...billingCycleRows,
      ],
    },
    {
      header: "Cost of Goods",
      rows: [
        { label: "Product & Fulfillment", type: "currency", totalMode: "sum", values: productFulfillment },
        { label: "Gross Profit", type: "currency", totalMode: "sum", values: grossProfit, bold: true, colorBySign: true },
        { label: "Gross Margin %", type: "percent", totalMode: "average", values: grossMarginPct },
      ],
    },
    {
      header: "Operating Expenses",
      rows: [
        { label: "Commissions", type: "currency", totalMode: "sum", values: commissions },
        { label: "Overhead", type: "currency", totalMode: "sum", values: overhead },
        { label: "Total OpEx", type: "currency", totalMode: "sum", values: totalOpEx, bold: true },
      ],
    },
    {
      header: "Bottom Line",
      rows: [
        { label: "Net Profit", type: "currency", totalMode: "sum", values: netProfit, bold: true, colorBySign: true },
        { label: "Cumulative Profit", type: "currency", totalMode: "latest", values: cumulativeProfit, colorBySign: true },
        { label: "Net Margin %", type: "percent", totalMode: "average", values: netMarginPct },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [
          {
            header: "Profit Split",
            rows: profitSplitRows,
          },
        ]
      : []),
  ];

  const monthLabels = projection.map((_, i) => `M${i + 1}`);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 w-[180px] min-w-[180px] px-3 py-2 text-left font-medium">
              &nbsp;
            </th>
            {monthLabels.map((label) => (
              <th
                key={label}
                className="w-[100px] min-w-[100px] px-2 py-2 text-right font-medium tabular-nums"
              >
                {label}
              </th>
            ))}
            <th className="w-[100px] min-w-[100px] px-2 py-2 text-right font-medium border-l">
              Total/Avg
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionGroup key={section.header} section={section} months={months} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionGroup({ section, months }: { section: SectionDef; months: number }) {
  return (
    <>
      {/* Section header row */}
      <tr className="bg-muted/30">
        <td
          colSpan={months + 2}
          className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {section.header}
        </td>
      </tr>
      {/* Data rows */}
      {section.rows.map((row) => (
        <DataRow key={row.label} row={row} />
      ))}
    </>
  );
}

function DataRow({ row }: { row: RowDef }) {
  const total = computeTotal(row.values, row.totalMode);

  return (
    <tr className="border-b border-border/50 hover:bg-muted/10">
      {/* Sticky label column */}
      <td
        className={cn(
          "sticky left-0 z-10 bg-background px-3 py-1.5",
          row.bold && "font-semibold"
        )}
      >
        {row.label}
      </td>
      {/* Month values */}
      {row.values.map((value, i) => (
        <td
          key={i}
          className={cn(
            "px-2 py-1.5 text-right tabular-nums font-mono",
            row.bold && "font-semibold",
            row.colorBySign && value < 0 && "text-red-500",
            row.colorBySign && value > 0 && row.label === "Cumulative Profit" && "text-green-600",
            row.colorBySign && value < 0 && row.label === "Cumulative Profit" && "text-red-500",
            value < 0 && !row.colorBySign && row.type === "currency" && "text-red-500"
          )}
        >
          {formatCell(value, row.type)}
        </td>
      ))}
      {/* Total/Avg column */}
      <td
        className={cn(
          "px-2 py-1.5 text-right tabular-nums font-mono border-l",
          row.bold && "font-semibold",
          row.colorBySign && total < 0 && "text-red-500",
          row.colorBySign && total > 0 && row.label === "Cumulative Profit" && "text-green-600",
          row.colorBySign && total < 0 && row.label === "Cumulative Profit" && "text-red-500",
          total < 0 && !row.colorBySign && row.type === "currency" && "text-red-500"
        )}
      >
        {formatCell(total, row.type)}
      </td>
    </tr>
  );
}
