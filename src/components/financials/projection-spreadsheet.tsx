"use client";

import { ChevronRight } from "lucide-react";
import { useFinancialStore } from "@/stores/financial-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import type { MessageKey } from "@/lib/i18n/t";
import {
  AccountingBasisBadge,
  AccountingBasisReconciliation,
} from "./accounting-basis-reconciliation";
import {
  aggregateLifecyclesByCalendarMonth,
  useSpreadsheetCollapse,
} from "./spreadsheet-shared";

interface ProjectionSpreadsheetProps {
  months?: number;
  locale: Locale;
}

type RowType = "currency" | "number" | "decimal" | "percent";
type TotalMode = "sum" | "average" | "latest";

interface RowDef {
  label: string;
  type: RowType;
  totalMode: TotalMode;
  values: number[];
  bold?: boolean;
  colorBySign?: boolean;
  /** Stable identifier; required if the row has children or is a child. */
  id?: string;
  /** Points to the parent row's `id`. Determines indent + collapse ancestry. */
  parentId?: string;
  /** Indent depth; 0 = top, 1 = child, 2 = grandchild. Defaults to 0. */
  level?: 0 | 1 | 2;
}

interface SectionDef {
  /** Section-level collapse id. Required — every section is collapsible
   *  per AggregateCohortTable convention. */
  id: string;
  header: string;
  rows: RowDef[];
}

function formatCell(value: number, type: RowType, locale: Locale): string {
  switch (type) {
    case "currency":
      return formatNumberAsMoney(value, locale);
    case "percent":
      return formatNumber(value / 100, locale, "percent");
    case "number":
      return formatNumber(Math.round(value), locale, "integer");
    case "decimal":
      return formatNumber(value, locale, "decimal");
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

export function ProjectionSpreadsheet({ months = 12, locale }: ProjectionSpreadsheetProps) {
  const t = useT();
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm font-medium">{t("financials.projection.empty")}</p>
      </div>
    );
  }

  const projection = results.cohortProjection.slice(0, months);
  const costPerSub = results.costPerSubscriber;

  // Collect unique tier IDs for per-tier breakdown
  const tierIds = projection[0]?.newSubsByTier?.map((tier) => tier.tierId) ?? inputs?.tiers?.map((tier) => tier.tierId) ?? [];
  const hasMultipleTiers = tierIds.length > 1;

  // Per-tier billing distribution — drives "(X%)" suffix in
  // Active by Plan & Cycle labels. Mirror cohort-spreadsheet shape.
  const tierBillingDistributions = new Map<
    string,
    { monthly: number; biannual: number; annual: number }
  >(
    (inputs?.tiers ?? []).map((t) => [
      t.tierId,
      t.billingDistribution ?? inputs.billingCycleDistribution,
    ]),
  );

  // Per-calendar-month aggregate of cohortLifecycles — same data path as
  // AggregateCohortTable. Used for rows that aren't on cohortProjection
  // (subscribersByTierAndCycle, productCogsCost split, shipping, handling,
  // payment processing). NOTE: shipping/handling/paymentProcessing are
  // surfaced for visual parity with the Aggregate view; they are NOT in
  // the engine's monthCosts/netProfit (cash-flow-only attribution).
  const aggMonths = aggregateLifecyclesByCalendarMonth(
    results.cohortLifecycles ?? [],
    results.cohortProjection,
    months,
    tierIds,
  );

  // Collapse state — mirror AggregateCohortTable defaults so the two
  // tables read identically.
  const initialCollapsedRows: string[] = [
    "subscribers-gross",
    "monthly-billing",
    "biannual-billing",
    "annual-billing",
    "commissions",
    "overhead",
    "buck",
    "addons",
  ];
  for (const tid of tierIds) {
    initialCollapsedRows.push(`active-by-plan-cycle--${tid}`);
    initialCollapsedRows.push(`commissions--${tid}`);
  }
  const {
    collapsedSections,
    collapsedRows,
    toggleSection,
    toggleRow,
  } = useSpreadsheetCollapse(["active-by-plan-cycle"], initialCollapsedRows);

  // Build row data for each month
  const activeReps: number[] = [];
  const grossNewSales: number[] = [];
  const chargebacks: number[] = [];
  const newSubs: number[] = [];
  const churned: number[] = [];
  const totalActive: number[] = [];
  const subscriptionRevenue: number[] = [];
  // COGS detail — sourced from aggMonths (cohortLifecycles aggregate), not
  // from cohortProjection. The engine's `cogsExpense` is the blended total
  // (currentSubs × costPerSub) only; Aggregate splits into product /
  // shipping / handling / payment-processing via cohort-attributed math.
  const productCostDetail: number[] = [];
  const shippingDetail: number[] = [];
  const handlingDetail: number[] = [];
  const paymentProcessingDetail: number[] = [];
  const productFulfillment: number[] = []; // total COGS (back-compat fallback)
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

  for (let i = 0; i < projection.length; i++) {
    const curr = projection[i];
    const prev = i > 0 ? projection[i - 1] : null;
    const agg = aggMonths[i];

    activeReps.push(curr.activeReps);

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

    // COGS detail from aggMonths (cohortLifecycles aggregate). Fallback
    // to the engine's blended `cogsExpense` for productCost when the
    // aggregate is empty (e.g. very short projection windows).
    productCostDetail.push(agg?.productCogsCost ?? curr.cogsExpense ?? curr.subscribers * costPerSub);
    shippingDetail.push(agg?.shippingCost ?? 0);
    handlingDetail.push(agg?.handlingCost ?? 0);
    paymentProcessingDetail.push(agg?.paymentProcessingCost ?? 0);

    // Total COGS — sum the 4 components (matches Aggregate's productCost
    // rollup). Engine's blended `cogsExpense` is used as fallback when
    // the aggregate is empty.
    const monthCOGS =
      (agg?.productCost ?? curr.cogsExpense ?? curr.subscribers * costPerSub);
    productFulfillment.push(monthCOGS);

    const monthGross = curr.revenue - monthCOGS;
    grossProfit.push(monthGross);

    const monthGrossMargin = curr.revenue > 0 ? (monthGross / curr.revenue) * 100 : 0;
    grossMarginPct.push(monthGrossMargin);

    const monthChargebackCost = curr.chargebackCost ?? 0;
    const monthCommissions =
      curr.commissionExpense ??
      // Fallback: derive from costs after pulling out COGS, overhead, and
      // chargeback so the value isn't inflated by chargeback expense (which
      // is a separate P&L line, not a commission).
      curr.costs - monthCOGS - curr.operationalOverhead - monthChargebackCost;
    commissions.push(monthCommissions);

    const monthBuckLicense = curr.buckLicenseCost ?? 0;
    const monthBuckTokens = curr.buckTokenCost ?? 0;
    const monthBuck =
      curr.buckPlatformCost ?? monthBuckLicense + monthBuckTokens;
    buckLicense.push(monthBuckLicense);
    buckTokens.push(monthBuckTokens);

    const monthAddOns = curr.addOnCost ?? 0;
    addOns.push(monthAddOns);

    const monthWelcomeKit = curr.welcomeKitCost ?? 0;
    welcomeKit.push(monthWelcomeKit);

    overhead.push(curr.operationalOverhead);
    // Build per-category overhead arrays alongside the headline. Each
    // category gets a sub-row in the OpEx section so the user can see
    // "Marketing $5k · Tech $12k · Ops $4k" rolling up to the total.
    overheadByCategoryArr.push(curr.operationalOverheadByCategory ?? []);

    const monthTotalOpEx =
      monthCommissions +
      monthBuck +
      monthAddOns +
      monthWelcomeKit +
      curr.operationalOverhead;
    totalOpEx.push(monthTotalOpEx);

    netProfit.push(curr.netProfit);
    cumulativeProfit.push(curr.cumulativeProfit);

    const monthNetMargin = curr.revenue > 0 ? (curr.netProfit / curr.revenue) * 100 : 0;
    netMarginPct.push(monthNetMargin);
  }

  // Profit split rows — per-party monthly distribution + cumulative
  // running total. Mirrors AggregateCohortTable's Profit Split section.
  const profitSplitRows: RowDef[] = [];
  if (results.profitSplit.parties.length > 0) {
    for (const party of results.profitSplit.parties) {
      const partyValues = netProfit.map((np) =>
        np > 0 ? np * (party.percent / 100) : 0,
      );
      let runningTotal = 0;
      const partyCumulative = partyValues.map((v) => (runningTotal += v));
      profitSplitRows.push({
        label: t("financials.pl.party_label", { name: party.name, percent: party.percent }),
        type: "currency",
        totalMode: "sum",
        values: partyValues,
        colorBySign: true,
      });
      profitSplitRows.push({
        label: t("financials.projection.row.profit_split_cumulative", {
          name: party.name,
          percent: party.percent,
        }),
        type: "currency",
        totalMode: "latest",
        values: partyCumulative,
        colorBySign: true,
      });
    }
  }

  // Per-tier breakdown of new sales — children of `subscribers-gross`.
  const perTierNewSalesRows: RowDef[] = hasMultipleTiers
    ? tierIds.map((tierId) => ({
        id: `subscribers-gross--${tierId}`,
        parentId: "subscribers-gross",
        level: 1,
        label: t("financials.projection.tier_indent", { tier: tierId }),
        type: "number" as const,
        totalMode: "sum" as const,
        values: projection.map((mo) => {
          const entry = mo.newSubsByTier?.find((tier) => tier.tierId === tierId);
          return entry?.count ?? 0;
        }),
      }))
    : [];

  // Per-billing-cycle revenue breakdown. Each cycle is a parent with
  // per-tier children (when there's >1 tier) — values come from the
  // aggMonths cross-product.
  const hasBillingBreakdown = projection[0]?.revenueByBillingCycle != null;
  const buildCycleParentAndChildren = (
    cycle: "monthly" | "biannual" | "annual",
    rowId: "monthly-billing" | "biannual-billing" | "annual-billing",
    labelKey: MessageKey,
  ): RowDef[] => {
    const parent: RowDef = {
      id: rowId,
      level: 0,
      label: t(labelKey),
      type: "currency",
      totalMode: "sum",
      values: projection.map((mo) => mo.revenueByBillingCycle?.[cycle] ?? 0),
    };
    if (!hasMultipleTiers) return [parent];
    const children: RowDef[] = tierIds.map((tierId) => ({
      id: `${rowId}--${tierId}`,
      parentId: rowId,
      level: 1,
      label: t("financials.projection.tier_indent", { tier: tierId }),
      type: "currency",
      totalMode: "sum",
      values: aggMonths.map(
        (m) =>
          m.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ?? 0,
      ),
    }));
    return [parent, ...children];
  };
  const billingCycleRows: RowDef[] = hasBillingBreakdown
    ? [
        ...buildCycleParentAndChildren(
          "monthly",
          "monthly-billing",
          "financials.projection.row.monthly_billing",
        ),
        ...buildCycleParentAndChildren(
          "biannual",
          "biannual-billing",
          "financials.projection.row.biannual_billing",
        ),
        ...buildCycleParentAndChildren(
          "annual",
          "annual-billing",
          "financials.projection.row.annual_billing",
        ),
      ]
    : [];

  // Active by Plan & Cycle section — per-tier parents + 3 cycle children
  // per parent. Only rendered when there's >1 tier (single-tier scenarios
  // collapse this into "Total Active"). Values come from aggMonths, total
  // mode is average (active subs are a stock, not a flow).
  const activeByPlanCycleSection: SectionDef | null = hasMultipleTiers
    ? {
        header: t("financials.projection.section.active_by_plan_cycle"),
        id: "active-by-plan-cycle",
        rows: tierIds.flatMap((tierId): RowDef[] => {
          const parentId = `active-by-plan-cycle--${tierId}`;
          const cycles: ("monthly" | "biannual" | "annual")[] = [
            "monthly",
            "biannual",
            "annual",
          ];
          const cycleKeys = {
            monthly: "financials.projection.cycle_label.monthly",
            biannual: "financials.projection.cycle_label.biannual",
            annual: "financials.projection.cycle_label.annual",
          } as const satisfies Record<typeof cycles[number], MessageKey>;
          const tierBilling = tierBillingDistributions.get(tierId);
          const parent: RowDef = {
            id: parentId,
            level: 0,
            label: t("financials.projection.tier_indent", { tier: tierId }),
            type: "decimal",
            totalMode: "average",
            values: aggMonths.map((m) => {
              const e = m.subscribersByTierAndCycle.find((x) => x.tierId === tierId);
              return e ? e.monthly + e.biannual + e.annual : 0;
            }),
          };
          const children: RowDef[] = cycles.map((cycle) => ({
            id: `${parentId}--${cycle}`,
            parentId,
            level: 1,
            label: t("financials.projection.tier_subindent", {
              tier: `${t(cycleKeys[cycle])} (${formatNumber(
                (tierBilling?.[cycle] ?? 0) / 100,
                locale,
                "percent",
              )})`,
            }),
            type: "decimal",
            totalMode: "average",
            values: aggMonths.map(
              (m) =>
                m.subscribersByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ??
                0,
            ),
          }));
          return [parent, ...children];
        }),
      }
    : null;

  const sections: SectionDef[] = [
    {
      id: "subscribers",
      header: t("financials.projection.section.subscribers"),
      rows: [
        { label: t("financials.projection.row.active_reps"), type: "number", totalMode: "latest", values: activeReps },
        { id: "subscribers-gross", label: t("financials.projection.row.gross_new_sales"), type: "number", totalMode: "sum", values: grossNewSales, bold: true },
        ...perTierNewSalesRows,
        ...(chargebacks.some((v) => v > 0) ? [
          { label: t("financials.projection.row.chargebacks"), type: "number" as const, totalMode: "sum" as const, values: chargebacks, colorBySign: false },
        ] : []),
        { label: t("financials.projection.row.net_new_subs"), type: "number", totalMode: "sum", values: newSubs, bold: true },
        { label: t("financials.projection.row.lost_to_churn"), type: "number", totalMode: "sum", values: churned },
        { label: t("financials.projection.row.total_active"), type: "number", totalMode: "latest", values: totalActive, bold: true },
      ],
    },
    ...(activeByPlanCycleSection ? [activeByPlanCycleSection] : []),
    {
      id: "revenue",
      header: t("financials.projection.section.revenue"),
      rows: [
        { label: t("financials.projection.row.subscription_revenue"), type: "currency", totalMode: "sum", values: subscriptionRevenue },
        ...billingCycleRows,
      ],
    },
    {
      id: "cogs",
      header: t("financials.projection.section.cogs"),
      rows: [
        { label: t("financials.projection.row.product_cost"), type: "currency", totalMode: "sum", values: productCostDetail },
        { label: t("financials.projection.row.shipping"), type: "currency", totalMode: "sum", values: shippingDetail },
        { label: t("financials.projection.row.handling"), type: "currency", totalMode: "sum", values: handlingDetail },
        { label: t("financials.projection.row.payment_processing"), type: "currency", totalMode: "sum", values: paymentProcessingDetail },
        { label: t("financials.projection.row.gross_profit"), type: "currency", totalMode: "sum", values: grossProfit, bold: true, colorBySign: true },
        { label: t("financials.projection.row.gross_margin_pct"), type: "percent", totalMode: "average", values: grossMarginPct },
      ],
    },
    {
      id: "opex",
      header: t("financials.projection.section.opex"),
      // Order mirrors AggregateCohortTable: Overhead → Welcome Kit →
      // Buck → Add-Ons → Commissions → Total OpEx.
      rows: [
        // Overhead (parent) + per-category children.
        { id: "overhead", label: t("financials.projection.row.overhead"), type: "currency", totalMode: "sum", values: overhead },
        ...(() => {
          // Collect the union of category ids across the projection
          // window (a category present in only some months still needs
          // a row; missing entries read as 0).
          const ids = new Map<string, string>();
          for (const arr of overheadByCategoryArr)
            for (const c of arr) if (!ids.has(c.id)) ids.set(c.id, c.name);
          return Array.from(ids.entries()).map(([id, name]): RowDef => ({
            id: `overhead--${id}`,
            parentId: "overhead",
            level: 1,
            label: t("financials.projection.tier_indent", { tier: name }),
            type: "currency",
            totalMode: "sum",
            values: overheadByCategoryArr.map(
              (arr) => arr.find((c) => c.id === id)?.monthly ?? 0,
            ),
          }));
        })(),
        // Welcome Kit (flat).
        { label: t("financials.projection.row.welcome_kit"), type: "currency", totalMode: "sum", values: welcomeKit },
        // Buck (parent) + License + Tokens children.
        {
          id: "buck",
          label: t("financials.projection.row.buck"),
          type: "currency",
          totalMode: "sum",
          values: buckLicense.map((v, i) => v + (buckTokens[i] ?? 0)),
        },
        { id: "buck--license", parentId: "buck", level: 1, label: t("financials.projection.row.buck_license"), type: "currency", totalMode: "sum", values: buckLicense },
        { id: "buck--tokens", parentId: "buck", level: 1, label: t("financials.projection.row.buck_tokens"), type: "currency", totalMode: "sum", values: buckTokens },
        // Add-Ons (parent) + Path Scale child.
        { id: "addons", label: t("financials.projection.row.add_ons"), type: "currency", totalMode: "sum", values: addOns },
        { id: "addons--path-scale", parentId: "addons", level: 1, label: t("financials.projection.row.path_scale"), type: "currency", totalMode: "sum", values: addOns },
        // Commissions (parent) + per-tier (parent) + Upfront/Residual (grandchildren).
        { id: "commissions", label: t("financials.projection.row.commissions"), type: "currency", totalMode: "sum", values: commissions },
        ...(hasMultipleTiers
          ? tierIds.flatMap((tierId): RowDef[] => {
              const tierParentId = `commissions--${tierId}`;
              const tierTotal = projection.map((mo) => {
                const e = mo.commissionByTier?.find((c) => c.tierId === tierId);
                return (e?.upfront ?? 0) + (e?.residual ?? 0);
              });
              const tierUpfront = projection.map(
                (mo) =>
                  mo.commissionByTier?.find((c) => c.tierId === tierId)?.upfront ?? 0,
              );
              const tierResidual = projection.map(
                (mo) =>
                  mo.commissionByTier?.find((c) => c.tierId === tierId)?.residual ?? 0,
              );
              return [
                {
                  id: tierParentId,
                  parentId: "commissions",
                  level: 1,
                  label: t("financials.projection.tier_indent", { tier: tierId }),
                  type: "currency",
                  totalMode: "sum",
                  values: tierTotal,
                },
                {
                  id: `${tierParentId}--upfront`,
                  parentId: tierParentId,
                  level: 2,
                  label: t("financials.projection.row.commissions_upfront"),
                  type: "currency",
                  totalMode: "sum",
                  values: tierUpfront,
                },
                {
                  id: `${tierParentId}--residual`,
                  parentId: tierParentId,
                  level: 2,
                  label: t("financials.projection.row.commissions_residual"),
                  type: "currency",
                  totalMode: "sum",
                  values: tierResidual,
                },
              ];
            })
          : []),
        { label: t("financials.projection.row.total_opex"), type: "currency", totalMode: "sum", values: totalOpEx, bold: true },
      ],
    },
    {
      id: "bottom-line",
      header: t("financials.projection.section.bottom_line"),
      rows: [
        { label: t("financials.projection.row.net_profit"), type: "currency", totalMode: "sum", values: netProfit, bold: true, colorBySign: true },
        { label: t("financials.projection.row.cumulative_profit"), type: "currency", totalMode: "latest", values: cumulativeProfit, colorBySign: true, id: "cumulative_profit" },
        { label: t("financials.projection.row.net_margin_pct"), type: "percent", totalMode: "average", values: netMarginPct },
      ],
    },
    ...(profitSplitRows.length > 0
      ? [
          {
            id: "profit-split",
            header: t("financials.projection.section.profit_split"),
            rows: profitSplitRows,
          },
        ]
      : []),
  ];

  // Reconciliation series — accrual is what this view displays
  // (`cohortProjection.revenue`); cash is the calendar-month aggregate of
  // the per-cohort lifecycle revenues (which carry biannual/annual lumps).
  // Window matches the projection's visible months. Pure derivation —
  // no engine logic, see sub-etapa 2 for the design.
  const accrualSeries = projection.map((m) => m.revenue);
  const cashSeries: number[] = projection.map((_, i) => {
    const K = i + 1;
    return (results.cohortLifecycles ?? []).reduce((sum, c) => {
      const e = c.months.find((mm) => mm.monthIndex === K);
      return sum + (e?.revenue ?? 0);
    }, 0);
  });

  // The wrapper itself scrolls (both axes) and caps at ~75% of the
  // viewport height — sticky thead inside pins to the top of THIS
  // scroll viewport, so column labels stay visible while rows scroll
  // behind them. Without a maxH, the wrapper grows to fit and the
  // sticky header has nothing to anchor to.
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AccountingBasisBadge basis="accrual" />
      </div>
      <AccountingBasisReconciliation
        accrualSeries={accrualSeries}
        cashSeries={cashSeries}
        locale={locale}
      />
      <div className="overflow-auto border rounded-md max-h-[75vh]">
      <table className="w-full text-xs border-collapse">
        <thead>
          {/* Header sticky on Y so column labels stay visible when the
              user scrolls down. The metric (left-most) cell is sticky on
              both axes — highest z-index in the table; month headers sit
              just below at z-20; section headers (sticky-left only) stay
              at z-10. */}
          {/* Header — mirrors AggregateCohortTable thead: same labels,
              same widths, same z-index stack. */}
          <tr className="border-b bg-muted">
            <th className="sticky left-0 top-0 z-30 bg-muted min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">
              {t("financials.cohort.column.metric")}
            </th>
            {projection.map((_, i) => (
              <th
                key={i}
                className="sticky top-0 z-20 bg-muted min-w-[100px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
              >
                {t("financials.cohort.column.month_long", { month: i + 1 })}
              </th>
            ))}
            <th className="sticky top-0 z-20 bg-muted min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
              {t("financials.cohort.column.total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionGroup
              key={section.header}
              section={section}
              months={months}
              locale={locale}
              collapsedSections={collapsedSections}
              collapsedRows={collapsedRows}
              onToggleSection={toggleSection}
              onToggleRow={toggleRow}
            />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function SectionGroup({
  section,
  months,
  locale,
  collapsedSections,
  collapsedRows,
  onToggleSection,
  onToggleRow,
}: {
  section: SectionDef;
  months: number;
  locale: Locale;
  collapsedSections: Set<string>;
  collapsedRows: Set<string>;
  onToggleSection: (id: string) => void;
  onToggleRow: (id: string) => void;
}) {
  // Every section is collapsible. Per `SectionDef`, `id` is required.
  const sectionId = section.id!;
  const isCollapsed = collapsedSections.has(sectionId);

  // A row is visible if NO ancestor in the parentId chain is collapsed.
  const isRowVisible = (row: RowDef): boolean => {
    let pid = row.parentId;
    while (pid) {
      if (collapsedRows.has(pid)) return false;
      const parent = section.rows.find((r) => r.id === pid);
      pid = parent?.parentId;
    }
    return true;
  };

  // A row has children if any other row in the section points to it.
  const hasChildren = (row: RowDef): boolean =>
    row.id != null && section.rows.some((r) => r.parentId === row.id);

  return (
    <>
      {/* Section header — entire <tr> is clickable. Mirrors
          AggregateCohortTable section header (cursor + hover-bg). */}
      <tr
        className="bg-muted cursor-pointer select-none hover:bg-muted/80 transition-colors"
        onClick={() => onToggleSection(sectionId)}
      >
        <td
          colSpan={months + 2}
          className="sticky left-0 z-10 bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !isCollapsed && "rotate-90",
              )}
            />
            {section.header}
          </span>
        </td>
      </tr>
      {/* Data rows — hidden when section is collapsed */}
      {!isCollapsed &&
        section.rows.filter(isRowVisible).map((row) => (
          <DataRow
            key={row.id ?? row.label}
            row={row}
            locale={locale}
            hasChildren={hasChildren(row)}
            isCollapsed={row.id ? collapsedRows.has(row.id) : false}
            onToggleRow={onToggleRow}
          />
        ))}
    </>
  );
}

function DataRow({
  row,
  locale,
  hasChildren,
  isCollapsed,
  onToggleRow,
}: {
  row: RowDef;
  locale: Locale;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleRow: (id: string) => void;
}) {
  const total = computeTotal(row.values, row.totalMode);
  const isCumulativeProfit = row.id === "cumulative_profit";
  const level = row.level ?? 0;
  // Indent: 12px per level. Top-level = 0; nested rows get progressive padding.
  const labelPaddingLeft = 12 + level * 12;
  const handleRowClick =
    hasChildren && row.id ? () => onToggleRow(row.id!) : undefined;

  return (
    <tr
      className={cn(
        "border-b border-border/40 hover:bg-muted/10 transition-colors",
        hasChildren && "cursor-pointer select-none",
      )}
      onClick={handleRowClick}
    >
      {/* Sticky label column — mirrors AggregateCohortTable row label
          (muted-foreground default, foreground when bold). */}
      <td
        className={cn(
          "sticky left-0 z-10 bg-background min-w-[200px] py-1.5 text-muted-foreground whitespace-nowrap",
          row.bold && "font-semibold text-foreground",
        )}
        style={{ paddingLeft: labelPaddingLeft, paddingRight: 12 }}
      >
        <span className="inline-flex items-center gap-1">
          {hasChildren && (
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !isCollapsed && "rotate-90",
              )}
            />
          )}
          {row.label}
        </span>
      </td>
      {/* Month values */}
      {row.values.map((value, i) => (
        <td
          key={i}
          className={cn(
            "px-2 py-1.5 text-right tabular-nums font-mono",
            row.bold && "font-semibold",
            row.colorBySign && value < 0 && "text-red-500",
            row.colorBySign && value > 0 && isCumulativeProfit && "text-green-600",
            row.colorBySign && value < 0 && isCumulativeProfit && "text-red-500",
            value < 0 && !row.colorBySign && row.type === "currency" && "text-red-500"
          )}
        >
          {formatCell(value, row.type, locale)}
        </td>
      ))}
      {/* Total/Avg column */}
      <td
        className={cn(
          "px-2 py-1.5 text-right tabular-nums font-mono border-l",
          row.bold && "font-semibold",
          row.colorBySign && total < 0 && "text-red-500",
          row.colorBySign && total > 0 && isCumulativeProfit && "text-green-600",
          row.colorBySign && total < 0 && isCumulativeProfit && "text-red-500",
          total < 0 && !row.colorBySign && row.type === "currency" && "text-red-500"
        )}
      >
        {formatCell(total, row.type, locale)}
      </td>
    </tr>
  );
}

