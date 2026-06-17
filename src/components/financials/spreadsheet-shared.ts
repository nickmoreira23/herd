// Shared spreadsheet UI infrastructure for `/admin/financials` tables.
//
// Extracted from `cohort-spreadsheet.tsx` (AggregateCohortTable) so that
// `projection-spreadsheet.tsx` can mirror the same row structure without
// duplicating the collapse-state hook or the cohortLifecycles aggregator.
//
// Behavioral contract: byte-identical output for the same inputs. Validated
// by re-running the audit reconciliation test after the extraction.

import { useState } from "react";
import type { useFinancialStore } from "@/stores/financial-store";
import type { CostRubric } from "@/lib/financial-engine";
import type { MessageKey } from "@/lib/i18n/t";

/**
 * Cost-rubric → label key, mirroring the attribution card in scenario-builder
 * so the cascade's "(−) Party costs" drill-down (both bases) reads with the
 * same names the user assigned attribution under.
 */
export const COST_RUBRIC_LABEL_KEYS = {
  cogs: "financials.builder.attribution.rubric_cogs",
  commission: "financials.builder.attribution.rubric_commission",
  chargeback: "financials.builder.attribution.rubric_chargeback",
  operationalOverhead: "financials.builder.attribution.rubric_overhead",
  buckPlatform: "financials.builder.attribution.rubric_buck",
  addOn: "financials.builder.attribution.rubric_addon",
  welcomeKit: "financials.builder.attribution.rubric_welcomeKit",
  leadershipCommission: "financials.builder.attribution.rubric_leadership_commission",
} as const satisfies Record<CostRubric, MessageKey>;

// ── Member perspective (S-member, Phase 2) ──────────────────────────
//
// "VIEW AS <member>" reframes the projection from one sales-team seat. The
// perspective value is `member:reps` or `member:<levelId>`; the channel
// sections stay as context while the people-sections (Sales Team headcount +
// Per-member earnings) focus on that seat and everyone beneath it (downline).

export const MEMBER_PREFIX = "member:";
export const REPS_ROLE_KEY = "reps";

/** Ordered role keys TOP → BASE: leadership levels (highest first) then reps. */
export function memberRoleKeys(
  salesTeam: NonNullable<ReturnType<typeof useFinancialStore.getState>["results"]>["salesTeam"],
): string[] {
  return [...salesTeam.levels.map((l) => l.id), REPS_ROLE_KEY];
}

/**
 * Role keys to KEEP for a member perspective = the selected role plus everyone
 * beneath it (top → base slice). `null` when the perspective is not a member
 * view (general or a profit-split party) — callers then apply no people filter.
 */
export function memberDownlineKeys(
  perspective: string | undefined,
  roleKeys: string[],
): Set<string> | null {
  if (!perspective || !perspective.startsWith(MEMBER_PREFIX)) return null;
  const selected = perspective.slice(MEMBER_PREFIX.length);
  const idx = roleKeys.indexOf(selected);
  // Unknown role (e.g. plan changed) ⇒ keep all rather than blank the section.
  return idx < 0 ? new Set(roleKeys) : new Set(roleKeys.slice(idx));
}

/** The cascade reads party perspectives only; a member perspective is treated
 *  as "general" there (member ≠ profit-split party). */
export function cascadePerspective(perspective: string | undefined): string {
  return perspective && perspective.startsWith(MEMBER_PREFIX) ? "general" : perspective ?? "general";
}

// ── Types ────────────────────────────────────────────────────────────

type Results = NonNullable<
  ReturnType<typeof useFinancialStore.getState>["results"]
>;
export type CohortLifecycle = Results["cohortLifecycles"][number];
export type CohortProjectionMonth = Results["cohortProjection"][number];

/**
 * Per-calendar-month aggregate of cohortLifecycles[].months[], plus the
 * scenario-level overhead pulled from cohortProjection[K-1].
 *
 * Each entry is the sum across every cohort that has an entry at calendar
 * month K. The `cumulativeProfit` field is the running total of netProfit.
 */
export type AggMonth = {
  monthIndex: number;
  // Aggregate-only: cohort-K's gross/net/chargebacks (only one cohort
  // starts each calendar month, so these are that cohort's values).
  grossNewSubs: number;
  netNewSubs: number;
  chargebacks: number;
  grossNewSubsByTier: { tierId: string; count: number }[];
  // Active subscribers at calendar K (sum of surviving subs across cohorts).
  survivingSubs: number;
  churned: number;
  // Cohort-attributed lines (sum across cohorts active at K).
  revenue: number;
  revenueByBillingCycle: { monthly: number; biannual: number; annual: number };
  revenueByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
  subscribersByTierAndCycle: { tierId: string; monthly: number; biannual: number; annual: number }[];
  productCogsCost: number;
  shippingCost: number;
  handlingCost: number;
  shippingHandlingCost: number;
  paymentProcessingCost: number;
  productCost: number;
  buckLicenseCost: number;
  buckTokenCost: number;
  buckCost: number;
  welcomeKitCost: number;
  chargebackCost: number;
  commissionUpfront: number;
  commissionResidual: number;
  commissionByTier: { tierId: string; upfront: number; residual: number }[];
  addOnCost: number;
  // Scenario-level only (NOT a cohort sum): pulled from cohortProjection.
  operationalOverhead: number;
  operationalOverheadByCategory: { id: string; name: string; monthly: number }[];
  netProfit: number;
  cumulativeProfit: number;
};

// ── Collapse-state hook ─────────────────────────────────────────────

/**
 * Two-Set collapse state (sections + rows) with toggle helpers.
 * Used by both AggregateCohortTable and ProjectionSpreadsheet so the
 * two tabs read identically.
 */
export function useSpreadsheetCollapse(
  initialSections: string[],
  initialRows: string[],
) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(initialSections),
  );
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(
    () => new Set(initialRows),
  );
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
  return { collapsedSections, collapsedRows, toggleSection, toggleRow };
}

// ── Lifecycle aggregator ─────────────────────────────────────────────

/**
 * Build per-calendar-month aggregates from cohortLifecycles[].
 *
 * For each calendar month K in [1..months], sum the matching month-of-life
 * entry from every cohort active at K. Overhead is NOT cohort-attributed —
 * it's pulled from `cohortProjection[K-1]` (engine-level emission).
 *
 * Pure function. Output is deterministic given the same inputs.
 */
export function aggregateLifecyclesByCalendarMonth(
  cohortLifecycles: CohortLifecycle[],
  cohortProjection: CohortProjectionMonth[],
  months: number,
  tierIds: string[],
): AggMonth[] {
  const aggMonths: AggMonth[] = [];
  let cumulativeProfit = 0;
  for (let K = 1; K <= months; K++) {
    const empty: AggMonth = {
      monthIndex: K,
      grossNewSubs: 0,
      netNewSubs: 0,
      chargebacks: 0,
      grossNewSubsByTier: tierIds.map((tierId) => ({ tierId, count: 0 })),
      survivingSubs: 0,
      churned: 0,
      revenue: 0,
      revenueByBillingCycle: { monthly: 0, biannual: 0, annual: 0 },
      revenueByTierAndCycle: tierIds.map((tierId) => ({
        tierId,
        monthly: 0,
        biannual: 0,
        annual: 0,
      })),
      subscribersByTierAndCycle: tierIds.map((tierId) => ({
        tierId,
        monthly: 0,
        biannual: 0,
        annual: 0,
      })),
      productCogsCost: 0,
      shippingCost: 0,
      handlingCost: 0,
      shippingHandlingCost: 0,
      paymentProcessingCost: 0,
      productCost: 0,
      buckLicenseCost: 0,
      buckTokenCost: 0,
      buckCost: 0,
      welcomeKitCost: 0,
      chargebackCost: 0,
      commissionUpfront: 0,
      commissionResidual: 0,
      commissionByTier: tierIds.map((tierId) => ({
        tierId,
        upfront: 0,
        residual: 0,
      })),
      addOnCost: 0,
      operationalOverhead: 0,
      operationalOverheadByCategory: [],
      netProfit: 0,
      cumulativeProfit: 0,
    };

    // Sum every cohort that has an entry at calendar month K.
    for (const cohort of cohortLifecycles) {
      const entry = cohort.months.find((m) => m.monthIndex === K);
      if (!entry) continue;

      empty.survivingSubs += entry.survivingSubs;
      empty.churned += entry.churned;
      empty.revenue += entry.revenue;
      empty.revenueByBillingCycle.monthly += entry.revenueByBillingCycle.monthly;
      empty.revenueByBillingCycle.biannual += entry.revenueByBillingCycle.biannual;
      empty.revenueByBillingCycle.annual += entry.revenueByBillingCycle.annual;
      for (const e of entry.revenueByTierAndCycle) {
        const slot = empty.revenueByTierAndCycle.find((s) => s.tierId === e.tierId);
        if (slot) {
          slot.monthly += e.monthly;
          slot.biannual += e.biannual;
          slot.annual += e.annual;
        }
      }
      for (const e of entry.subscribersByTierAndCycle) {
        const slot = empty.subscribersByTierAndCycle.find((s) => s.tierId === e.tierId);
        if (slot) {
          slot.monthly += e.monthly;
          slot.biannual += e.biannual;
          slot.annual += e.annual;
        }
      }
      empty.productCogsCost += entry.productCogsCost;
      empty.shippingCost += entry.shippingCost;
      empty.handlingCost += entry.handlingCost;
      empty.shippingHandlingCost += entry.shippingHandlingCost;
      empty.paymentProcessingCost += entry.paymentProcessingCost;
      empty.productCost += entry.productCost;
      empty.buckLicenseCost += entry.buckLicenseCost;
      empty.buckTokenCost += entry.buckTokenCost;
      empty.buckCost += entry.buckCost;
      empty.welcomeKitCost += entry.welcomeKitCost;
      empty.chargebackCost += entry.chargebackCost;
      empty.commissionUpfront += entry.commissionUpfront;
      empty.commissionResidual += entry.commissionResidual;
      for (const tc of entry.commissionByTier ?? []) {
        const slot = empty.commissionByTier.find((s) => s.tierId === tc.tierId);
        if (slot) {
          slot.upfront += tc.upfront;
          slot.residual += tc.residual;
        }
      }
      empty.addOnCost += entry.addOnCost;

      // Mo-of-life 1 only contributes acquisitions (the cohort that
      // STARTED at calendar K).
      if (entry.monthOfLife === 1) {
        empty.grossNewSubs += cohort.grossNewSubs;
        empty.netNewSubs += cohort.netNewSubs;
        empty.chargebacks += cohort.chargebacks;
        for (const e of cohort.grossNewSubsByTier) {
          const slot = empty.grossNewSubsByTier.find((s) => s.tierId === e.tierId);
          if (slot) slot.count += e.count;
        }
      }
    }

    // Scenario-level overhead — not attributed per cohort, but it's a
    // real OpEx line on the aggregate. Pull from the engine output
    // (already accounts for milestone scaling on subscriber count).
    const projEntry = cohortProjection[K - 1];
    empty.operationalOverhead = projEntry?.operationalOverhead ?? 0;
    empty.operationalOverheadByCategory =
      projEntry?.operationalOverheadByCategory ?? [];

    // Aggregate net profit — revenue minus every cost line we attributed
    // (matches the per-cohort definition plus overhead).
    empty.netProfit =
      empty.revenue -
      empty.productCost -
      empty.buckCost -
      empty.welcomeKitCost -
      empty.chargebackCost -
      empty.commissionUpfront -
      empty.commissionResidual -
      empty.addOnCost -
      empty.operationalOverhead;

    cumulativeProfit += empty.netProfit;
    empty.cumulativeProfit = cumulativeProfit;

    aggMonths.push(empty);
  }
  return aggMonths;
}
