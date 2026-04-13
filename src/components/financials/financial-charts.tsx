"use client";

import { useFinancialStore } from "@/stores/financial-store";
import { resolveOverhead } from "@/lib/financial-engine";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

const COLORS = ["#FF0000", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

interface FinancialChartsProps {
  multiplier: number;
  periodLabel: string;
}

export function FinancialCharts({ multiplier, periodLabel }: FinancialChartsProps) {
  const results = useFinancialStore((s) => s.results);
  const inputs = useFinancialStore((s) => s.inputs);

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No results to chart</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the scenario inputs to generate charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  const m = multiplier;
  const label = periodLabel;

  // Revenue by tier data (scaled by period)
  const revenueByTierData = results.revenueByTier.map((t) => ({
    name: t.tierId,
    revenue: Math.round(t.revenue * m),
    subscribers: t.subscribers,
  }));

  // Margin waterfall data (scaled by period)
  // totalProductCost includes fulfillment+shipping, so split them for the waterfall
  const productOnlyCost = results.totalProductCost - results.totalFulfillmentCost;
  const waterfallData = [
    { name: "Revenue", value: Math.round(results.mrr * m) },
    { name: "Product", value: -Math.round(productOnlyCost * m) },
    { name: "Fulfillment", value: -Math.round(results.totalFulfillmentCost * m) },
    { name: "Commission", value: -Math.round(results.totalCommissionExpense * m) },
    ...(results.totalKickbackRevenue > 0 ? [{ name: "Kickbacks", value: Math.round(results.totalKickbackRevenue * m) }] : []),
    { name: "Overhead", value: -Math.round(resolveOverhead(inputs.operationalOverhead, 0) * m) },
    { name: "Net", value: Math.round(results.netMarginDollars * m) },
  ];

  // Cohort projection data — show months up to the period length (or all 24)
  const monthsToShow = Math.min(24, m <= 1 ? 12 : 24);
  const cohortData = results.cohortProjection.slice(0, monthsToShow).map((mo) => ({
    month: `M${mo.month}`,
    subscribers: mo.subscribers,
    revenue: Math.round(mo.revenue),
    costs: Math.round(mo.costs),
    overhead: Math.round(mo.operationalOverhead),
    profit: Math.round(mo.netProfit),
    cumulative: Math.round(mo.cumulativeProfit),
  }));

  // Breakeven data — 24-month cumulative profit
  const breakevenData = results.cohortProjection.map((mo) => ({
    month: `M${mo.month}`,
    cumulative: Math.round(mo.cumulativeProfit),
  }));

  // Margin breakdown donut (scaled by period)
  // totalProductCost already includes fulfillment — don't double-count
  const marginPieData = [
    { name: "Net Margin", value: Math.max(0, Math.round(results.netMarginDollars * m)) },
    { name: "COGS", value: Math.round(results.totalProductCost * m) },
    { name: "Commissions", value: Math.round(results.totalCommissionExpense * m) },
    {
      name: "Overhead",
      value: Math.round(resolveOverhead(inputs.operationalOverhead, 0) * m),
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Revenue by Tier */}
      <ChartCard title={`${label} Revenue by Tier`} description={`${label} revenue contribution from each subscription tier`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByTierData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="revenue" fill="#FF0000" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* P&L Waterfall */}
      <ChartCard title={`${label} P&L Waterfall`} description="How revenue flows through costs to net margin">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {waterfallData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? "#FF0000" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Multi-Month Projection */}
      <ChartCard title={`${monthsToShow}-Month Projection`} description={`Revenue, costs, profit, and cumulative profit over ${monthsToShow} months`}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cohortData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="revenue" stroke="#FF0000" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} dot={false} />
            {inputs.operationalOverhead.mode === "milestone-scaled" && (
              <Line type="stepAfter" dataKey="overhead" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="OPEX (scaled)" />
            )}
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Margin Breakdown */}
      <ChartCard title={`${label} Cost Breakdown`} description="Where your revenue goes — margin, COGS, commissions, and overhead">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={marginPieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--card))"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {marginPieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Operation Breakeven */}
      <ChartCard
        title="Operation Breakeven"
        description={`Cumulative profit over 24 months — breakeven ${results.operationBreakevenMonth === Infinity ? "not reached" : `at month ${results.operationBreakevenMonth}`}`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={breakevenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.3} strokeDasharray="3 3" />
            <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
              {breakevenData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.cumulative >= 0 ? "#22C55E" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="mb-3">
          <h4 className="text-xs font-semibold">{title}</h4>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
