"use client";

import { useState, useMemo } from "react";
import type { CommissionStructure, CommissionTierRate, SubscriptionTier } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  PieChart,
  CreditCard,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatPercent, toNumber } from "@/lib/utils";
import {
  calculateBlendedRevenue,
  calculateCommissionPerNewSub,
} from "@/lib/financial-engine";

type StructureWithRates = CommissionStructure & {
  tierRates: (CommissionTierRate & { subscriptionTier: SubscriptionTier })[];
};

interface SimulatorProps {
  structure: StructureWithRates | null;
  tiers: SubscriptionTier[];
}

export function CommissionSimulator({ structure, tiers }: SimulatorProps) {
  const [reps, setReps] = useState(20);
  const [salesPerRep, setSalesPerRep] = useState(15);
  const [tierDistribution, setTierDistribution] = useState<Record<string, number>>(() => {
    const dist: Record<string, number> = {};
    tiers.forEach((t, i) => {
      dist[t.id] = i === 0 ? 30 : i === 1 ? 40 : i === 2 ? 20 : 10;
    });
    return dist;
  });
  const [acceleratorPercent, setAcceleratorPercent] = useState(20);
  const [totalSubscribers, setTotalSubscribers] = useState(5000);
  const [billingDistribution, setBillingDistribution] = useState({
    monthly: 60,
    quarterly: 25,
    annual: 15,
  });

  const results = useMemo(() => {
    if (!structure) return null;

    const totalNewSubs = reps * salesPerRep;
    const residualPercent = toNumber(structure.residualPercent);

    const tierResults = tiers.map((tier) => {
      const dist = (tierDistribution[tier.id] || 0) / 100;
      const newSubs = Math.round(totalNewSubs * dist);
      const rate = structure.tierRates.find((r) => r.subscriptionTierId === tier.id);
      const flatBonus = rate ? toNumber(rate.flatBonusAmount) : 0;
      const accMultiplier = rate?.acceleratorMultiplier ? toNumber(rate.acceleratorMultiplier) : 1;

      const effectiveBonus = calculateCommissionPerNewSub(
        flatBonus,
        acceleratorPercent,
        accMultiplier
      );
      const upfrontCost = newSubs * effectiveBonus;

      const quarterlyPerMonth = Math.round((toNumber(tier.quarterlyPrice) / 3) * 100) / 100;
      const annualPerMonth = Math.round((toNumber(tier.annualPrice) / 12) * 100) / 100;

      const blendedRevenue = calculateBlendedRevenue(
        toNumber(tier.monthlyPrice),
        quarterlyPerMonth,
        annualPerMonth,
        billingDistribution
      );

      const estimatedTotalSubs = totalSubscribers * dist;
      const residualCost = estimatedTotalSubs * blendedRevenue * (residualPercent / 100);

      return {
        tierName: tier.name,
        newSubs,
        flatBonus,
        effectiveBonus,
        upfrontCost,
        residualCost,
        blendedRevenue,
        estimatedTotalSubs,
      };
    });

    const totalUpfront = tierResults.reduce((s, r) => s + r.upfrontCost, 0);
    const totalResidual = tierResults.reduce((s, r) => s + r.residualCost, 0);
    const totalCommission = totalUpfront + totalResidual;
    const totalRevenue = tierResults.reduce(
      (s, r) => s + r.newSubs * r.blendedRevenue + r.estimatedTotalSubs * r.blendedRevenue,
      0
    );
    const commissionPctOfRevenue = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
    const costPerNewSub = totalNewSubs > 0 ? totalUpfront / totalNewSubs : 0;

    return {
      tierResults,
      totalNewSubs,
      totalUpfront,
      totalResidual,
      totalCommission,
      totalRevenue,
      commissionPctOfRevenue,
      annualCommission: totalCommission * 12,
      costPerNewSub,
      residualPercent,
    };
  }, [structure, tiers, reps, salesPerRep, tierDistribution, acceleratorPercent, totalSubscribers, billingDistribution]);

  if (!structure) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No active commission structure</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Switch to the Structures tab and activate one first. The simulator
            uses the active structure&apos;s rates to calculate results.
          </p>
        </CardContent>
      </Card>
    );
  }

  const distTotal = Object.values(tierDistribution).reduce((s, v) => s + v, 0);
  const billingTotal = billingDistribution.monthly + billingDistribution.quarterly + billingDistribution.annual;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Compact header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Model different scenarios to see how changes affect your total commission costs.
          </p>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {structure.name}
          </Badge>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* ───── LEFT: Inputs (5 cols) ───── */}
          <div className="col-span-5 space-y-3">
            {/* Sales Team */}
            <InputCard
              icon={<Users className="h-3.5 w-3.5" />}
              title="Sales Team"
              tooltip="How many door-to-door reps you have and their average monthly sales output."
            >
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Reps"
                  value={reps}
                  step={1}
                  onChange={setReps}
                />
                <NumberField
                  label="Sales/Rep/Mo"
                  value={salesPerRep}
                  step={1}
                  onChange={setSalesPerRep}
                />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {reps * salesPerRep} new subscribers/month
              </div>
            </InputCard>

            {/* Subscriber Base */}
            <InputCard
              icon={<CreditCard className="h-3.5 w-3.5" />}
              title="Existing Subscribers"
              tooltip="Your current active subscriber count. This drives the residual commission calculation — the ongoing monthly % you pay reps on retained subscribers."
            >
              <NumberField
                label="Total Active"
                value={totalSubscribers}
                step={500}
                onChange={setTotalSubscribers}
              />
            </InputCard>

            {/* Accelerator */}
            <InputCard
              icon={<Zap className="h-3.5 w-3.5" />}
              title="Accelerator"
              tooltip="Top reps who exceed their sales quota earn a bonus multiplier on their signup commission. Set what % of your team you expect to hit this level."
            >
              <NumberField
                label="% Reps Exceeding Quota"
                value={acceleratorPercent}
                step={5}
                max={100}
                onChange={setAcceleratorPercent}
              />
            </InputCard>

            {/* Billing Mix */}
            <InputCard
              icon={<PieChart className="h-3.5 w-3.5" />}
              title="Billing Mix"
              tooltip="How subscribers pay. Quarterly/annual plans are discounted, so this mix affects average revenue per subscriber and residual calculations."
              error={billingTotal !== 100 ? `Must total 100% (now ${billingTotal}%)` : undefined}
            >
              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="Monthly %"
                  value={billingDistribution.monthly}
                  step={5}
                  max={100}
                  onChange={(v) => setBillingDistribution((prev) => ({ ...prev, monthly: v }))}
                />
                <NumberField
                  label="Quarterly %"
                  value={billingDistribution.quarterly}
                  step={5}
                  max={100}
                  onChange={(v) => setBillingDistribution((prev) => ({ ...prev, quarterly: v }))}
                />
                <NumberField
                  label="Annual %"
                  value={billingDistribution.annual}
                  step={5}
                  max={100}
                  onChange={(v) => setBillingDistribution((prev) => ({ ...prev, annual: v }))}
                />
              </div>
            </InputCard>

            {/* Tier Distribution */}
            <InputCard
              icon={<PieChart className="h-3.5 w-3.5" />}
              title="Tier Sales Mix"
              tooltip="What % of new signups go to each tier? Higher tiers have bigger bonuses. This mix affects your average cost per signup."
              error={distTotal !== 100 ? `Must total 100% (now ${distTotal}%)` : undefined}
            >
              <div className="space-y-1.5">
                {tiers.map((tier) => {
                  const rate = structure.tierRates.find((r) => r.subscriptionTierId === tier.id);
                  const bonus = rate ? toNumber(rate.flatBonusAmount) : 0;
                  return (
                    <div key={tier.id} className="flex items-center gap-2">
                      <div className="w-[88px] shrink-0">
                        <p className="text-xs font-medium leading-tight">{tier.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(bonus)} bonus</p>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step={5}
                          min={0}
                          max={100}
                          value={tierDistribution[tier.id] || 0}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) setTierDistribution((prev) => ({ ...prev, [tier.id]: Math.round(v * 100) / 100 }));
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-3">%</span>
                    </div>
                  );
                })}
              </div>
            </InputCard>
          </div>

          {/* ───── RIGHT: Results (7 cols) ───── */}
          <div className="col-span-7 space-y-3">
            {results && (
              <>
                {/* Primary metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="New Subs/Month"
                    value={String(results.totalNewSubs)}
                    sublabel="Total new signups across all reps"
                    accent="blue"
                  />
                  <MetricCard
                    label="Signup Bonuses"
                    value={formatCurrency(results.totalUpfront)}
                    sublabel="One-time bonuses paid this month"
                    accent="amber"
                  />
                  <MetricCard
                    label="Monthly Residuals"
                    value={formatCurrency(results.totalResidual)}
                    sublabel="Ongoing payments on retained subs"
                    accent="purple"
                  />
                  <MetricCard
                    label="Total Commission"
                    value={formatCurrency(results.totalCommission)}
                    sublabel="Bonuses + residuals combined"
                    accent="green"
                    highlight
                  />
                </div>

                {/* Secondary metrics */}
                <div className="grid grid-cols-4 gap-2">
                  <MiniMetric
                    label="% of Revenue"
                    value={formatPercent(results.commissionPctOfRevenue)}
                    warn={results.commissionPctOfRevenue > 15}
                  />
                  <MiniMetric
                    label="Annual Cost"
                    value={formatCurrency(results.annualCommission)}
                  />
                  <MiniMetric
                    label="Cost/New Sub"
                    value={formatCurrency(results.costPerNewSub)}
                  />
                  <MiniMetric
                    label="Residual Rate"
                    value={formatPercent(results.residualPercent)}
                  />
                </div>

                {/* Tier breakdown */}
                <Card size="sm">
                  <CardContent>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      Per-Tier Breakdown
                    </p>
                    <div className="space-y-0">
                      {results.tierResults.map((tr, idx) => {
                        const total = tr.upfrontCost + tr.residualCost;
                        const maxTotal = Math.max(...results.tierResults.map(t => t.upfrontCost + t.residualCost));
                        const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                        return (
                          <div
                            key={tr.tierName}
                            className={`py-2.5 ${idx < results.tierResults.length - 1 ? "border-b" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">{tr.tierName}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {tr.newSubs} new + {Math.round(tr.estimatedTotalSubs)} existing
                                </span>
                              </div>
                              <span className="text-xs font-bold tabular-nums">
                                {formatCurrency(total)}
                                <span className="font-normal text-muted-foreground">/mo</span>
                              </span>
                            </div>
                            {/* Bar */}
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                              <span>{formatCurrency(tr.effectiveBonus)}/sub bonus</span>
                              <span>{formatCurrency(tr.upfrontCost)} upfront</span>
                              <span>{formatCurrency(tr.residualCost)} residual</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Warning */}
                {results.commissionPctOfRevenue > 20 && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 dark:bg-red-950/20 dark:border-red-900 p-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-400">
                        Commission exceeds 20% of revenue
                      </p>
                      <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                        Consider reducing bonuses, lowering the residual %, or tightening
                        accelerator thresholds.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ─── Sub-components ─── */

function InputCard({
  icon,
  title,
  tooltip,
  error,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
          </div>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        {children}
        {error && (
          <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  min = 0,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      {label && (
        <Label className="text-[11px] text-muted-foreground mb-0.5 block">{label}</Label>
      )}
      <div className="relative">
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.round(v * 100) / 100);
          }}
          className={`h-8 text-sm ${suffix ? "pr-7" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  accent = "blue",
  highlight,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent?: "blue" | "amber" | "purple" | "green";
  highlight?: boolean;
}) {
  const accentColors = {
    blue: "from-blue-500/10 to-transparent border-blue-500/20",
    amber: "from-amber-500/10 to-transparent border-amber-500/20",
    purple: "from-violet-500/10 to-transparent border-violet-500/20",
    green: "from-green-500/10 to-transparent border-green-500/20",
  };
  const textColors = {
    blue: "text-blue-700 dark:text-blue-400",
    amber: "text-amber-700 dark:text-amber-400",
    purple: "text-violet-700 dark:text-violet-400",
    green: "text-green-700 dark:text-green-400",
  };

  return (
    <div
      className={`rounded-xl border p-3.5 bg-gradient-to-br ${accentColors[accent]} ${
        highlight ? "ring-1 ring-green-500/30" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={`text-xl font-bold mt-0.5 tabular-nums ${textColors[accent]}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{sublabel}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className={`text-sm font-bold tabular-nums mt-0.5 ${warn ? "text-red-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}
