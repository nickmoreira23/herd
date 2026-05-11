"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { formatNumberAsMoney } from "@/lib/money/format";
import type { Locale } from "@/lib/i18n/locales";

interface EarningEvent {
  date: string;
  type: "Sale" | "Residual" | "Bonus" | "Clawback";
  customer: string;
  plan: string;
  amount: number;
  status: "earned" | "pending" | "released" | "clawed-back";
}

interface Totals {
  last30: number;
  pending: number;
  released: number;
  clawback: number;
  eventCount: number;
}

interface Props {
  daily: { date: string; amount: number }[];
  events: EarningEvent[];
  totals: Totals;
  locale: Locale;
}

export function EarningsClient({ daily, events, totals, locale }: Props) {
  const chartData = useMemo(
    () =>
      daily.map((d) => {
        const dt = new Date(d.date + "T00:00:00");
        return {
          date: d.date,
          label: dt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          amount: d.amount,
        };
      }),
    [daily],
  );

  const bestDay = useMemo(
    () => daily.reduce((m, d) => (d.amount > m.amount ? d : m), { date: "", amount: 0 }),
    [daily],
  );
  const avgPerDay =
    daily.length > 0 ? totals.last30 / daily.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Track your commissions, residuals, and bonuses across the last 30 days."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Last 30 days"
          value={formatNumberAsMoney(totals.last30, locale)}
          sub={`${totals.eventCount} events`}
          icon={TrendingUp}
        />
        <StatCard
          label="Pending"
          value={formatNumberAsMoney(totals.pending, locale)}
          sub="Awaiting clearance"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Released"
          value={formatNumberAsMoney(totals.released, locale)}
          sub="Paid to your account"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Clawback"
          value={formatNumberAsMoney(Math.abs(totals.clawback), locale)}
          sub="Reversals"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      {/* Chart */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold">Daily earnings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Last 30 days · avg {formatNumberAsMoney(avgPerDay, locale)}/day
            </p>
          </div>
          {bestDay.amount > 0 && (
            <Badge variant="secondary" className="shrink-0">
              Best day: {formatNumberAsMoney(bestDay.amount, locale)} · {bestDay.date}
            </Badge>
          )}
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
                formatter={(v) => [
                  formatNumberAsMoney(typeof v === "number" ? v : 0, locale),
                  "Earnings",
                ]}
                labelFormatter={(l) => String(l ?? "")}
              />
              <Bar
                dataKey="amount"
                fill="#e22627"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent events */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Commission events</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {events.length} events in the last 30 days
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 25).map((e, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="px-6 py-3 tabular-nums text-muted-foreground">
                    {e.date}
                  </td>
                  <td className="px-6 py-3">
                    <TypeBadge type={e.type} />
                  </td>
                  <td className="px-6 py-3 font-medium">{e.customer}</td>
                  <td className="px-6 py-3 text-muted-foreground">{e.plan}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td
                    className={cn(
                      "px-6 py-3 tabular-nums text-right font-semibold",
                      e.amount < 0 && "text-rose-600",
                    )}
                  >
                    {e.amount < 0 ? "-" : ""}
                    {formatNumberAsMoney(Math.abs(e.amount), locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────

const TONE_CLASSES: Record<string, { bg: string; ring: string; text: string }> = {
  default: { bg: "bg-foreground/5", ring: "ring-border", text: "text-foreground" },
  amber: {
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    text: "text-amber-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    text: "text-emerald-700",
  },
  rose: { bg: "bg-rose-50", ring: "ring-rose-200", text: "text-rose-700" },
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof TrendingUp;
  tone?: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone] ?? TONE_CLASSES.default;
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-3">
      <span
        className={cn(
          "h-10 w-10 shrink-0 rounded-lg ring-1 flex items-center justify-center",
          t.bg,
          t.ring,
        )}
      >
        <Icon className={cn("h-5 w-5", t.text)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight tabular-nums mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: EarningEvent["type"] }) {
  const styles: Record<EarningEvent["type"], string> = {
    Sale: "bg-emerald-100 text-emerald-700",
    Residual: "bg-blue-100 text-blue-700",
    Bonus: "bg-amber-100 text-amber-700",
    Clawback: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: EarningEvent["status"] }) {
  const labels: Record<EarningEvent["status"], string> = {
    earned: "Earned",
    pending: "Pending",
    released: "Released",
    "clawed-back": "Clawed back",
  };
  const styles: Record<EarningEvent["status"], string> = {
    earned: "bg-foreground/5 text-foreground",
    pending: "bg-amber-50 text-amber-700",
    released: "bg-emerald-50 text-emerald-700",
    "clawed-back": "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
