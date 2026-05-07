"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AccountingBasisReconciliation
 * ─────────────────────────────
 * Sub-etapa 2 — explicit reconciliation between the two accounting bases
 * the projection runs on simultaneously:
 *
 *   • Accrual (Spreadsheet): revenue recognized monthly via
 *     `currentSubs × blendedRevenuePerSub`. P&L view, smoothed.
 *   • Cash flow (Cohort views): biannual/annual prepayments lump at
 *     billing months (Mo 1/7/13 etc.). Treasury view.
 *
 * Both are correct in their own basis. The card surfaces the gap
 * (deferred revenue = cash − accrual) so the user is never confused
 * that a difference between tabs is a bug.
 *
 * Pure presentation — receives both monthly series and a window. The
 * deferred-revenue figure is purely derived; no engine logic lives here.
 */
export interface AccountingBasisReconciliationProps {
  /** Monthly accrual revenue series (matches `cohortProjection[i].revenue`). */
  accrualSeries: number[];
  /** Monthly cash-flow revenue series (calendar-month aggregate of cohort
   *  lifecycle revenues, including biannual/annual lumps). */
  cashSeries: number[];
  /** Window the reconciliation covers. `start` and `end` are 1-indexed
   *  calendar months, inclusive. Defaults to the full series. */
  monthRange?: { start: number; end: number };
  locale: Locale;
  /** Optional CSS classes for the wrapper (e.g. spacing tweaks per host). */
  className?: string;
}

export function summarizeReconciliation(
  accrualSeries: number[],
  cashSeries: number[],
  range: { start: number; end: number },
): { accrualTotal: number; cashTotal: number; deferred: number } {
  const startIdx = Math.max(0, range.start - 1);
  const endIdx = Math.min(
    Math.max(accrualSeries.length, cashSeries.length),
    range.end,
  );
  let accrualTotal = 0;
  let cashTotal = 0;
  for (let i = startIdx; i < endIdx; i++) {
    accrualTotal += accrualSeries[i] ?? 0;
    cashTotal += cashSeries[i] ?? 0;
  }
  return {
    accrualTotal,
    cashTotal,
    deferred: cashTotal - accrualTotal,
  };
}

export function AccountingBasisReconciliation({
  accrualSeries,
  cashSeries,
  monthRange,
  locale,
  className,
}: AccountingBasisReconciliationProps) {
  const t = useT();
  const range = monthRange ?? {
    start: 1,
    end: Math.max(accrualSeries.length, cashSeries.length),
  };
  const { accrualTotal, cashTotal, deferred } = summarizeReconciliation(
    accrualSeries,
    cashSeries,
    range,
  );

  // Negative deferred is non-physical (cash should always lead accrual
  // since prepayments hit cash first). Log a console warning so it
  // surfaces during development; render the value anyway so the user
  // can see the anomaly rather than have it silently hidden.
  if (deferred < -0.5 && typeof console !== "undefined") {
    console.warn(
      `[AccountingBasisReconciliation] deferred = ${deferred.toFixed(2)} is negative; ` +
        `this should not happen — cash collected is below recognized revenue.`,
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2 bg-muted/30 rounded-md border text-xs",
        className,
      )}
    >
      <ReconCell
        label={t("financials.basis.reconciliation.accrual")}
        value={formatNumberAsMoney(accrualTotal, locale)}
      />
      <ReconCell
        label={t("financials.basis.reconciliation.cash")}
        value={formatNumberAsMoney(cashTotal, locale)}
      />
      <ReconCell
        label={t("financials.basis.reconciliation.deferred")}
        value={formatNumberAsMoney(deferred, locale)}
        tooltip={t("financials.basis.reconciliation.tooltip")}
        emphasize
      />
    </div>
  );
}

function ReconCell({
  label,
  value,
  tooltip,
  emphasize,
}: {
  label: string;
  value: string;
  tooltip?: string;
  emphasize?: boolean;
}) {
  const inner = (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <strong
        className={cn(
          "tabular-nums",
          emphasize ? "text-foreground" : "text-foreground",
        )}
      >
        {value}
      </strong>
      {tooltip ? (
        <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
      ) : null}
    </span>
  );
  if (!tooltip) return inner;
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center cursor-help">{inner}</TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-[11px]">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/**
 * AccountingBasisBadge
 * ────────────────────
 * Pill that labels each financial tab with its accounting basis. Same
 * tooltip text as in the reconciliation card; placed next to the table
 * header in each of the three financial views.
 */
export function AccountingBasisBadge({
  basis,
  className,
}: {
  basis: "accrual" | "cash";
  className?: string;
}) {
  const t = useT();
  const label =
    basis === "accrual"
      ? t("financials.basis.badge.accrual")
      : t("financials.basis.badge.cash");
  const tip =
    basis === "accrual"
      ? t("financials.basis.tooltip.accrual")
      : t("financials.basis.tooltip.cash");
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border cursor-help",
          basis === "accrual"
            ? "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400"
            : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
          className,
        )}
      >
        {label}
        <HelpCircle className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px] text-[11px]">{tip}</TooltipContent>
    </Tooltip>
  );
}
