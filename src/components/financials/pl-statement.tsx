"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { resolveOverhead } from "@/lib/financial-engine";
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

  const totalRevenue = results.mrr * m;
  // totalProductCost includes fulfillment+shipping, so break out the components
  const fulfillmentCost = results.totalFulfillmentCost * m;
  const productOnlyCost = (results.totalProductCost - results.totalFulfillmentCost) * m;
  const totalCOGS = results.totalProductCost * m; // already includes fulfillment
  const grossProfit = results.grossMarginDollars * m;
  const commissionExpense = results.totalCommissionExpense * m;
  const overheadMonthly = resolveOverhead(inputs.operationalOverhead, 0);
  const overhead = overheadMonthly * m;
  // Welcome Kit — one-time per-acquisition spend. Engine emits it per
  // month; we scale by the same multiplier as everything else for the
  // chosen reporting period.
  const welcomeKitMonthly = results.welcomeKitCostPerMonth ?? 0;
  const welcomeKit = welcomeKitMonthly * m;
  const totalOpEx =
    (results.totalCommissionExpense + welcomeKitMonthly + overheadMonthly) * m;
  const kickbackRevenue = results.totalKickbackRevenue * m;
  const totalOtherIncome = results.totalKickbackRevenue * m;
  const netIncome = results.netMarginDollars * m;

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
        {results.revenueByTier.map((tier) => (
          <LineItem
            key={tier.tierId}
            label={t("financials.pl.tier_subs", {
              tier: tier.tierId,
              count: formatNumber(tier.subscribers, locale, "integer"),
            })}
            value={tier.revenue * m}
            locale={locale}
          />
        ))}
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
        {welcomeKitMonthly > 0 && (
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
      {results.totalBreakageProfit > 0 && (
        <div className="rounded-lg border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="text-muted-foreground/60">ℹ</span>
          <span>
            {t("financials.pl.breakage_note", {
              value: formatNumberAsMoney(results.totalBreakageProfit * m, locale),
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
            total={results.profitSplit.parties.reduce((s, p) => s + p.monthlyAmount * m, 0)}
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
                value={party.monthlyAmount * m}
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
