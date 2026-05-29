// Cohort aggregate view → ExportSheet.
//
// Cash basis: built by summing cohortLifecycles by calendar month via the
// shared `aggregateLifecyclesByCalendarMonth` helper (same construction the
// AggregateCohortTable renders). Σ of the Revenue row over the full window
// equals the cash-revenue audit pin ($990,498).

import type { FinancialInputs, ScenarioResults } from "@/lib/financial-engine";
import { aggregateLifecyclesByCalendarMonth, type AggMonth } from "../spreadsheet-shared";
import type { ExportRow, ExportSection, ExportSheet, ExportTranslate } from "./types";

export function buildCohortAggregateSheet(
  results: ScenarioResults,
  inputs: FinancialInputs,
  months: number,
  t: ExportTranslate,
): ExportSheet {
  const tierIds = inputs?.tiers?.map((tier) => tier.tierId) ?? [];
  const agg: AggMonth[] = aggregateLifecyclesByCalendarMonth(
    results.cohortLifecycles ?? [],
    results.cohortProjection,
    months,
    tierIds,
  );

  const col = (pick: (m: AggMonth) => number): number[] => agg.map(pick);

  // Union of overhead category ids across the window.
  const categoryIds = new Map<string, string>();
  for (const m of agg)
    for (const c of m.operationalOverheadByCategory)
      if (!categoryIds.has(c.id)) categoryIds.set(c.id, c.name);
  const overheadCategoryRows: ExportRow[] = Array.from(categoryIds.entries()).map(
    ([id, name]) => ({
      label: name,
      type: "currency",
      totalMode: "sum",
      level: 1,
      values: agg.map((m) => m.operationalOverheadByCategory.find((c) => c.id === id)?.monthly ?? 0),
    }),
  );

  const profitSplitRows: ExportRow[] = [];
  for (const party of results.profitSplit?.parties ?? []) {
    const partyValues = agg.map((m) => (m.netProfit > 0 ? m.netProfit * (party.percent / 100) : 0));
    let running = 0;
    profitSplitRows.push({
      label: t("financials.pl.party_label", { name: party.name, percent: party.percent }),
      type: "currency",
      totalMode: "sum",
      values: partyValues,
    });
    profitSplitRows.push({
      label: t("financials.projection.row.profit_split_cumulative", {
        name: party.name,
        percent: party.percent,
      }),
      type: "currency",
      totalMode: "latest",
      values: partyValues.map((v) => (running += v)),
    });
  }

  const sections: ExportSection[] = [
    {
      header: t("financials.projection.section.subscribers"),
      rows: [
        { label: t("financials.projection.row.gross_new_sales"), type: "number", totalMode: "sum", values: col((m) => m.grossNewSubs), bold: true },
        { label: t("financials.projection.row.lost_to_churn"), type: "number", totalMode: "sum", values: col((m) => m.churned) },
        { label: t("financials.projection.row.total_active"), type: "number", totalMode: "latest", values: col((m) => m.survivingSubs), bold: true },
      ],
    },
    {
      header: t("financials.projection.section.revenue"),
      rows: [
        { label: t("financials.projection.row.subscription_revenue"), type: "currency", totalMode: "sum", values: col((m) => m.revenue), bold: true },
        { label: t("financials.projection.row.monthly_billing"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.revenueByBillingCycle.monthly) },
        { label: t("financials.projection.row.biannual_billing"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.revenueByBillingCycle.biannual) },
        { label: t("financials.projection.row.annual_billing"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.revenueByBillingCycle.annual) },
      ],
    },
    {
      header: t("financials.projection.section.cogs"),
      rows: [
        { label: t("financials.projection.row.product_cost"), type: "currency", totalMode: "sum", values: col((m) => m.productCogsCost) },
        { label: t("financials.projection.row.shipping"), type: "currency", totalMode: "sum", values: col((m) => m.shippingCost) },
        { label: t("financials.projection.row.handling"), type: "currency", totalMode: "sum", values: col((m) => m.handlingCost) },
        { label: t("financials.projection.row.payment_processing"), type: "currency", totalMode: "sum", values: col((m) => m.paymentProcessingCost) },
        { label: t("financials.projection.row.gross_profit"), type: "currency", totalMode: "sum", values: agg.map((m) => m.revenue - m.productCost), bold: true },
        { label: t("financials.projection.row.gross_margin_pct"), type: "percent", totalMode: "average", values: agg.map((m) => (m.revenue > 0 ? ((m.revenue - m.productCost) / m.revenue) * 100 : 0)) },
      ],
    },
    {
      header: t("financials.projection.section.opex"),
      rows: [
        { label: t("financials.projection.row.overhead"), type: "currency", totalMode: "sum", values: col((m) => m.operationalOverhead) },
        ...overheadCategoryRows,
        { label: t("financials.projection.row.welcome_kit"), type: "currency", totalMode: "sum", values: col((m) => m.welcomeKitCost) },
        { label: t("financials.projection.row.buck"), type: "currency", totalMode: "sum", values: col((m) => m.buckCost) },
        { label: t("financials.projection.row.buck_license"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.buckLicenseCost) },
        { label: t("financials.projection.row.buck_tokens"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.buckTokenCost) },
        { label: t("financials.projection.row.add_ons"), type: "currency", totalMode: "sum", values: col((m) => m.addOnCost) },
        { label: t("financials.projection.row.commissions"), type: "currency", totalMode: "sum", values: agg.map((m) => m.commissionUpfront + m.commissionResidual) },
        { label: t("financials.projection.row.commissions_upfront"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.commissionUpfront) },
        { label: t("financials.projection.row.commissions_residual"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.commissionResidual) },
        {
          label: t("financials.projection.row.total_opex"),
          type: "currency",
          totalMode: "sum",
          bold: true,
          values: agg.map(
            (m) =>
              m.commissionUpfront +
              m.commissionResidual +
              m.buckCost +
              m.addOnCost +
              m.welcomeKitCost +
              m.operationalOverhead,
          ),
        },
      ],
    },
    {
      header: t("financials.projection.section.bottom_line"),
      rows: [
        { label: t("financials.projection.row.net_profit"), type: "currency", totalMode: "sum", values: col((m) => m.netProfit), bold: true },
        { label: t("financials.projection.row.cumulative_profit"), type: "currency", totalMode: "latest", values: col((m) => m.cumulativeProfit) },
        { label: t("financials.projection.row.net_margin_pct"), type: "percent", totalMode: "average", values: agg.map((m) => (m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0)) },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [{ header: t("financials.projection.section.profit_split"), rows: profitSplitRows }]
      : []),
  ];

  return {
    name: t("financials.export.sheet.cohort_aggregate"),
    columnHeaders: agg.map((_, i) => t("financials.cohort.column.month_long", { month: i + 1 })),
    totalHeader: t("financials.cohort.column.total"),
    sections,
  };
}
