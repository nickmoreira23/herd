"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { getMarginColorClass } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import { AccountingBasisBadge } from "./accounting-basis-reconciliation";

interface PLStatementProps {
  multiplier: number;
  periodLabel: string;
  locale: Locale;
}

export function PLStatement({ multiplier, periodLabel, locale }: PLStatementProps) {
  const t = useT();
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("financials.pl.empty_title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("financials.pl.empty_description")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const m = multiplier;

  // Thread D.2 — every "period total" derives from `cohortProjection`
  // summed over the first `m` months. The per-month series is the
  // source of truth; the `results.<scalar>` values are now averages
  // (consistent with `× m × period`) but for accurate partial-period
  // displays we sum the actual months rather than `avg × m`. See engine
  // doc block for the meta-rule.
  const projection = results.cohortProjection.slice(0, m);
  const sumOver = <K extends keyof (typeof results.cohortProjection)[number]>(
    key: K,
  ): number =>
    projection.reduce((s, mo) => s + (Number(mo[key]) || 0), 0);

  const totalRevenue = sumOver("revenue");
  const totalCOGS = sumOver("cogsExpense");
  // Fulfillment is recurring per-active-sub at scenario-level rate;
  // `cohortProjection.cogsExpense` already includes it (per-sub blended
  // unit cost). Derive the proportional split from the time-invariant
  // ratios on `results` (`totalFulfillmentCost / totalProductCost` is
  // constant — both averages scale with the same subs).
  const fulfillmentRatio =
    results.totalProductCost > 0
      ? results.totalFulfillmentCost / results.totalProductCost
      : 0;
  const fulfillmentCost = totalCOGS * fulfillmentRatio;
  const productOnlyCost = totalCOGS - fulfillmentCost;
  const grossProfit = totalRevenue - totalCOGS;
  const commissionExpense = sumOver("commissionExpense");
  // Overhead — sum of the first `m` months from `cohortProjection`.
  // Mirror of the A.2 / A.3.2 / D.2 pattern — see engine doc block.
  const overhead = sumOver("operationalOverhead");
  const welcomeKit = sumOver("welcomeKitCost");
  // Display flag — drives whether the Welcome Kit row renders at all.
  // True when ANY month in the visible window has welcome-kit cost > 0.
  const hasWelcomeKit = welcomeKit > 0;
  const totalOpEx = commissionExpense + welcomeKit + overhead;
  // Kickback stays on `× m` — Thread D.3a confirmed it's a flat input
  // (estimatedMonthlyReferrals × kickbackValue), not a function of
  // subscriber count. Breakage moved to `sumOver` post-D.3.2 — it now
  // tracks the per-month series the engine emits at
  // `cohortProjection[i].breakageProfit`.
  const kickbackRevenue = results.totalKickbackRevenue * m;
  const totalOtherIncome = results.totalKickbackRevenue * m;
  const breakageProfit = sumOver("breakageProfit");
  const netIncome = sumOver("netProfit");

  return (
    <div className="space-y-3">
      {/* Title + accounting-basis badge. P&L is a textbook accrual view —
          revenue = `mrr × multiplier`, expenses scaled equivalently. */}
      <div className="pb-1 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("financials.pl.title", { period: periodLabel })}
        </h3>
        <AccountingBasisBadge basis="accrual" />
      </div>

      {/* Revenue Section */}
      <PLSection
        label={t("financials.pl.revenue")}
        total={totalRevenue}
        totalLabel={t("financials.pl.total_revenue")}
        variant="revenue"
        locale={locale}
      >
        {results.revenueByTier.map((tier) => {
          // Per-tier revenue summed over the first `m` months from
          // `cohortProjection[i].revenueByTier` (added in Thread D.2 T1).
          const tierRevenuePeriod = projection.reduce((s, mo) => {
            const e = mo.revenueByTier?.find((rt) => rt.tierId === tier.tierId);
            return s + (e?.revenue ?? 0);
          }, 0);
          return (
            <LineItem
              key={tier.tierId}
              label={t("financials.pl.tier_subs", {
                tier: tier.tierId,
                count: formatNumber(tier.subscribers, locale, "integer"),
              })}
              value={tierRevenuePeriod}
              locale={locale}
            />
          );
        })}
      </PLSection>

      {/* COGS Section */}
      <PLSection
        label={t("financials.pl.cogs")}
        total={-totalCOGS}
        totalLabel={t("financials.pl.total_cogs")}
        variant="expense"
        locale={locale}
      >
        <LineItem label={t("financials.pl.product_costs")} value={-productOnlyCost} locale={locale} />
        <LineItem label={t("financials.pl.fulfillment_shipping")} value={-fulfillmentCost} locale={locale} />
      </PLSection>

      {/* Gross Profit Highlight */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">{t("financials.pl.gross_profit")}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-muted ${getMarginColorClass(results.grossMarginPercent)}`}>
            {formatNumber(results.grossMarginPercent / 100, locale, "percent")}
          </span>
          <span className={`text-sm font-bold tabular-nums ${grossProfit >= 0 ? "" : "text-red-500"}`}>
            {formatNumberAsMoney(grossProfit, locale)}
          </span>
        </div>
      </div>

      {/* Operating Expenses Section */}
      <PLSection
        label={t("financials.pl.opex")}
        total={-totalOpEx}
        totalLabel={t("financials.pl.total_opex")}
        variant="expense"
        locale={locale}
      >
        <LineItem label={t("financials.pl.sales_commissions")} value={-commissionExpense} locale={locale} />
        {hasWelcomeKit && (
          <LineItem label="Welcome Kit" value={-welcomeKit} locale={locale} />
        )}
        <LineItem
          label={
            inputs.operationalOverhead.mode === "milestone-scaled"
              ? t("financials.pl.overhead_scaled")
              : t("financials.pl.overhead")
          }
          value={-overhead}
          locale={locale}
        />
      </PLSection>

      {/* Other Income Section */}
      {totalOtherIncome > 0 && (
        <PLSection
          label={t("financials.pl.other_income")}
          total={totalOtherIncome}
          totalLabel={t("financials.pl.total_other_income")}
          variant="income"
          locale={locale}
        >
          <LineItem label={t("financials.pl.partner_kickbacks")} value={kickbackRevenue} locale={locale} />
        </PLSection>
      )}

      {/* Breakage note — informational, already reflected in reduced COGS */}
      {breakageProfit > 0 && (
        <div className="rounded-lg border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="text-muted-foreground/60">ℹ</span>
          <span>
            {t("financials.pl.breakage_note", {
              value: formatNumberAsMoney(breakageProfit, locale),
              // creditRedemptionRate is already a 0–1 ratio; breakage = 1 − redemption.
              percent: formatNumber(1 - inputs.creditRedemptionRate, locale, "percent"),
            })}
          </span>
        </div>
      )}

      {/* Net Income Highlight */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">{t("financials.pl.net_income")}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-muted ${getMarginColorClass(results.netMarginPercent)}`}>
            {formatNumber(results.netMarginPercent / 100, locale, "percent")}
          </span>
          <span className={`text-sm font-bold tabular-nums ${netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {formatNumberAsMoney(netIncome, locale)}
          </span>
        </div>
      </div>

      {/* Profit Split Section */}
      {results.profitSplit.parties.length > 0 && (
        <>
          <PLSection
            label={t("financials.pl.profit_distribution")}
            // Profit-split distribution per party = sum of (netProfit × pct)
            // across the first `m` months. `monthlyAmount × m` would use
            // the avg netMargin × m which equals sum only when the netProfit
            // series is constant. Sum-of-period preserves accuracy under
            // ramp/growth (Thread D.2).
            total={projection.reduce((rowSum, mo) => {
              const monthDist = mo.netProfit > 0
                ? results.profitSplit.parties.reduce(
                    (s, p) => s + mo.netProfit * (p.percent / 100),
                    0,
                  )
                : 0;
              return rowSum + monthDist;
            }, 0)}
            totalLabel={t("financials.pl.distributed", { percent: results.profitSplit.totalDistributedPercent })}
            variant="income"
            locale={locale}
          >
            {results.profitSplit.parties.map((party) => (
              <LineItem
                key={party.id}
                label={t("financials.pl.party_label", {
                  name: party.name || t("financials.pl.unnamed"),
                  percent: party.percent,
                })}
                // Per-party distribution: sum (netProfit × percent) over
                // first `m` months. See Thread D.2 doc.
                value={projection.reduce(
                  (s, mo) =>
                    s +
                    (mo.netProfit > 0
                      ? mo.netProfit * (party.percent / 100)
                      : 0),
                  0,
                )}
                locale={locale}
              />
            ))}
            {results.profitSplit.undistributedPercent > 0 && (
              <LineItem
                label={t("financials.pl.undistributed", { percent: results.profitSplit.undistributedPercent })}
                value={netIncome > 0 ? netIncome * (results.profitSplit.undistributedPercent / 100) : 0}
                locale={locale}
              />
            )}
            {results.profitSplit.status === "over" && (
              <div className="px-3 py-2 mt-1 rounded-md border border-rose-300 bg-rose-50 text-rose-700 text-xs">
                <strong>Over-allocated:</strong> profit-split shares total {results.profitSplit.totalDistributedPercent.toFixed(1)}% — exceeds 100% by {results.profitSplit.overAllocatedPercent.toFixed(1)}%. The configured shares cannot all be paid; reduce one or more party percentages.
              </div>
            )}
          </PLSection>
        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function PLSection({
  label,
  total,
  totalLabel,
  variant,
  locale,
  children,
}: {
  label: string;
  total: number;
  totalLabel: string;
  variant: "revenue" | "expense" | "income";
  locale: Locale;
  children: React.ReactNode;
}) {
  const accentClasses = {
    revenue: "border-l-blue-500",
    expense: "border-l-red-400",
    income: "border-l-emerald-500",
  };

  return (
    <div className={`rounded-lg border bg-card overflow-hidden border-l-[3px] ${accentClasses[variant]}`}>
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
      </div>
      <div className="px-4 space-y-1 pb-2">
        {children}
      </div>
      <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{totalLabel}</span>
        <span className={`text-sm font-bold tabular-nums ${total < 0 ? "text-red-500" : ""}`}>
          {formatNumberAsMoney(total, locale)}
        </span>
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
  locale,
}: {
  label: string;
  value: number;
  locale: Locale;
}) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${value < 0 ? "text-red-500" : ""}`}>
        {formatNumberAsMoney(value, locale)}
      </span>
    </div>
  );
}
