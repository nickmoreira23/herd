"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { resolveOverhead } from "@/lib/financial-engine";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formatCurrency, formatPercent, getMarginColorClass } from "@/lib/utils";

interface PLStatementProps {
  multiplier: number;
  periodLabel: string;
}

export function PLStatement({ multiplier, periodLabel }: PLStatementProps) {
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No results yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the scenario inputs to see the P&L statement.
          </p>
        </CardContent>
      </Card>
    );
  }

  const m = multiplier;

  const samplerSpend = (inputs.samplerChannel?.monthlyMarketingSpend ?? 0) * m;
  const totalRevenue = results.mrr * m;
  const productCost = results.totalProductCost * m;
  const fulfillmentCost = results.totalFulfillmentCost * m;
  const totalCOGS = (results.totalProductCost + results.totalFulfillmentCost) * m;
  const grossProfit = results.grossMarginDollars * m;
  const commissionExpense = results.totalCommissionExpense * m;
  const overheadMonthly = resolveOverhead(inputs.operationalOverhead, 0);
  const overhead = overheadMonthly * m;
  const totalOpEx = (results.totalCommissionExpense + (inputs.samplerChannel?.monthlyMarketingSpend ?? 0) + overheadMonthly) * m;
  const kickbackRevenue = results.totalKickbackRevenue * m;
  const breakageProfit = results.totalBreakageProfit * m;
  const totalOtherIncome = (results.totalKickbackRevenue + results.totalBreakageProfit) * m;
  const netIncome = results.netMarginDollars * m;

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="pb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {periodLabel} P&L Statement
        </h3>
      </div>

      {/* Revenue Section */}
      <PLSection
        label="Revenue"
        total={totalRevenue}
        totalLabel="Total Revenue"
        variant="revenue"
      >
        {results.revenueByTier.map((t) => (
          <LineItem
            key={t.tierId}
            label={`${t.tierId} (${t.subscribers.toLocaleString()} subs)`}
            value={t.revenue * m}
          />
        ))}
      </PLSection>

      {/* COGS Section */}
      <PLSection
        label="Cost of Goods Sold"
        total={-totalCOGS}
        totalLabel="Total COGS"
        variant="expense"
      >
        <LineItem label="Product Costs" value={-productCost} />
        <LineItem label="Fulfillment & Shipping" value={-fulfillmentCost} />
      </PLSection>

      {/* Gross Profit Highlight */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">Gross Profit</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-muted ${getMarginColorClass(results.grossMarginPercent)}`}>
            {formatPercent(results.grossMarginPercent)}
          </span>
          <span className={`text-sm font-bold tabular-nums ${grossProfit >= 0 ? "" : "text-red-500"}`}>
            {formatCurrency(grossProfit)}
          </span>
        </div>
      </div>

      {/* Operating Expenses Section */}
      <PLSection
        label="Operating Expenses"
        total={-totalOpEx}
        totalLabel="Total OpEx"
        variant="expense"
      >
        <LineItem label="Sales Commissions" value={-commissionExpense} />
        <LineItem label="Sampler Channel Spend" value={-samplerSpend} />
        <LineItem
          label={inputs.operationalOverhead.mode === "milestone-scaled" ? "Operational Overhead (scaled)" : "Operational Overhead"}
          value={-overhead}
        />
      </PLSection>

      {/* Other Income Section */}
      <PLSection
        label="Other Income"
        total={totalOtherIncome}
        totalLabel="Total Other Income"
        variant="income"
      >
        <LineItem label="Partner Kickbacks" value={kickbackRevenue} />
        <LineItem label="Credit Breakage" value={breakageProfit} />
      </PLSection>

      {/* Net Income Highlight — same styling as Gross Profit */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">Net Income</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-muted ${getMarginColorClass(results.netMarginPercent)}`}>
            {formatPercent(results.netMarginPercent)}
          </span>
          <span className={`text-sm font-bold tabular-nums ${netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {formatCurrency(netIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function PLSection({
  label,
  total,
  totalLabel,
  variant,
  children,
}: {
  label: string;
  total: number;
  totalLabel: string;
  variant: "revenue" | "expense" | "income";
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
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${value < 0 ? "text-red-500" : ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
