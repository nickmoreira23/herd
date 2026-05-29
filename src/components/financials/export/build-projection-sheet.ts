// Projection view → ExportSheet.
//
// Faithful re-derivation of the rows rendered by `projection-spreadsheet.tsx`
// (accrual basis: `cohortProjection[].revenue`). Same data paths — COGS
// detail comes from the calendar-month aggregate of cohortLifecycles, the
// rest from cohortProjection. Per-tier child rows are intentionally omitted
// (collapsed by default on-screen); headline + category/cycle breakdowns
// are kept.

import type { FinancialInputs, ScenarioResults } from "@/lib/financial-engine";
import type { MessageKey } from "@/lib/i18n/t";
import { aggregateLifecyclesByCalendarMonth } from "../spreadsheet-shared";
import type { ExportRow, ExportSection, ExportSheet, ExportTranslate } from "./types";

export function buildProjectionSheet(
  results: ScenarioResults,
  inputs: FinancialInputs,
  months: number,
  t: ExportTranslate,
): ExportSheet {
  const projection = results.cohortProjection.slice(0, months);
  const n = projection.length;
  const costPerSub = results.costPerSubscriber;

  const tierIds =
    projection[0]?.newSubsByTier?.map((tier) => tier.tierId) ??
    inputs?.tiers?.map((tier) => tier.tierId) ??
    [];

  const aggMonths = aggregateLifecyclesByCalendarMonth(
    results.cohortLifecycles ?? [],
    results.cohortProjection,
    n,
    tierIds,
  );

  // ── Per-month series (mirror projection-spreadsheet.tsx) ──────────────
  const activeReps: number[] = [];
  const grossNewSales: number[] = [];
  const chargebacks: number[] = [];
  const newSubs: number[] = [];
  const churned: number[] = [];
  const totalActive: number[] = [];
  const subscriptionRevenue: number[] = [];
  const productCostDetail: number[] = [];
  const shippingDetail: number[] = [];
  const handlingDetail: number[] = [];
  const paymentProcessingDetail: number[] = [];
  const grossProfit: number[] = [];
  const grossMarginPct: number[] = [];
  const commissions: number[] = [];
  const buckLicense: number[] = [];
  const buckTokens: number[] = [];
  const addOns: number[] = [];
  const welcomeKit: number[] = [];
  const overhead: number[] = [];
  const overheadByCategoryArr: { id: string; name: string; monthly: number }[][] = [];
  const totalOpEx: number[] = [];
  const netProfit: number[] = [];
  const cumulativeProfit: number[] = [];
  const netMarginPct: number[] = [];

  for (let i = 0; i < n; i++) {
    const curr = projection[i];
    const prev = i > 0 ? projection[i - 1] : null;
    const agg = aggMonths[i];

    activeReps.push(curr.activeReps);

    const monthChargebacks = curr.chargebacks ?? 0;
    grossNewSales.push(curr.newSubsFromReps + monthChargebacks);
    chargebacks.push(monthChargebacks);
    newSubs.push(curr.newSubsFromReps);

    const prevSubs = prev ? prev.subscribers : 0;
    churned.push(prevSubs + curr.newSubsFromReps - curr.subscribers);

    totalActive.push(curr.subscribers);
    subscriptionRevenue.push(curr.revenue);

    productCostDetail.push(
      agg?.productCogsCost ?? curr.cogsExpense ?? curr.subscribers * costPerSub,
    );
    shippingDetail.push(agg?.shippingCost ?? 0);
    handlingDetail.push(agg?.handlingCost ?? 0);
    paymentProcessingDetail.push(agg?.paymentProcessingCost ?? 0);

    const monthCOGS = agg?.productCost ?? curr.cogsExpense ?? curr.subscribers * costPerSub;
    const monthGross = curr.revenue - monthCOGS;
    grossProfit.push(monthGross);
    grossMarginPct.push(curr.revenue > 0 ? (monthGross / curr.revenue) * 100 : 0);

    const monthChargebackCost = curr.chargebackCost ?? 0;
    const monthCommissions =
      curr.commissionExpense ??
      curr.costs - monthCOGS - curr.operationalOverhead - monthChargebackCost;
    commissions.push(monthCommissions);

    const monthBuckLicense = curr.buckLicenseCost ?? 0;
    const monthBuckTokens = curr.buckTokenCost ?? 0;
    buckLicense.push(monthBuckLicense);
    buckTokens.push(monthBuckTokens);
    const monthBuck = curr.buckPlatformCost ?? monthBuckLicense + monthBuckTokens;

    const monthAddOns = curr.addOnCost ?? 0;
    addOns.push(monthAddOns);

    const monthWelcomeKit = curr.welcomeKitCost ?? 0;
    welcomeKit.push(monthWelcomeKit);

    overhead.push(curr.operationalOverhead);
    overheadByCategoryArr.push(curr.operationalOverheadByCategory ?? []);

    totalOpEx.push(
      monthCommissions +
        monthBuck +
        monthAddOns +
        monthWelcomeKit +
        curr.operationalOverhead,
    );

    netProfit.push(curr.netProfit);
    cumulativeProfit.push(curr.cumulativeProfit);
    netMarginPct.push(curr.revenue > 0 ? (curr.netProfit / curr.revenue) * 100 : 0);
  }

  const hasBillingBreakdown = projection[0]?.revenueByBillingCycle != null;
  const cycleRow = (
    cycle: "monthly" | "biannual" | "annual",
    labelKey: MessageKey,
  ): ExportRow => ({
    label: t(labelKey),
    type: "currency",
    totalMode: "sum",
    level: 1,
    values: projection.map((mo) => mo.revenueByBillingCycle?.[cycle] ?? 0),
  });

  // Union of overhead category ids across the window (a category present in
  // only some months still gets a row; missing months read as 0).
  const categoryIds = new Map<string, string>();
  for (const arr of overheadByCategoryArr)
    for (const c of arr) if (!categoryIds.has(c.id)) categoryIds.set(c.id, c.name);
  const overheadCategoryRows: ExportRow[] = Array.from(categoryIds.entries()).map(
    ([id, name]) => ({
      label: name,
      type: "currency",
      totalMode: "sum",
      level: 1,
      values: overheadByCategoryArr.map((arr) => arr.find((c) => c.id === id)?.monthly ?? 0),
    }),
  );

  // Profit split — per party + cumulative running total.
  const profitSplitRows: ExportRow[] = [];
  for (const party of results.profitSplit?.parties ?? []) {
    const partyValues = netProfit.map((np) => (np > 0 ? np * (party.percent / 100) : 0));
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
        { label: t("financials.projection.row.active_reps"), type: "number", totalMode: "latest", values: activeReps },
        { label: t("financials.projection.row.gross_new_sales"), type: "number", totalMode: "sum", values: grossNewSales, bold: true },
        ...(chargebacks.some((v) => v > 0)
          ? [{ label: t("financials.projection.row.chargebacks"), type: "number" as const, totalMode: "sum" as const, values: chargebacks }]
          : []),
        { label: t("financials.projection.row.net_new_subs"), type: "number", totalMode: "sum", values: newSubs, bold: true },
        { label: t("financials.projection.row.lost_to_churn"), type: "number", totalMode: "sum", values: churned },
        { label: t("financials.projection.row.total_active"), type: "number", totalMode: "latest", values: totalActive, bold: true },
      ],
    },
    {
      header: t("financials.projection.section.revenue"),
      rows: [
        { label: t("financials.projection.row.subscription_revenue"), type: "currency", totalMode: "sum", values: subscriptionRevenue, bold: true },
        ...(hasBillingBreakdown
          ? [
              cycleRow("monthly", "financials.projection.row.monthly_billing"),
              cycleRow("biannual", "financials.projection.row.biannual_billing"),
              cycleRow("annual", "financials.projection.row.annual_billing"),
            ]
          : []),
      ],
    },
    {
      header: t("financials.projection.section.cogs"),
      rows: [
        { label: t("financials.projection.row.product_cost"), type: "currency", totalMode: "sum", values: productCostDetail },
        { label: t("financials.projection.row.shipping"), type: "currency", totalMode: "sum", values: shippingDetail },
        { label: t("financials.projection.row.handling"), type: "currency", totalMode: "sum", values: handlingDetail },
        { label: t("financials.projection.row.payment_processing"), type: "currency", totalMode: "sum", values: paymentProcessingDetail },
        { label: t("financials.projection.row.gross_profit"), type: "currency", totalMode: "sum", values: grossProfit, bold: true },
        { label: t("financials.projection.row.gross_margin_pct"), type: "percent", totalMode: "average", values: grossMarginPct },
      ],
    },
    {
      header: t("financials.projection.section.opex"),
      rows: [
        { label: t("financials.projection.row.overhead"), type: "currency", totalMode: "sum", values: overhead },
        ...overheadCategoryRows,
        { label: t("financials.projection.row.welcome_kit"), type: "currency", totalMode: "sum", values: welcomeKit },
        { label: t("financials.projection.row.buck"), type: "currency", totalMode: "sum", values: buckLicense.map((v, i) => v + (buckTokens[i] ?? 0)) },
        { label: t("financials.projection.row.buck_license"), type: "currency", totalMode: "sum", level: 1, values: buckLicense },
        { label: t("financials.projection.row.buck_tokens"), type: "currency", totalMode: "sum", level: 1, values: buckTokens },
        { label: t("financials.projection.row.add_ons"), type: "currency", totalMode: "sum", values: addOns },
        { label: t("financials.projection.row.commissions"), type: "currency", totalMode: "sum", values: commissions },
        { label: t("financials.projection.row.total_opex"), type: "currency", totalMode: "sum", values: totalOpEx, bold: true },
      ],
    },
    {
      header: t("financials.projection.section.bottom_line"),
      rows: [
        { label: t("financials.projection.row.net_profit"), type: "currency", totalMode: "sum", values: netProfit, bold: true },
        { label: t("financials.projection.row.cumulative_profit"), type: "currency", totalMode: "latest", values: cumulativeProfit },
        { label: t("financials.projection.row.net_margin_pct"), type: "percent", totalMode: "average", values: netMarginPct },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [{ header: t("financials.projection.section.profit_split"), rows: profitSplitRows }]
      : []),
  ];

  return {
    name: t("financials.export.sheet.projection"),
    columnHeaders: projection.map((_, i) => t("financials.cohort.column.month_long", { month: i + 1 })),
    totalHeader: t("financials.cohort.column.total"),
    sections,
  };
}
