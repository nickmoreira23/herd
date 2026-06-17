"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useFinancialStore } from "@/stores/financial-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import {
  AccountingBasisBadge,
  AccountingBasisReconciliation,
} from "./accounting-basis-reconciliation";
import {
  aggregateLifecyclesByCalendarMonth,
  useSpreadsheetCollapse,
  COST_RUBRIC_LABEL_KEYS,
  MEMBER_PREFIX,
  REPS_ROLE_KEY,
  memberRoleKeys,
  memberDownlineKeys,
  cascadePerspective,
  type AggMonth,
} from "./spreadsheet-shared";
import type { CostRubric } from "@/lib/financial-engine";

interface CohortSpreadsheetProps {
  months?: number;
  locale: Locale;
  perspective?: string;
  onPerspectiveChange?: (value: string) => void;
}

// "base" = aggregate view (all cohorts summed each month).
// number = acquisition month (1..24) → walks that single cohort forward.
type CohortView = "base" | number;

export function CohortSpreadsheet({
  months = 12,
  locale,
  perspective = "general",
  onPerspectiveChange,
}: CohortSpreadsheetProps) {
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
      <label className="text-xs text-muted-foreground">{t("financials.cohort.view_label")}</label>
      <select
        value={view === "base" ? "base" : `cohort-${view}`}
        onChange={(e) => {
          const v = e.target.value;
          setView(v === "base" ? "base" : Number(v.replace("cohort-", "")));
        }}
        className="text-xs border rounded-md bg-background px-2 py-1 min-w-[280px] hover:bg-muted/30 transition-colors"
      >
        <option value="base">{t("financials.cohort.view_aggregate")}</option>
        {lifecycleOptions.map((o) => (
          <option key={o.value} value={`cohort-${o.value}`}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Perspective selector — scoped to the aggregate view only (where the
  // cash cascade lives). The per-cohort view has no party dimension in the
  // cascade sense, so the selector is intentionally absent there.
  const cashTotals = results.profitDistribution?.totals?.cash ?? [];
  const PerspectiveSelector = onPerspectiveChange ? (
    <div className="flex items-center gap-2 pb-2">
      <label className="text-xs text-muted-foreground">
        {t("financials.toolbar.perspective.label")}
      </label>
      <select
        value={perspective}
        onChange={(e) => onPerspectiveChange(e.target.value)}
        className="text-xs border rounded-md bg-background px-2 py-1 min-w-[200px] hover:bg-muted/30 transition-colors"
      >
        <option value="general">
          {t("financials.toolbar.perspective.general")}
        </option>
        {cashTotals.length > 0 && (
          <optgroup label={t("financials.toolbar.perspective.parties_group")}>
            {cashTotals.map((p) => (
              <option key={p.partyId} value={p.partyId}>
                {p.name}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label={t("financials.toolbar.perspective.members_group")}>
          {results.salesTeam.levels.map((l) => (
            <option key={l.id} value={`${MEMBER_PREFIX}${l.id}`}>
              {l.name || t("financials.cascade.level_unnamed")}
            </option>
          ))}
          <option value={`${MEMBER_PREFIX}${REPS_ROLE_KEY}`}>
            {t("financials.member_earnings.rep")}
          </option>
        </optgroup>
      </select>
    </div>
  ) : null;

  // Blended revenue-per-sub (the engine's accrual rate). Threaded into
  // both child tables so the per-cohort accrual line in the
  // reconciliation card matches the engine's smoothed math exactly.
  const blendedRevenuePerSub = deriveBlendedRevenuePerSub(results.cohortProjection);

  // Per-tier billing distribution — used by both the per-cohort and the
  // aggregate views so the "Active by Plan & Cycle" rows can show
  // each tier's actual cycle mix in the row label.
  const tierBillingDistributions = new Map<
    string,
    { monthly: number; biannual: number; annual: number }
  >(
    (inputs?.tiers ?? []).map((t) => [
      t.tierId,
      t.billingDistribution ?? inputs.billingCycleDistribution,
    ]),
  );

  if (view !== "base") {
    const lifecycle = cohortLifecycles.find((c) => c.acquisitionMonth === view);
    if (!lifecycle) {
      return (
        <div className="space-y-2">
          {Selector}
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border rounded-md">
            {t("financials.cohort.empty_state")}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {Selector}
        <CohortLifecycleTable
          lifecycle={lifecycle}
          tierBillingDistributions={tierBillingDistributions}
          blendedRevenuePerSub={blendedRevenuePerSub}
          salesTeam={results.salesTeam}
          memberEarnings={results.memberEarnings}
          locale={locale}
        />
      </div>
    );
  }

  // Aggregate view — same visual structure as the per-cohort lifecycle
  // (collapsible sections, parent/child rows, "Active by Plan & Cycle"
  // detail block, COGS broken into Product/Shipping/Processing,
  // cash-flow lumps for biannual/annual revenue + Buck license). Built
  // by SUMMING per-cohort lifecycles by calendar month — that
  // construction guarantees the Mo 1 aggregate equals Cohort-1's Mo-of-life
  // 1 (since only Cohort-1 contributes at calendar Mo 1), giving the user
  // a clean reconciliation benchmark across the two tabs.
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4">
        {Selector}
        {PerspectiveSelector}
      </div>
      <AggregateCohortTable
        cohortLifecycles={cohortLifecycles}
        cohortProjection={results.cohortProjection}
        scenarioTierIds={inputs?.tiers?.map((t) => t.tierId) ?? []}
        tierBillingDistributions={tierBillingDistributions}
        months={months}
        locale={locale}
        cashDistribution={results.profitDistribution?.cash ?? []}
        cashTotals={cashTotals}
        salesTeam={results.salesTeam}
        memberEarnings={results.memberEarnings}
        perspective={perspective}
      />
    </div>
  );
}

/**
 * Blended revenue-per-sub used by the engine's accrual smoothing. Derived
 * from the first projection month so we don't duplicate the engine's
 * weighting math here (zero new logic, just a divide). Falls back to
 * 0 on cold-start scenarios where Mo 1 has no subs yet.
 */
function deriveBlendedRevenuePerSub(
  cohortProjection: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["cohortProjection"],
): number {
  const m1 = cohortProjection[0];
  if (!m1 || m1.subscribers <= 0) return 0;
  return m1.revenue / m1.subscribers;
}

/** Sales Team rows (levels top → base, then reps), keyed by calendar month
 *  via `monthIndex`. Shared by both cohort tables (per-cohort + aggregate);
 *  the structural shape is assignable to each table's local row type. */
function buildSalesTeamRows(
  salesTeam: NonNullable<ReturnType<typeof useFinancialStore.getState>["results"]>["salesTeam"],
  months: { monthIndex: number }[],
  t: ReturnType<typeof useT>,
  keep: Set<string> | null = null,
): {
  label: string;
  getValue: (m: { monthIndex: number }) => number;
  getTotal: () => number;
  format: "number";
}[] {
  const lastMonthIndex = months[months.length - 1]?.monthIndex;
  const series = (arr: number[]) => ({
    getValue: (m: { monthIndex: number }) => arr[m.monthIndex - 1] ?? 0,
    getTotal: () => (lastMonthIndex ? (arr[lastMonthIndex - 1] ?? 0) : 0),
  });
  const rows = [
    ...salesTeam.levels
      .filter((lvl) => !keep || keep.has(lvl.id))
      .map((lvl) => ({
        label: lvl.name || t("financials.cascade.level_unnamed"),
        ...series(lvl.headcountByMonth),
        format: "number" as const,
      })),
  ];
  if (!keep || keep.has(REPS_ROLE_KEY)) {
    rows.push({
      label: t("financials.sales_team.reps"),
      ...series(salesTeam.repsByMonth),
      format: "number" as const,
    });
  }
  return rows;
}

/** Per-member earnings rows (CASH basis) — one representative member per role,
 *  top → base, then the rep with an expandable upfront/residual split. Summed
 *  over the visible window for the Total column. Shared by both cohort tables. */
function buildMemberEarningsRows(
  me: NonNullable<ReturnType<typeof useFinancialStore.getState>["results"]>["memberEarnings"],
  months: { monthIndex: number }[],
  t: ReturnType<typeof useT>,
  keep: Set<string> | null = null,
): {
  id?: string;
  parentId?: string;
  level?: number;
  label: string;
  getValue: (m: { monthIndex: number }) => number;
  getTotal: () => number;
  format: "currency";
}[] {
  const series = (arr: number[]) => ({
    getValue: (m: { monthIndex: number }) => arr[m.monthIndex - 1] ?? 0,
    getTotal: () => months.reduce((s, m) => s + (arr[m.monthIndex - 1] ?? 0), 0),
  });
  type MemberRow = {
    id?: string;
    parentId?: string;
    level?: number;
    label: string;
    getValue: (m: { monthIndex: number }) => number;
    getTotal: () => number;
    format: "currency";
  };
  const rows: MemberRow[] = me.levels
    .filter((lvl) => !keep || keep.has(lvl.id))
    .map((lvl) => ({
      label: lvl.name || t("financials.cascade.level_unnamed"),
      ...series(lvl.cash),
      format: "currency" as const,
    }));
  if (!keep || keep.has(REPS_ROLE_KEY)) {
    rows.push(
      { id: "member-rep", label: t("financials.member_earnings.rep"), ...series(me.reps.cash.total), format: "currency" as const },
      { id: "member-rep--upfront", parentId: "member-rep", level: 1, label: t("financials.member_earnings.upfront"), ...series(me.reps.cash.upfront), format: "currency" as const },
      { id: "member-rep--residual", parentId: "member-rep", level: 1, label: t("financials.member_earnings.residual"), ...series(me.reps.cash.residual), format: "currency" as const },
    );
  }
  return rows;
}


/**
 * Renders ONE acquisition cohort's lifetime in the projection window —
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
  tierBillingDistributions,
  blendedRevenuePerSub,
  salesTeam,
  memberEarnings,
  locale,
}: {
  lifecycle: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["cohortLifecycles"][number];
  /** Sales-force headcount per calendar month (levels top → base + reps),
   *  read by the cohort's `monthIndex` — reps grow scenario-level, not
   *  cohort-level, so the series is central. */
  salesTeam: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["salesTeam"];
  /** Per-member career-trajectory earnings (cash basis used in this tab). */
  memberEarnings: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["memberEarnings"];
  /** Per-tier billing distribution (same source the scenario builder
   *  shows). Drives the "(X%)" suffix in the "Active by Plan & Cycle"
   *  rows so the user reads each tier's mix without leaving the table. */
  tierBillingDistributions: Map<
    string,
    { monthly: number; biannual: number; annual: number }
  >;
  /** Engine's blended revenue per active sub (the accrual rate). Used
   *  to derive this cohort's accrual series for the reconciliation
   *  card. Pure derivation — no engine logic duplicated. */
  blendedRevenuePerSub: number;
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

  // Collapse state — sections and parent rows are independently
  // collapsible. Default state matches the user's "overview-first"
  // mental model: parent rows that have detail children start
  // collapsed; sections start expanded EXCEPT the dense
  // "Active by Plan & Cycle" detail block which starts collapsed.
  // Click any chevron to toggle.
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(["active-by-plan-cycle"]),
  );
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(() => {
    const base = new Set([
      "subscribers-gross", // hide per-tier breakdown of gross signups
      "monthly-billing", // hide per-tier breakdown of monthly revenue
      "biannual-billing",
      "annual-billing",
      "commissions", // hide per-tier commission spend behind the headline
      "buck", // hide license/tokens behind the Buck rollup
      "addons", // hide individual add-ons behind the Add-Ons rollup
      "member-rep", // hide the rep's upfront/residual split behind the headline
      "active-subscribers", // hide the per-plan/cycle breakdown behind the total
    ]);
    // Active by Plan & Cycle parents AND per-tier commission parents —
    // one of each per tier. Both start collapsed so the user sees plan-
    // level totals first and drills into cycle / upfront-residual detail
    // only when needed.
    for (const t of grossNewSubsByTier ?? []) {
      base.add(`active-by-plan-cycle--${t.tierId}`);
      base.add(`commissions--${t.tierId}`);
    }
    return base;
  });
  const toggleSection = (id: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleRow = (id: string) =>
    setCollapsedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Header summary chips — give the cohort a one-line identity above
  // the table so the user always sees what "this safra" is.
  const summaryRow = (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-muted/30 rounded-md text-xs">
      <span className="font-semibold">
        {t("financials.cohort.lifecycle.acquired_in_month")} {acquisitionMonth}
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.lifecycle.gross_label")}</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumber(grossNewSubs, locale, "integer")}
        </span>
      </span>
      {chargebacks > 0 && (
        <>
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="text-muted-foreground">{t("financials.cohort.lifecycle.chargebacks_label")}</span>{" "}
            <span className="font-semibold tabular-nums text-red-500">
              {formatNumber(chargebacks, locale, "integer")}
            </span>
          </span>
        </>
      )}
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.lifecycle.net_label")}</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumber(netNewSubs, locale, "integer")}
        </span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.lifecycle.lifetime_profit_label")}</span>{" "}
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
        <span className="text-muted-foreground">{t("financials.cohort.lifecycle.payback_label")}</span>{" "}
        <span className="font-semibold tabular-nums">
          {totals.paybackMonth != null
            ? `Month ${totals.paybackMonth} of life`
            : "Not within window"}
        </span>
      </span>
    </div>
  );

  type RowDef = {
    /** Unique within the section. Required when this row is a parent
     *  (referenced by other rows' parentId) OR when this row is a
     *  child (so visibility logic can look up its parent). */
    id?: string;
    /** Reference to another row's id in the same section. When that
     *  parent is collapsed, this row is hidden. */
    parentId?: string;
    label: string;
    getValue: (m: typeof months[number]) => number;
    getTotal: () => number;
    format: "currency" | "number" | "percent" | "decimal";
    bold?: boolean;
    profitColor?: boolean;
    lossColor?: boolean;
  };

  type SectionDef = {
    /** Unique section id — also serves as the collapse-state key. */
    id: string;
    section: string;
    rows: RowDef[];
    /** Section starts collapsed when true. Default false (expanded). */
    defaultCollapsed?: boolean;
  };

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

  // Index lookup so the lifecycle's derived rows can be read by month
  // index in the existing CohortSectionBlock signature.
  const lifecycleByMonthOfLife = new Map(
    lifecycleRows.map((r) => [r.monthOfLife, r]),
  );

  // Per-tier rows under "Subscribers" — show how the cohort's gross
  // acquisitions distribute across plans. Label carries the
  // structural tier % so the user sees both quantity and share
  // without an extra row per tier. Each row is a CHILD of the
  // "subscribers-gross" parent so the user can collapse the per-tier
  // detail and just see the headline 150.
  const perTierSubsRows: {
    id: string;
    parentId: string;
    label: string;
    getValue: (m: CohortMonth) => number;
    getTotal: () => number;
    format: "number";
  }[] =
    grossNewSubsByTier && grossNewSubsByTier.length > 1
      ? grossNewSubsByTier.map((entry) => ({
          id: `subscribers-gross--${entry.tierId}`,
          parentId: "subscribers-gross",
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
    id: string;
    parentId: string;
    label: string;
    getValue: (m: CohortMonth) => number;
    getTotal: () => number;
    format: "currency";
  }[] => {
    if (!grossNewSubsByTier || grossNewSubsByTier.length <= 1) return [];
    return grossNewSubsByTier.map((tierEntry) => ({
      id: `${cycle}-billing--${tierEntry.tierId}`,
      parentId: `${cycle}-billing`,
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
    // Sales Team — one row per leadership level (top → base), then the reps
    // base. Reps grow scenario-level, so headcount is read by calendar month.
    {
      id: "sales-team",
      section: t("financials.projection.section.sales_team"),
      rows: buildSalesTeamRows(salesTeam, months, t),
    },
    {
      id: "subscribers",
      section: t("financials.projection.section.subscribers"),
      rows: [
        // Subscribers — the cohort's gross acquisitions. Static row:
        // the cohort's size at signup is `grossNewSubs`, shown in Mo 1
        // and zero everywhere after (no new subs join an existing cohort).
        // Parent of `perTierSubsRows`: when collapsed, the per-plan
        // breakdown hides under the "Subscribers: 150" headline.
        {
          id: "subscribers-gross",
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
        // Churn — surviving subs lost this month-of-life.
        {
          label: t("financials.projection.row.lost_to_churn"),
          getValue: (m) => m.churned,
          getTotal: () => months.reduce((s, m) => s + m.churned, 0),
          format: "number",
          lossColor: true,
        },
        // Active Subscribers — surviving subs at this month-of-life. Parent of
        // the per-plan/cycle breakdown nested below (>1 tier only): answers
        // "where are these N active subs?" so the user can audit any revenue
        // lump in the section below. Counts are fractional (no rounding) so
        // revenue × rate × cycle-months reconciles with the REVENUE sub-rows.
        {
          id: "active-subscribers",
          label: "Active Subscribers",
          getValue: (m) => m.survivingSubs,
          getTotal: () => months[months.length - 1]?.survivingSubs ?? 0,
          format: "number",
          bold: true,
        },
        ...(grossNewSubsByTier && grossNewSubsByTier.length > 1
          ? grossNewSubsByTier.flatMap((tierEntry) => {
              const cycles: ("monthly" | "biannual" | "annual")[] = [
                "monthly",
                "biannual",
                "annual",
              ];
              const cycleLabels: Record<typeof cycles[number], string> = {
                monthly: "Monthly",
                biannual: "Biannual",
                annual: "Annual",
              };
              const tierBilling = tierBillingDistributions.get(tierEntry.tierId);
              const parentId = `active-by-plan-cycle--${tierEntry.tierId}`;
              // Tier total (sum across cycles) — nested under Active Subscribers.
              const tierParent: RowDef = {
                id: parentId,
                parentId: "active-subscribers",
                label: t("financials.projection.tier_indent", {
                  tier: tierEntry.tierId,
                }),
                getValue: (m: CohortMonth) => {
                  const e = m.subscribersByTierAndCycle?.find(
                    (x) => x.tierId === tierEntry.tierId,
                  );
                  return e ? e.monthly + e.biannual + e.annual : 0;
                },
                getTotal: () => {
                  const monthCount = months.length || 1;
                  const total = months.reduce((s, m) => {
                    const e = m.subscribersByTierAndCycle?.find(
                      (x) => x.tierId === tierEntry.tierId,
                    );
                    return (
                      s + (e ? e.monthly + e.biannual + e.annual : 0)
                    );
                  }, 0);
                  return total / monthCount;
                },
                format: "decimal" as const,
              };
              // Per-cycle children — visible when the tier parent is expanded.
              const cycleChildren: RowDef[] = cycles.map((cycle) => ({
                id: `${parentId}--${cycle}`,
                parentId,
                label: t("financials.projection.tier_subindent", {
                  tier: `${cycleLabels[cycle]} (${formatNumber(
                    (tierBilling?.[cycle] ?? 0) / 100,
                    locale,
                    "percent",
                  )})`,
                }),
                getValue: (m: CohortMonth) => {
                  const e = m.subscribersByTierAndCycle?.find(
                    (x) => x.tierId === tierEntry.tierId,
                  );
                  return e ? e[cycle] : 0;
                },
                getTotal: () => {
                  const monthCount = months.length || 1;
                  const total = months.reduce((s, m) => {
                    const e = m.subscribersByTierAndCycle?.find(
                      (x) => x.tierId === tierEntry.tierId,
                    );
                    return s + (e ? e[cycle] : 0);
                  }, 0);
                  return total / monthCount;
                },
                format: "decimal" as const,
              }));
              return [tierParent, ...cycleChildren];
            })
          : []),
      ],
    },
    {
      id: "revenue",
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
        // Each cycle row is the parent of per-tier sub-rows; collapse
        // a cycle to hide its plan breakdown.
        {
          id: "monthly-billing",
          label: t("financials.projection.row.monthly_billing"),
          getValue: (m) => m.revenueByBillingCycle.monthly,
          getTotal: () => totals.revenueByBillingCycle.monthly,
          format: "currency",
        },
        ...buildCyclePerTierRows("monthly"),
        {
          id: "biannual-billing",
          label: t("financials.projection.row.biannual_billing"),
          getValue: (m) => m.revenueByBillingCycle.biannual,
          getTotal: () => totals.revenueByBillingCycle.biannual,
          format: "currency",
        },
        ...buildCyclePerTierRows("biannual"),
        {
          id: "annual-billing",
          label: t("financials.projection.row.annual_billing"),
          getValue: (m) => m.revenueByBillingCycle.annual,
          getTotal: () => totals.revenueByBillingCycle.annual,
          format: "currency",
        },
        ...buildCyclePerTierRows("annual"),
      ],
    },
    {
      id: "cogs",
      section: t("financials.projection.section.cogs"),
      rows: [
        // Three-line breakdown — product COGS and shipping/handling
        // recur every month with the active base; payment processing
        // lumps with the cash inflows (per-transaction fee).
        {
          label: "Product Cost",
          getValue: (m) => m.productCogsCost,
          getTotal: () => totals.productCogsCost,
          format: "currency",
        },
        {
          label: "Shipping",
          getValue: (m) => m.shippingCost,
          getTotal: () => totals.shippingCost,
          format: "currency",
        },
        {
          label: "Handling",
          getValue: (m) => m.handlingCost,
          getTotal: () => totals.handlingCost,
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
      id: "opex",
      section: t("financials.projection.section.opex"),
      rows: [
        // OpEx ordering: structural / "ground floor" costs first
        // (Overhead, Welcome Kit), then variable platform/add-on costs
        // (Buck, Add-Ons), then commissions last since they're the
        // most active line for the user to drill into.
        // ── Overhead ──────────────────────────────────────────────
        // Per-cohort overhead is intentionally $0 — it's a scenario-
        // level fixed cost not attributable to any single cohort. The
        // line stays visible so the row order matches the aggregate
        // and Spreadsheet views.
        {
          label: t("financials.projection.row.overhead"),
          getValue: () => 0,
          getTotal: () => 0,
          format: "currency",
        },
        // ── Welcome Kit ───────────────────────────────────────────
        {
          label: "Welcome Kit",
          getValue: (m) => m.welcomeKitCost,
          getTotal: () => totals.welcomeKitCost,
          format: "currency",
        },
        // ── Buck (parent) → Licenses + Tokens ─────────────────────
        // Single rollup so the user sees the platform cost as one
        // line; expand to inspect license vs token split (different
        // cash patterns: license lumps with billing, tokens recur).
        {
          id: "buck",
          label: "Buck",
          getValue: (m) => m.buckCost,
          getTotal: () => totals.buckCost,
          format: "currency",
        },
        {
          id: "buck--license",
          parentId: "buck",
          label: t("financials.projection.tier_indent", {
            tier: t("financials.projection.row.buck_license"),
          }),
          getValue: (m) => m.buckLicenseCost,
          getTotal: () => totals.buckLicenseCost,
          format: "currency",
        },
        {
          id: "buck--tokens",
          parentId: "buck",
          label: t("financials.projection.tier_indent", {
            tier: t("financials.projection.row.buck_tokens"),
          }),
          getValue: (m) => m.buckTokenCost,
          getTotal: () => totals.buckTokenCost,
          format: "currency",
        },
        // ── Add-Ons (parent) → Path Scale ─────────────────────────
        // Add-Ons is the catch-all for tier-attached extras. Today
        // there's a single child (Path Scale); future add-ons would
        // each get their own child row.
        {
          id: "addons",
          label: "Add-Ons",
          getValue: (m) => m.addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        {
          id: "addons--path-scale",
          parentId: "addons",
          label: t("financials.projection.tier_indent", { tier: "Path Scale" }),
          getValue: (m) => m.addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        // ── Commissions (parent) → tier (parent) → upfront/residual
        // Three levels of detail: the headline total, then per-plan
        // spend, then the upfront vs residual split inside each plan.
        // Lets the user audit exactly what makes up "Legend $14k"
        // without leaving the table.
        {
          id: "commissions",
          label: t("financials.projection.row.commissions"),
          getValue: (m) => lifecycleByMonthOfLife.get(m.monthOfLife)?.commissions ?? 0,
          getTotal: () => lifetimeTotals.commissions,
          format: "currency",
        },
        ...(grossNewSubsByTier && grossNewSubsByTier.length > 1
          ? grossNewSubsByTier.flatMap<RowDef>((tierEntry) => {
              const tierParentId = `commissions--${tierEntry.tierId}`;
              const tierParent: RowDef = {
                id: tierParentId,
                parentId: "commissions",
                label: t("financials.projection.tier_indent", {
                  tier: tierEntry.tierId,
                }),
                getValue: (m) => {
                  const e = m.commissionByTier?.find(
                    (x) => x.tierId === tierEntry.tierId,
                  );
                  return e ? e.upfront + e.residual : 0;
                },
                getTotal: () => {
                  const e = totals.commissionByTier?.find(
                    (x) => x.tierId === tierEntry.tierId,
                  );
                  return e ? e.upfront + e.residual : 0;
                },
                format: "currency",
              };
              const upfront: RowDef = {
                id: `${tierParentId}--upfront`,
                parentId: tierParentId,
                label: t("financials.projection.tier_subindent", {
                  tier: "Upfront",
                }),
                getValue: (m) =>
                  m.commissionByTier?.find((x) => x.tierId === tierEntry.tierId)?.upfront ??
                  0,
                getTotal: () =>
                  totals.commissionByTier?.find((x) => x.tierId === tierEntry.tierId)
                    ?.upfront ?? 0,
                format: "currency",
              };
              const residual: RowDef = {
                id: `${tierParentId}--residual`,
                parentId: tierParentId,
                label: t("financials.projection.tier_subindent", {
                  tier: "Residual",
                }),
                getValue: (m) =>
                  m.commissionByTier?.find((x) => x.tierId === tierEntry.tierId)?.residual ??
                  0,
                getTotal: () =>
                  totals.commissionByTier?.find((x) => x.tierId === tierEntry.tierId)
                    ?.residual ?? 0,
                format: "currency",
              };
              return [tierParent, upfront, residual];
            })
          : []),
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
      id: "bottom-line",
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
    // Member Earnings — last section (after the channel P&L), so earnings
    // read as the bottom line of who-earns-what, not above revenue.
    {
      id: "member-earnings",
      section: t("financials.projection.section.member_earnings"),
      rows: buildMemberEarningsRows(memberEarnings, months, t),
    },
  ];

  function formatValue(v: number, fmt: "currency" | "number" | "percent" | "decimal"): string {
    switch (fmt) {
      case "currency":
        return formatNumberAsMoney(v, locale);
      case "number":
        return formatNumber(Math.round(v), locale, "integer");
      case "decimal":
        // Fractional sub counts — use 2 decimals so 0.18 reads as
        // "0.18" instead of being rounded away. Whole numbers still
        // show as e.g. "9.00".
        return formatNumber(v, locale, "decimal");
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

  // Reconciliation series for this cohort. Cash = the lifecycle's own
  // monthly revenue (already cash-flow with biannual/annual lumps).
  // Accrual = `survivingSubs × blendedRevenuePerSub` per month-of-life,
  // mirroring how the engine smooths revenue at the aggregate level.
  // Range covers the cohort's lifetime within the projection window.
  const accrualSeries = lifecycle.months.map((m) => m.survivingSubs * blendedRevenuePerSub);
  const cashSeries = lifecycle.months.map((m) => m.revenue);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <AccountingBasisBadge basis="cash" />
      </div>
      {summaryRow}
      <AccountingBasisReconciliation
        accrualSeries={accrualSeries}
        cashSeries={cashSeries}
        locale={locale}
      />
      {/* The wrapper has to be a real scroll viewport (both axes, capped
          via maxH) so sticky thead anchors to its top edge. With just
          `overflow-x-auto` and no height limit, the wrapper grows to
          fit the table and the sticky header has nothing to stick to —
          it follows the page scroll up and out of view. */}
      <div className="overflow-auto border rounded-md max-h-[75vh]">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Header row sticky on the Y axis so column labels stay
                visible as the user scrolls the table downward. The
                metric (left-most) cell is sticky on BOTH axes — it has
                to outrank everything else, so it gets the highest
                z-index in the table; month headers sit just below at
                z-20; section headers (sticky left only) stay at z-10. */}
            <tr className="border-b bg-muted">
              <th className="sticky left-0 top-0 z-30 bg-muted min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">
                {t("financials.cohort.column.metric")}
              </th>
              {months.map((m) => (
                <th
                  key={m.monthOfLife}
                  className="sticky top-0 z-20 bg-muted min-w-[90px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                  title={`Calendar Month ${m.monthIndex}`}
                >
                  {t("financials.cohort.lifecycle.month_abbr")} {m.monthOfLife}
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-muted min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
                {t("financials.cohort.lifecycle.lifetime_header")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <CohortSectionBlock
                key={section.id}
                section={section}
                months={months}
                formatValue={formatValue}
                valueCellClass={valueCellClass}
                isSectionCollapsed={collapsedSections.has(section.id)}
                collapsedRows={collapsedRows}
                onToggleSection={() => toggleSection(section.id)}
                onToggleRow={toggleRow}
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
  isSectionCollapsed,
  collapsedRows,
  onToggleSection,
  onToggleRow,
}: {
  section: {
    id: string;
    section: string;
    rows: {
      id?: string;
      parentId?: string;
      label: string;
      getValue: (m: CohortMonth) => number;
      getTotal: () => number;
      format: "currency" | "number" | "percent" | "decimal";
      bold?: boolean;
      profitColor?: boolean;
      lossColor?: boolean;
    }[];
  };
  months: CohortMonth[];
  formatValue: (v: number, f: "currency" | "number" | "percent" | "decimal") => string;
  valueCellClass: (v: number, profitColor?: boolean, lossColor?: boolean) => string;
  isSectionCollapsed: boolean;
  collapsedRows: Set<string>;
  onToggleSection: () => void;
  onToggleRow: (id: string) => void;
}) {
  // Build a map of which rows have children — a row is a parent iff
  // some other row in the same section has parentId === row.id. Used
  // to decide whether to render a chevron (parents only).
  const rowsWithChildren = new Set<string>();
  for (const r of section.rows) {
    if (r.parentId) rowsWithChildren.add(r.parentId);
  }

  // Walk a row's ancestor chain — if any ancestor is collapsed, the
  // row is hidden. Cheap O(depth) lookup; rows here have at most one
  // level of nesting today, but the loop handles deeper trees if we
  // add them later.
  const rowsById = new Map(section.rows.filter((r) => r.id).map((r) => [r.id!, r]));
  const isRowVisible = (row: { parentId?: string }): boolean => {
    let parentId = row.parentId;
    while (parentId) {
      if (collapsedRows.has(parentId)) return false;
      parentId = rowsById.get(parentId)?.parentId;
    }
    return true;
  };

  return (
    <>
      {/* Section header — clickable across the full row; chevron
          rotates to indicate collapsed/expanded. The section's data
          rows are skipped entirely when collapsed (header still
          visible so the user can re-open). Click handler on the
          <tr> so any cell inside the header counts as a toggle. */}
      <tr
        className="bg-muted cursor-pointer select-none hover:bg-muted/80 transition-colors"
        onClick={onToggleSection}
      >
        <td
          colSpan={months.length + 2}
          className="sticky left-0 z-10 bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !isSectionCollapsed && "rotate-90",
              )}
            />
            {section.section}
          </span>
        </td>
      </tr>
      {!isSectionCollapsed &&
        section.rows.map((row) => {
          if (!isRowVisible(row)) return null;
          const totalValue = row.getTotal();
          const hasChildren = !!row.id && rowsWithChildren.has(row.id);
          const isCollapsed = !!row.id && collapsedRows.has(row.id);
          const handleRowClick = hasChildren && row.id
            ? () => onToggleRow(row.id!)
            : undefined;
          return (
            <tr
              key={row.id ?? row.label}
              className={cn(
                "border-b border-border/40 hover:bg-muted/10 transition-colors",
                hasChildren && "cursor-pointer select-none",
              )}
              onClick={handleRowClick}
            >
              <td
                className={cn(
                  "sticky left-0 z-10 bg-background min-w-[200px] px-3 py-1.5 text-muted-foreground whitespace-nowrap",
                  row.bold && "font-semibold text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {hasChildren ? (
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform",
                        !isCollapsed && "rotate-90",
                      )}
                    />
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  {row.label}
                </span>
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

/**
 * Aggregate cohort table — same visual structure as CohortLifecycleTable
 * but indexed by CALENDAR MONTH and summed across all cohorts. Built by
 * adding `cohortLifecycles[c].months[K - c.acquisitionMonth]` for every
 * cohort c that's active at calendar month K.
 *
 * By construction:
 *   - Calendar Mo 1 ≡ Cohort-1's Mo-of-life 1 (only cohort 1 is active).
 *     Use this as the user's primary reconciliation benchmark across the
 *     two views — every per-line value matches.
 *   - Calendar Mo K ≡ Σ across cohorts c≤K of cohort_c.months[K-c+1].
 *
 * Operational overhead is the only line NOT computed by summing cohorts —
 * it's a scenario-level fixed cost, pulled from the engine's existing
 * aggregate `cohortProjection[K-1].operationalOverhead` and added on top.
 */
function AggregateCohortTable({
  cohortLifecycles,
  cohortProjection,
  scenarioTierIds,
  tierBillingDistributions,
  months,
  locale,
  cashDistribution,
  cashTotals,
  salesTeam,
  memberEarnings,
  perspective = "general",
}: {
  cohortLifecycles: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["cohortLifecycles"];
  cohortProjection: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["cohortProjection"];
  cashDistribution: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["profitDistribution"]["cash"];
  cashTotals: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["profitDistribution"]["totals"]["cash"];
  salesTeam: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["salesTeam"];
  memberEarnings: NonNullable<
    ReturnType<typeof useFinancialStore.getState>["results"]
  >["memberEarnings"];
  perspective?: string;
  scenarioTierIds: string[];
  /** Per-tier billing distribution — drives the "(X%)" suffix in the
   *  Active by Plan & Cycle row labels. */
  tierBillingDistributions: Map<
    string,
    { monthly: number; biannual: number; annual: number }
  >;
  months: number;
  locale: Locale;
}) {
  const t = useT();

  // Collapse state — same defaults as the per-cohort lifecycle so the
  // two tabs read identically. Active by Plan & Cycle starts collapsed
  // (12 dense detail rows), per-tier sub-breakdowns start collapsed
  // under their parents.
  const initialCollapsedRows: string[] = [
    "subscribers-gross",
    "monthly-billing",
    "biannual-billing",
    "annual-billing",
    "commissions",
    "overhead",
    "buck",
    "addons",
    "member-rep",
    "active-subscribers", // hide the per-plan/cycle breakdown behind the total
  ];
  for (const tid of scenarioTierIds) {
    initialCollapsedRows.push(`active-by-plan-cycle--${tid}`);
    initialCollapsedRows.push(`commissions--${tid}`);
  }
  // Party cost drill-down (S2 breakdown) starts collapsed — the "(−) Party
  // costs" row shows the total; expand to reveal per-rubric, then per-level.
  for (const p of cashTotals) {
    initialCollapsedRows.push(`cascade-party--${p.partyId}--cost`);
    initialCollapsedRows.push(`cascade-party--${p.partyId}--cost--leadershipCommission`);
  }
  const {
    collapsedSections,
    collapsedRows,
    toggleSection,
    toggleRow,
  } = useSpreadsheetCollapse([], initialCollapsedRows);

  // Tier id list — pulled from any cohort's grossNewSubsByTier (all
  // cohorts share the same tier shape) with a fallback to the scenario
  // input. Determines the per-tier breakdown rows.
  const tierIds: string[] =
    cohortLifecycles[0]?.grossNewSubsByTier?.map((e) => e.tierId) ??
    scenarioTierIds;
  const hasMultipleTiers = tierIds.length > 1;

  // Per-tier subscriber-percent map (used in row labels — read once from
  // any cohort, since the scenario distribution is invariant across cohorts).
  const tierSharePct = new Map<string, number>(
    (cohortLifecycles[0]?.grossNewSubsByTier ?? []).map((e) => [
      e.tierId,
      e.subscriberPercent,
    ]),
  );

  // ── Build aggregate-by-calendar-month from cohortLifecycles ─────────
  // Aggregator and AggMonth type are exported from `./spreadsheet-shared`
  // so projection-spreadsheet can mirror the same row structure without
  // duplicating the aggregation logic.

  const aggMonths = aggregateLifecyclesByCalendarMonth(
    cohortLifecycles,
    cohortProjection,
    months,
    tierIds,
  );

  // Total column — sum each line across the months in view.
  const sum = (pick: (m: AggMonth) => number) =>
    aggMonths.reduce((s, m) => s + pick(m), 0);
  const totals = {
    grossNewSubs: sum((m) => m.grossNewSubs),
    netNewSubs: sum((m) => m.netNewSubs),
    chargebacks: sum((m) => m.chargebacks),
    survivingSubsLast: aggMonths[aggMonths.length - 1]?.survivingSubs ?? 0,
    churned: sum((m) => m.churned),
    revenue: sum((m) => m.revenue),
    revenueByBillingCycle: {
      monthly: sum((m) => m.revenueByBillingCycle.monthly),
      biannual: sum((m) => m.revenueByBillingCycle.biannual),
      annual: sum((m) => m.revenueByBillingCycle.annual),
    },
    revenueByTierAndCycle: tierIds.map((tierId) => ({
      tierId,
      monthly: aggMonths.reduce(
        (s, m) =>
          s +
          (m.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.monthly ?? 0),
        0,
      ),
      biannual: aggMonths.reduce(
        (s, m) =>
          s +
          (m.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.biannual ?? 0),
        0,
      ),
      annual: aggMonths.reduce(
        (s, m) =>
          s +
          (m.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.annual ?? 0),
        0,
      ),
    })),
    productCogsCost: sum((m) => m.productCogsCost),
    shippingCost: sum((m) => m.shippingCost),
    handlingCost: sum((m) => m.handlingCost),
    shippingHandlingCost: sum((m) => m.shippingHandlingCost),
    paymentProcessingCost: sum((m) => m.paymentProcessingCost),
    productCost: sum((m) => m.productCost),
    buckLicenseCost: sum((m) => m.buckLicenseCost),
    buckTokenCost: sum((m) => m.buckTokenCost),
    buckCost: sum((m) => m.buckCost),
    welcomeKitCost: sum((m) => m.welcomeKitCost),
    chargebackCost: sum((m) => m.chargebackCost),
    commissionUpfront: sum((m) => m.commissionUpfront),
    commissionResidual: sum((m) => m.commissionResidual),
    addOnCost: sum((m) => m.addOnCost),
    operationalOverhead: sum((m) => m.operationalOverhead),
    netProfit: sum((m) => m.netProfit),
    cumulativeProfit: aggMonths[aggMonths.length - 1]?.cumulativeProfit ?? 0,
  };
  const totalsGrossProfit = totals.revenue - totals.productCost;
  const totalsGrossMarginPct =
    totals.revenue > 0 ? (totalsGrossProfit / totals.revenue) * 100 : 0;
  const totalsCommissions = totals.commissionUpfront + totals.commissionResidual;
  const totalsTotalOpEx =
    totalsCommissions +
    totals.buckCost +
    totals.addOnCost +
    totals.welcomeKitCost +
    totals.operationalOverhead;
  const totalsNetMarginPct =
    totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  // Header summary chips — same shape the per-cohort table uses, but
  // showing projection-window totals across all cohorts.
  const summaryRow = (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-muted/30 rounded-md text-xs">
      <span className="font-semibold">{t("financials.cohort.aggregate.title")}</span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.aggregate.active_last_label")}</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumber(totals.survivingSubsLast, locale, "integer")}
        </span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.aggregate.window_revenue_label")}</span>{" "}
        <span className="font-semibold tabular-nums">
          {formatNumberAsMoney(totals.revenue, locale)}
        </span>
      </span>
      <span className="text-muted-foreground">·</span>
      <span>
        <span className="text-muted-foreground">{t("financials.cohort.aggregate.window_profit_label")}</span>{" "}
        <span
          className={cn(
            "font-semibold tabular-nums",
            totals.netProfit >= 0 ? "text-emerald-600" : "text-red-500",
          )}
        >
          {formatNumberAsMoney(totals.netProfit, locale)}
        </span>
      </span>
    </div>
  );

  // Per-tier rows under "Subscribers" — gross acquisitions distributed
  // across plans (only at the cohort's first month-of-life). Children
  // of the `subscribers-gross` parent so the user can collapse the
  // detail and just see the headline total.
  type AggRow = {
    id?: string;
    parentId?: string;
    level?: number;
    label: string;
    getValue: (m: AggMonth) => number;
    getTotal: () => number;
    format: "currency" | "number" | "percent" | "decimal";
    bold?: boolean;
    profitColor?: boolean;
    lossColor?: boolean;
  };

  const perTierGrossSubsRows: AggRow[] = hasMultipleTiers
    ? tierIds.map((tierId) => ({
        id: `subscribers-gross--${tierId}`,
        parentId: "subscribers-gross",
        label: t("financials.projection.tier_indent_with_pct", {
          tier: tierId,
          percent: formatNumber(
            (tierSharePct.get(tierId) ?? 0) / 100,
            locale,
            "percent",
          ),
        }),
        getValue: (m) =>
          m.grossNewSubsByTier.find((e) => e.tierId === tierId)?.count ?? 0,
        getTotal: () =>
          aggMonths.reduce(
            (s, m) =>
              s + (m.grossNewSubsByTier.find((e) => e.tierId === tierId)?.count ?? 0),
            0,
          ),
        format: "number",
      }))
    : [];

  const buildCyclePerTierRows = (
    cycle: "monthly" | "biannual" | "annual",
  ): AggRow[] => {
    if (!hasMultipleTiers) return [];
    return tierIds.map((tierId) => ({
      id: `${cycle}-billing--${tierId}`,
      parentId: `${cycle}-billing`,
      label: t("financials.projection.tier_subindent", { tier: tierId }),
      getValue: (m) =>
        m.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ?? 0,
      getTotal: () =>
        totals.revenueByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ?? 0,
      format: "currency",
    }));
  };

  // Profit cascade (CASH basis) — S3b. Mirrors the accrual cascade in
  // projection-spreadsheet, sourced from `profitDistribution.cash` +
  // `totals.cash`. Revenue → shared costs → distributable → per-party
  // [net / gross / cost] → undistributed → channel result. The channel
  // result is the bottom-line invariant (≡ the aggregate cash net profit,
  // section `bottom_line`). All-shared → party costs are 0 and channel ==
  // distributable. Cash uses `productCost` for COGS, so magnitudes differ
  // from the accrual cascade — expected.
  const cashByMonth = (mi: number) => cashDistribution[mi - 1];
  const totalOf = (getVal: (m: AggMonth) => number) => () =>
    aggMonths.reduce((s, m) => s + getVal(m), 0);
  const profitSplitRows: AggRow[] = [];
  if (
    cashDistribution.length > 0 &&
    (cashTotals.length > 0 || cashDistribution.some((d) => d.undistributed !== 0))
  ) {
    profitSplitRows.push({
      id: "cascade-revenue",
      label: t("financials.cascade.revenue"),
      getValue: (m) => m.revenue,
      getTotal: totalOf((m) => m.revenue),
      format: "currency",
    });
    profitSplitRows.push({
      id: "cascade-shared",
      label: t("financials.cascade.shared_costs"),
      getValue: (m) => cashByMonth(m.monthIndex)?.sharedCosts ?? 0,
      getTotal: totalOf((m) => cashByMonth(m.monthIndex)?.sharedCosts ?? 0),
      format: "currency",
    });
    profitSplitRows.push({
      id: "cascade-distributable",
      label: t("financials.cascade.distributable"),
      getValue: (m) => cashByMonth(m.monthIndex)?.distributable ?? 0,
      getTotal: totalOf((m) => cashByMonth(m.monthIndex)?.distributable ?? 0),
      format: "currency",
      bold: true,
      profitColor: true,
    });
    for (const party of cashTotals) {
      const pid = party.partyId;
      const partyRowId = `cascade-party--${pid}`;
      const slice = (m: AggMonth, key: "amount" | "partyCost" | "net") =>
        cashByMonth(m.monthIndex)?.byParty.find((b) => b.partyId === pid)?.[
          key
        ] ?? 0;
      profitSplitRows.push({
        id: partyRowId,
        parentId: "cascade-distributable",
        level: 1,
        label: t("financials.pl.party_label", {
          name: party.name,
          percent: party.percent,
        }),
        getValue: (m) => slice(m, "net"),
        getTotal: totalOf((m) => slice(m, "net")),
        format: "currency",
        profitColor: true,
      });
      profitSplitRows.push({
        id: `${partyRowId}--gross`,
        parentId: partyRowId,
        level: 2,
        label: t("financials.cascade.party_gross"),
        getValue: (m) => slice(m, "amount"),
        getTotal: totalOf((m) => slice(m, "amount")),
        format: "currency",
      });
      const costRowId = `${partyRowId}--cost`;
      profitSplitRows.push({
        id: costRowId,
        parentId: partyRowId,
        level: 2,
        label: t("financials.cascade.party_cost"),
        getValue: (m) => slice(m, "partyCost"),
        getTotal: totalOf((m) => slice(m, "partyCost")),
        format: "currency",
      });
      // Drill-down: one row per attributed rubric (level 3); under leadership
      // commission, one row per level (level 4). Rubric/level sets are the
      // union across the visible window in first-seen order.
      const breakdownOf = (m: AggMonth) =>
        cashByMonth(m.monthIndex)?.byParty.find((b) => b.partyId === pid)
          ?.costBreakdown ?? [];
      const rubricsSeen: CostRubric[] = [];
      for (const m of aggMonths) {
        for (const entry of breakdownOf(m)) {
          if (!rubricsSeen.includes(entry.rubric)) rubricsSeen.push(entry.rubric);
        }
      }
      for (const rubric of rubricsSeen) {
        const rubricRowId = `${costRowId}--${rubric}`;
        profitSplitRows.push({
          id: rubricRowId,
          parentId: costRowId,
          level: 3,
          label: t(COST_RUBRIC_LABEL_KEYS[rubric]),
          getValue: (m) => breakdownOf(m).find((e) => e.rubric === rubric)?.amount ?? 0,
          getTotal: totalOf(
            (m) => breakdownOf(m).find((e) => e.rubric === rubric)?.amount ?? 0,
          ),
          format: "currency",
        });
        if (rubric !== "leadershipCommission") continue;
        const levelsSeen: { id: string; name: string }[] = [];
        for (const m of aggMonths) {
          const lead = breakdownOf(m).find((e) => e.rubric === "leadershipCommission");
          for (const lv of lead?.levels ?? []) {
            if (!levelsSeen.some((s) => s.id === lv.id)) {
              levelsSeen.push({ id: lv.id, name: lv.name });
            }
          }
        }
        for (const lv of levelsSeen) {
          const levelAmount = (m: AggMonth) =>
            breakdownOf(m)
              .find((e) => e.rubric === "leadershipCommission")
              ?.levels?.find((l) => l.id === lv.id)?.amount ?? 0;
          profitSplitRows.push({
            id: `${rubricRowId}--${lv.id}`,
            parentId: rubricRowId,
            level: 4,
            label: lv.name || t("financials.cascade.level_unnamed"),
            getValue: levelAmount,
            getTotal: totalOf(levelAmount),
            format: "currency",
          });
        }
      }
    }
    profitSplitRows.push({
      id: "cascade-undistributed",
      label: t("financials.cascade.undistributed"),
      getValue: (m) => cashByMonth(m.monthIndex)?.undistributed ?? 0,
      getTotal: totalOf((m) => cashByMonth(m.monthIndex)?.undistributed ?? 0),
      format: "currency",
      profitColor: true,
    });
    profitSplitRows.push({
      id: "cascade-channel",
      label: t("financials.cascade.channel_result"),
      getValue: (m) => cashByMonth(m.monthIndex)?.channelResult ?? 0,
      getTotal: totalOf((m) => cashByMonth(m.monthIndex)?.channelResult ?? 0),
      format: "currency",
      bold: true,
      profitColor: true,
    });
  }

  // Perspective filter (S3b): in "general" show all parties; in a party
  // view keep only that party's subtree — channel/header rows (non
  // `cascade-party--`) are always integral. A member perspective reads as
  // "general" here (member ≠ profit-split party).
  const cascadePersp = cascadePerspective(perspective);
  const visibleProfitSplitRows =
    cascadePersp === "general"
      ? profitSplitRows
      : profitSplitRows.filter(
          (r) =>
            !r.id?.startsWith("cascade-party--") ||
            r.id === `cascade-party--${cascadePersp}` ||
            r.id.startsWith(`cascade-party--${cascadePersp}--`),
        );

  // Member perspective (Phase 2): focus the people-sections on the selected
  // seat + everyone beneath it; null ⇒ no filter (general / party view).
  const memberKeep = memberDownlineKeys(perspective, memberRoleKeys(salesTeam));

  const sections: {
    id: string;
    section: string;
    rows: AggRow[];
    defaultCollapsed?: boolean;
  }[] = [
    // Sales Team — one row per leadership level (top → base), then reps base.
    {
      id: "sales-team",
      section: t("financials.projection.section.sales_team"),
      rows: buildSalesTeamRows(salesTeam, aggMonths, t, memberKeep),
    },
    {
      id: "subscribers",
      section: t("financials.projection.section.subscribers"),
      rows: [
        // Headline gross signups for the calendar month — parent of the
        // per-tier breakdown so the user can collapse details.
        {
          id: "subscribers-gross",
          label: t("financials.projection.row.gross_new_sales"),
          getValue: (m) => m.grossNewSubs,
          getTotal: () => totals.grossNewSubs,
          format: "number",
          bold: true,
        },
        ...perTierGrossSubsRows,
        ...(totals.chargebacks > 0
          ? [
              {
                label: t("financials.projection.row.chargebacks"),
                getValue: (m: AggMonth) => m.chargebacks,
                getTotal: () => totals.chargebacks,
                format: "number" as const,
                lossColor: true,
              },
            ]
          : []),
        {
          label: t("financials.projection.row.net_new_subs"),
          getValue: (m) => m.netNewSubs,
          getTotal: () => totals.netNewSubs,
          format: "number",
          bold: true,
        },
        {
          label: t("financials.projection.row.lost_to_churn"),
          getValue: (m) => m.churned,
          getTotal: () => totals.churned,
          format: "number",
          lossColor: true,
        },
        {
          id: "active-subscribers",
          label: t("financials.projection.row.total_active"),
          getValue: (m) => m.survivingSubs,
          getTotal: () => totals.survivingSubsLast,
          format: "number",
          bold: true,
        },
        // Active by Plan & Cycle — nested UNDER Active Subscribers (>1 tier).
        // Sums across cohorts of (tier, cycle) sub counts at calendar K; helps
        // reconcile any biannual/annual revenue lump back to a count.
        ...(hasMultipleTiers
          ? tierIds.flatMap((tierId) => {
              const cycles: ("monthly" | "biannual" | "annual")[] = [
                "monthly",
                "biannual",
                "annual",
              ];
              const cycleLabels: Record<typeof cycles[number], string> = {
                monthly: "Monthly",
                biannual: "Biannual",
                annual: "Annual",
              };
              const tierBilling = tierBillingDistributions.get(tierId);
              const parentId = `active-by-plan-cycle--${tierId}`;
              const parent: AggRow = {
                id: parentId,
                parentId: "active-subscribers",
                level: 1,
                label: t("financials.projection.tier_indent", { tier: tierId }),
                getValue: (m) => {
                  const e = m.subscribersByTierAndCycle.find(
                    (x) => x.tierId === tierId,
                  );
                  return e ? e.monthly + e.biannual + e.annual : 0;
                },
                getTotal: () => {
                  const monthCount = aggMonths.length || 1;
                  const total = aggMonths.reduce((s, m) => {
                    const e = m.subscribersByTierAndCycle.find(
                      (x) => x.tierId === tierId,
                    );
                    return s + (e ? e.monthly + e.biannual + e.annual : 0);
                  }, 0);
                  return total / monthCount;
                },
                format: "decimal",
              };
              const children: AggRow[] = cycles.map((cycle) => ({
                id: `${parentId}--${cycle}`,
                parentId,
                level: 2,
                label: t("financials.projection.tier_subindent", {
                  tier: `${cycleLabels[cycle]} (${formatNumber(
                    (tierBilling?.[cycle] ?? 0) / 100,
                    locale,
                    "percent",
                  )})`,
                }),
                getValue: (m) =>
                  m.subscribersByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ??
                  0,
                getTotal: () => {
                  const monthCount = aggMonths.length || 1;
                  const total = aggMonths.reduce(
                    (s, m) =>
                      s +
                      (m.subscribersByTierAndCycle.find((e) => e.tierId === tierId)?.[cycle] ??
                        0),
                    0,
                  );
                  return total / monthCount;
                },
                format: "decimal",
              }));
              return [parent, ...children];
            })
          : []),
      ],
    },
    {
      id: "revenue",
      section: t("financials.projection.section.revenue"),
      rows: [
        {
          label: t("financials.projection.row.subscription_revenue"),
          getValue: (m) => m.revenue,
          getTotal: () => totals.revenue,
          format: "currency",
          bold: true,
        },
        // Cash-flow lump pattern — biannual/annual concentrate on the
        // months when cohorts renew (each cohort lumps Mo 1/7/13/19 of
        // its OWN life, so at calendar K several cohorts' lumps stack
        // and others read $0).
        {
          id: "monthly-billing",
          label: t("financials.projection.row.monthly_billing"),
          getValue: (m) => m.revenueByBillingCycle.monthly,
          getTotal: () => totals.revenueByBillingCycle.monthly,
          format: "currency",
        },
        ...buildCyclePerTierRows("monthly"),
        {
          id: "biannual-billing",
          label: t("financials.projection.row.biannual_billing"),
          getValue: (m) => m.revenueByBillingCycle.biannual,
          getTotal: () => totals.revenueByBillingCycle.biannual,
          format: "currency",
        },
        ...buildCyclePerTierRows("biannual"),
        {
          id: "annual-billing",
          label: t("financials.projection.row.annual_billing"),
          getValue: (m) => m.revenueByBillingCycle.annual,
          getTotal: () => totals.revenueByBillingCycle.annual,
          format: "currency",
        },
        ...buildCyclePerTierRows("annual"),
      ],
    },
    {
      id: "cogs",
      section: t("financials.projection.section.cogs"),
      rows: [
        {
          label: "Product Cost",
          getValue: (m) => m.productCogsCost,
          getTotal: () => totals.productCogsCost,
          format: "currency",
        },
        {
          label: "Shipping",
          getValue: (m) => m.shippingCost,
          getTotal: () => totals.shippingCost,
          format: "currency",
        },
        {
          label: "Handling",
          getValue: (m) => m.handlingCost,
          getTotal: () => totals.handlingCost,
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
          getValue: (m) => m.revenue - m.productCost,
          getTotal: () => totalsGrossProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.gross_margin_pct"),
          getValue: (m) =>
            m.revenue > 0 ? ((m.revenue - m.productCost) / m.revenue) * 100 : 0,
          getTotal: () => totalsGrossMarginPct,
          format: "percent",
        },
      ],
    },
    {
      id: "opex",
      section: t("financials.projection.section.opex"),
      rows: [
        // Order: Overhead → Welcome Kit → Buck → Add-Ons → Commissions.
        // Structural floor first, then variable platform/add-on costs,
        // then commissions (the most frequently inspected detail) last.
        // ── Overhead (parent) → per-category children ─────────────
        {
          id: "overhead",
          label: t("financials.projection.row.overhead"),
          getValue: (m) => m.operationalOverhead,
          getTotal: () => totals.operationalOverhead,
          format: "currency",
        },
        ...(() => {
          const ids = new Map<string, string>();
          for (const m of aggMonths)
            for (const c of m.operationalOverheadByCategory)
              if (!ids.has(c.id)) ids.set(c.id, c.name);
          return Array.from(ids.entries()).map<AggRow>(([id, name]) => ({
            id: `overhead--${id}`,
            parentId: "overhead",
            label: t("financials.projection.tier_indent", { tier: name }),
            getValue: (m) =>
              m.operationalOverheadByCategory.find((c) => c.id === id)?.monthly ?? 0,
            getTotal: () =>
              aggMonths.reduce(
                (s, m) =>
                  s +
                  (m.operationalOverheadByCategory.find((c) => c.id === id)?.monthly ?? 0),
                0,
              ),
            format: "currency",
          }));
        })(),
        // ── Welcome Kit ───────────────────────────────────────────
        {
          label: "Welcome Kit",
          getValue: (m) => m.welcomeKitCost,
          getTotal: () => totals.welcomeKitCost,
          format: "currency",
        },
        // ── Buck (parent) → Licenses + Tokens ─────────────────────
        {
          id: "buck",
          label: "Buck",
          getValue: (m) => m.buckCost,
          getTotal: () => totals.buckCost,
          format: "currency",
        },
        {
          id: "buck--license",
          parentId: "buck",
          label: t("financials.projection.tier_indent", {
            tier: t("financials.projection.row.buck_license"),
          }),
          getValue: (m) => m.buckLicenseCost,
          getTotal: () => totals.buckLicenseCost,
          format: "currency",
        },
        {
          id: "buck--tokens",
          parentId: "buck",
          label: t("financials.projection.tier_indent", {
            tier: t("financials.projection.row.buck_tokens"),
          }),
          getValue: (m) => m.buckTokenCost,
          getTotal: () => totals.buckTokenCost,
          format: "currency",
        },
        // ── Add-Ons (parent) → Path Scale (child) ─────────────────
        {
          id: "addons",
          label: "Add-Ons",
          getValue: (m) => m.addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        {
          id: "addons--path-scale",
          parentId: "addons",
          label: t("financials.projection.tier_indent", { tier: "Path Scale" }),
          getValue: (m) => m.addOnCost,
          getTotal: () => totals.addOnCost,
          format: "currency",
        },
        // ── Commissions (parent) → tier (parent) → upfront/residual
        {
          id: "commissions",
          label: t("financials.projection.row.commissions"),
          getValue: (m) => m.commissionUpfront + m.commissionResidual,
          getTotal: () => totalsCommissions,
          format: "currency",
        },
        ...(hasMultipleTiers
          ? tierIds.flatMap<AggRow>((tierId) => {
              const tierParentId = `commissions--${tierId}`;
              const tierParent: AggRow = {
                id: tierParentId,
                parentId: "commissions",
                label: t("financials.projection.tier_indent", { tier: tierId }),
                getValue: (m) => {
                  const e = m.commissionByTier.find((x) => x.tierId === tierId);
                  return e ? e.upfront + e.residual : 0;
                },
                getTotal: () =>
                  aggMonths.reduce((s, m) => {
                    const e = m.commissionByTier.find((x) => x.tierId === tierId);
                    return s + (e ? e.upfront + e.residual : 0);
                  }, 0),
                format: "currency",
              };
              const upfront: AggRow = {
                id: `${tierParentId}--upfront`,
                parentId: tierParentId,
                label: t("financials.projection.tier_subindent", { tier: "Upfront" }),
                getValue: (m) =>
                  m.commissionByTier.find((x) => x.tierId === tierId)?.upfront ?? 0,
                getTotal: () =>
                  aggMonths.reduce(
                    (s, m) =>
                      s + (m.commissionByTier.find((x) => x.tierId === tierId)?.upfront ?? 0),
                    0,
                  ),
                format: "currency",
              };
              const residual: AggRow = {
                id: `${tierParentId}--residual`,
                parentId: tierParentId,
                label: t("financials.projection.tier_subindent", { tier: "Residual" }),
                getValue: (m) =>
                  m.commissionByTier.find((x) => x.tierId === tierId)?.residual ?? 0,
                getTotal: () =>
                  aggMonths.reduce(
                    (s, m) =>
                      s +
                      (m.commissionByTier.find((x) => x.tierId === tierId)?.residual ?? 0),
                    0,
                  ),
                format: "currency",
              };
              return [tierParent, upfront, residual];
            })
          : []),
        {
          label: t("financials.projection.row.total_opex"),
          getValue: (m) =>
            m.commissionUpfront +
            m.commissionResidual +
            m.buckCost +
            m.addOnCost +
            m.welcomeKitCost +
            m.operationalOverhead,
          getTotal: () => totalsTotalOpEx,
          format: "currency",
          bold: true,
        },
      ],
    },
    {
      id: "bottom-line",
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
          getTotal: () => totals.cumulativeProfit,
          format: "currency",
          bold: true,
          profitColor: true,
        },
        {
          label: t("financials.projection.row.net_margin_pct"),
          getValue: (m) => (m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0),
          getTotal: () => totalsNetMarginPct,
          format: "percent",
        },
      ],
    },
    ...(visibleProfitSplitRows.length > 0
      ? [
          {
            id: "profit-split",
            section: t("financials.projection.section.profit_split"),
            rows: visibleProfitSplitRows,
          },
        ]
      : []),
  ];

  // Perspective-driven layout (mirrors projection-spreadsheet):
  //  • general → Member Earnings is the LAST section (after Profit Split).
  //  • party   → no Member Earnings.
  //  • role    → recruit-facing: keep Sales Team (role + downline) + Subscribers
  //    + Revenue + an "Earnings" section at the end; hide COGS / OpEx / Bottom
  //    Line / Profit Split (company-internal).
  const isRole = memberKeep != null;
  const isGeneral = perspective === "general" || !perspective;
  const memberEarningsSection = {
    id: "member-earnings",
    section: t(
      isRole
        ? "financials.projection.section.earnings"
        : "financials.projection.section.member_earnings",
    ),
    rows: buildMemberEarningsRows(memberEarnings, aggMonths, t, memberKeep),
  };
  const finalSections = isRole
    ? [
        ...sections.filter(
          (s) => !["cogs", "opex", "bottom-line", "profit-split"].includes(s.id),
        ),
        memberEarningsSection,
      ]
    : isGeneral
      ? [...sections, memberEarningsSection]
      : sections;

  function formatValue(
    v: number,
    fmt: "currency" | "number" | "percent" | "decimal",
  ): string {
    switch (fmt) {
      case "currency":
        return formatNumberAsMoney(v, locale);
      case "number":
        return formatNumber(Math.round(v), locale, "integer");
      case "decimal":
        return formatNumber(v, locale, "decimal");
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

  // Reconciliation series for the aggregate. Accrual = the engine's
  // per-month smoothed revenue (`cohortProjection[i].revenue`); cash =
  // the calendar-month aggregate of cohort lifecycle revenues (already
  // computed for the table). Window matches the visible months. By
  // construction these two series MATCH the Spreadsheet's reconciliation
  // exactly when the same projection window is used.
  const accrualSeriesAgg = cohortProjection
    .slice(0, months)
    .map((m) => m.revenue);
  const cashSeriesAgg = aggMonths.map((m) => m.revenue);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <AccountingBasisBadge basis="cash" />
      </div>
      {summaryRow}
      <AccountingBasisReconciliation
        accrualSeries={accrualSeriesAgg}
        cashSeries={cashSeriesAgg}
        locale={locale}
      />
      {/* The wrapper has to be a real scroll viewport (both axes, capped
          via maxH) so sticky thead anchors to its top edge. With just
          `overflow-x-auto` and no height limit, the wrapper grows to
          fit the table and the sticky header has nothing to stick to —
          it follows the page scroll up and out of view. */}
      <div className="overflow-auto border rounded-md max-h-[75vh]">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* See CohortLifecycleTable thead for the z-index rationale. */}
            <tr className="border-b bg-muted">
              <th className="sticky left-0 top-0 z-30 bg-muted min-w-[200px] px-3 py-2 text-left font-medium text-muted-foreground">
                {t("financials.cohort.column.metric")}
              </th>
              {aggMonths.map((m) => (
                <th
                  key={m.monthIndex}
                  className="sticky top-0 z-20 bg-muted min-w-[100px] px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                >
                  {t("financials.cohort.column.month_long", { month: m.monthIndex })}
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-muted min-w-[100px] px-2 py-2 text-right font-semibold text-foreground whitespace-nowrap border-l-2 border-border">
                {t("financials.cohort.column.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {finalSections.map((section) => (
              <AggSectionBlock
                key={section.id}
                section={section}
                aggMonths={aggMonths}
                formatValue={formatValue}
                valueCellClass={valueCellClass}
                isSectionCollapsed={collapsedSections.has(section.id)}
                collapsedRows={collapsedRows}
                onToggleSection={() => toggleSection(section.id)}
                onToggleRow={toggleRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Section block for the aggregate table — same chevron-driven collapse
 * UX as `CohortSectionBlock` but typed for the aggregate's calendar-
 * month entries. Kept as a small mirror (rather than generalizing the
 * cohort variant) to avoid churning the per-cohort component while
 * adding this view.
 */
function AggSectionBlock<M extends { monthIndex: number }>({
  section,
  aggMonths,
  formatValue,
  valueCellClass,
  isSectionCollapsed,
  collapsedRows,
  onToggleSection,
  onToggleRow,
}: {
  section: {
    id: string;
    section: string;
    rows: {
      id?: string;
      parentId?: string;
      level?: number;
      label: string;
      getValue: (m: M) => number;
      getTotal: () => number;
      format: "currency" | "number" | "percent" | "decimal";
      bold?: boolean;
      profitColor?: boolean;
      lossColor?: boolean;
    }[];
  };
  aggMonths: M[];
  formatValue: (v: number, f: "currency" | "number" | "percent" | "decimal") => string;
  valueCellClass: (v: number, profitColor?: boolean, lossColor?: boolean) => string;
  isSectionCollapsed: boolean;
  collapsedRows: Set<string>;
  onToggleSection: () => void;
  onToggleRow: (id: string) => void;
}) {
  // Parent set & ancestor lookup — same logic as CohortSectionBlock.
  const rowsWithChildren = new Set<string>();
  for (const r of section.rows) if (r.parentId) rowsWithChildren.add(r.parentId);
  const rowsById = new Map(section.rows.filter((r) => r.id).map((r) => [r.id!, r]));
  const isRowVisible = (row: { parentId?: string }): boolean => {
    let parentId = row.parentId;
    while (parentId) {
      if (collapsedRows.has(parentId)) return false;
      parentId = rowsById.get(parentId)?.parentId;
    }
    return true;
  };

  return (
    <>
      <tr
        className="bg-muted cursor-pointer select-none hover:bg-muted/80 transition-colors"
        onClick={onToggleSection}
      >
        <td
          colSpan={aggMonths.length + 2}
          className="sticky left-0 z-10 bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !isSectionCollapsed && "rotate-90",
              )}
            />
            {section.section}
          </span>
        </td>
      </tr>
      {!isSectionCollapsed &&
        section.rows.map((row) => {
          if (!isRowVisible(row)) return null;
          const totalValue = row.getTotal();
          const hasChildren = !!row.id && rowsWithChildren.has(row.id);
          const isCollapsed = !!row.id && collapsedRows.has(row.id);
          const handleRowClick =
            hasChildren && row.id ? () => onToggleRow(row.id!) : undefined;
          return (
            <tr
              key={row.id ?? row.label}
              className={cn(
                "border-b border-border/40 hover:bg-muted/10 transition-colors",
                hasChildren && "cursor-pointer select-none",
              )}
              onClick={handleRowClick}
            >
              <td
                className={cn(
                  "sticky left-0 z-10 bg-background min-w-[200px] px-3 py-1.5 text-muted-foreground whitespace-nowrap",
                  row.bold && "font-semibold text-foreground",
                )}
              >
                <span
                  className="inline-flex items-center gap-1"
                  style={
                    row.level ? { paddingLeft: `${row.level}rem` } : undefined
                  }
                >
                  {hasChildren ? (
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform",
                        !isCollapsed && "rotate-90",
                      )}
                    />
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  {row.label}
                </span>
              </td>
              {aggMonths.map((m) => {
                const value = row.getValue(m);
                return (
                  <td
                    key={m.monthIndex}
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

