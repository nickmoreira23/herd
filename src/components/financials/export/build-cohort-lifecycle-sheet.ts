// Single-cohort lifecycle view → ExportSheet.
//
// Columns are months-of-life (1 = acquisition month) for one acquisition
// cohort. Mirrors `CohortLifecycleTable`'s per-month derivation: overhead is
// NOT attributed per cohort (scenario-level fixed cost); Buck fees ARE
// (they scale with the cohort's surviving subs).

import type { CohortLifecycle } from "../spreadsheet-shared";
import type { ExportSection, ExportSheet, ExportTranslate } from "./types";

export function buildCohortLifecycleSheet(
  lifecycle: CohortLifecycle,
  t: ExportTranslate,
): ExportSheet {
  const { months, acquisitionMonth } = lifecycle;

  const col = (pick: (m: CohortLifecycle["months"][number]) => number): number[] =>
    months.map(pick);

  let runningProfit = 0;
  const cumulativeProfit = months.map((m) => (runningProfit += m.netProfit));

  const sections: ExportSection[] = [
    {
      header: t("financials.projection.section.subscribers"),
      rows: [
        { label: t("financials.projection.row.total_active"), type: "number", totalMode: "latest", values: col((m) => m.survivingSubs), bold: true },
        { label: t("financials.projection.row.lost_to_churn"), type: "number", totalMode: "sum", values: col((m) => m.churned) },
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
        { label: t("financials.projection.row.gross_profit"), type: "currency", totalMode: "sum", values: col((m) => m.revenue - m.productCost), bold: true },
        { label: t("financials.projection.row.gross_margin_pct"), type: "percent", totalMode: "average", values: col((m) => (m.revenue > 0 ? ((m.revenue - m.productCost) / m.revenue) * 100 : 0)) },
      ],
    },
    {
      header: t("financials.projection.section.opex"),
      rows: [
        { label: t("financials.projection.row.welcome_kit"), type: "currency", totalMode: "sum", values: col((m) => m.welcomeKitCost) },
        { label: t("financials.projection.row.buck"), type: "currency", totalMode: "sum", values: col((m) => m.buckCost) },
        { label: t("financials.projection.row.buck_license"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.buckLicenseCost) },
        { label: t("financials.projection.row.buck_tokens"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.buckTokenCost) },
        { label: t("financials.projection.row.add_ons"), type: "currency", totalMode: "sum", values: col((m) => m.addOnCost) },
        { label: t("financials.projection.row.commissions"), type: "currency", totalMode: "sum", values: col((m) => m.commissionUpfront + m.commissionResidual) },
        { label: t("financials.projection.row.commissions_upfront"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.commissionUpfront) },
        { label: t("financials.projection.row.commissions_residual"), type: "currency", totalMode: "sum", level: 1, values: col((m) => m.commissionResidual) },
      ],
    },
    {
      header: t("financials.projection.section.bottom_line"),
      rows: [
        { label: t("financials.projection.row.net_profit"), type: "currency", totalMode: "sum", values: col((m) => m.netProfit), bold: true },
        { label: t("financials.projection.row.cumulative_profit"), type: "currency", totalMode: "latest", values: cumulativeProfit },
        { label: t("financials.projection.row.net_margin_pct"), type: "percent", totalMode: "average", values: col((m) => (m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0)) },
      ],
    },
  ];

  return {
    name: t("financials.export.sheet.cohort_lifecycle", { month: acquisitionMonth }),
    columnHeaders: months.map((m) => t("financials.cohort.column.month_long", { month: m.monthOfLife })),
    totalHeader: t("financials.cohort.lifecycle.lifetime_header"),
    sections,
  };
}
