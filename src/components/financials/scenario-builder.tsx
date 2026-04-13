"use client";

import { createContext, useContext, useState, useMemo } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import { calculateCreditCOGS, calculateTotalCOGSPerSub } from "@/lib/financial-engine";

const ReadOnlyContext = createContext(false);
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { DataSourceMeta, TierDisplayMeta } from "@/app/admin/financials/data";
import {
  Users,
  CreditCard,
  Package,
  DollarSign,
  Building2,
  Layers,
  HelpCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Link2,
  Lock,
  RotateCcw,
  PieChart,
  Plus,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ScenarioBuilder({ readOnly = false, defaultOpen = true, dataSourceMeta, tierDisplayMeta }: { readOnly?: boolean; defaultOpen?: boolean; dataSourceMeta?: DataSourceMeta; tierDisplayMeta?: TierDisplayMeta[] }) {
  const { inputs, setInputs } = useFinancialStore();

  const billingTotal =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.quarterly +
    inputs.billingCycleDistribution.annual;

  return (
    <ReadOnlyContext.Provider value={readOnly}>
    <TooltipProvider>
      <div className="space-y-3">
        {/* Overhead */}
        <InputCard
          icon={<Building2 className="h-3.5 w-3.5" />}
          title="Overhead"
          description={inputs.operationalOverhead.mode === "milestone-scaled" ? "Auto-scaled from Operations page" : "Fixed monthly operating costs"}
          tooltip="Operational costs like rent, salaries, software, and admin. Can be a fixed monthly amount or automatically scaled from your Operations page based on subscriber milestones."
          defaultOpen={defaultOpen}
          linkedBadge={dataSourceMeta?.linked.opexMilestones && inputs.operationalOverhead.mode === "milestone-scaled" ? <LinkedBadge label="Expenses" /> : undefined}
        >
          <div className="space-y-2">
            {/* Mode toggle */}
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputs({
                    operationalOverhead: { ...inputs.operationalOverhead, mode: "fixed" },
                  })}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    inputs.operationalOverhead.mode === "fixed"
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                  )}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setInputs({
                    operationalOverhead: { ...inputs.operationalOverhead, mode: "milestone-scaled" },
                  })}
                  disabled={!inputs.operationalOverhead.opexData?.length}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    inputs.operationalOverhead.mode === "milestone-scaled"
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50",
                    !inputs.operationalOverhead.opexData?.length && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Auto-scaled
                </button>
              </div>
            )}

            {inputs.operationalOverhead.mode === "fixed" ? (
              <NumberField
                label="Monthly Overhead ($)"
                tooltip="Your total fixed monthly costs that don't scale with subscribers — office rent, salaries, software subscriptions, insurance, admin, etc."
                value={inputs.operationalOverhead.fixedMonthly}
                step={1000}
                onChange={(v) => setInputs({
                  operationalOverhead: { ...inputs.operationalOverhead, fixedMonthly: v },
                })}
              />
            ) : (
              <div className="space-y-1.5">
                {inputs.operationalOverhead.opexData && inputs.operationalOverhead.opexData.length > 0 ? (
                  <>
                    <div className="rounded-lg bg-muted/30 px-2.5 py-2 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Operations Page Categories
                      </p>
                      {inputs.operationalOverhead.opexData.map((cat) => {
                        const catTotal = cat.items.reduce((sum, item) => {
                          const lowest = item.milestones.length > 0
                            ? item.milestones.reduce((min, ms) => ms.memberCount < min.memberCount ? ms : min, item.milestones[0])
                            : null;
                          return sum + (lowest ? lowest.monthlyCost : 0);
                        }, 0);
                        return (
                          <div key={cat.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{cat.name}</span>
                            <span className="font-medium tabular-nums">${catTotal.toLocaleString()}/mo</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span>
                        Costs scale automatically as subscribers cross milestone thresholds defined on the{" "}
                        <a href="/admin/operation" className="text-foreground underline underline-offset-2 hover:no-underline">
                          Operations page
                        </a>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
                    No OPEX data found. Set up cost milestones on the{" "}
                    <a href="/admin/operation" className="text-foreground underline underline-offset-2 hover:no-underline">
                      Operations page
                    </a>{" "}
                    first.
                  </div>
                )}
              </div>
            )}
          </div>
        </InputCard>

        {/* Sales Representatives */}
        <InputCard
          icon={<UserPlus className="h-3.5 w-3.5" />}
          title="Sales Representatives"
          description="Reps, productivity & monthly growth"
          tooltip="Your door-to-door sales force. Define starting headcount, productivity, and how fast the team grows each month. Reps compound — 10 reps growing at 10%/mo becomes 26 reps by month 12."
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Starting Reps"
                tooltip="How many sales reps you start with in month 1. This is your baseline — the team grows from here based on your monthly growth rate."
                value={inputs.salesRepChannel.startingReps}
                step={1}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, startingReps: v },
                  })
                }
              />
              <NumberField
                label="Sales/Rep/Mo"
                tooltip="How many new subscriptions each rep closes per month on average. Multiply by active reps to get total monthly acquisition from this channel."
                value={inputs.salesRepChannel.salesPerRepPerMonth}
                step={1}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, salesPerRepPerMonth: v },
                  })
                }
              />
              <NumberField
                label="Growth %/Mo"
                tooltip="How fast your sales team grows each month. At 10%, you go from 10 reps to 11 next month, 12 the month after, and so on — compounding over time."
                value={inputs.salesRepChannel.monthlyGrowthRate}
                step={1}
                max={100}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, monthlyGrowthRate: v },
                  })
                }
              />
            </div>
            <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0" />
              <span>
                Mo 1: {inputs.salesRepChannel.startingReps} reps × {inputs.salesRepChannel.salesPerRepPerMonth} sales = <strong className="text-foreground">{inputs.salesRepChannel.startingReps * inputs.salesRepChannel.salesPerRepPerMonth} new subs</strong>
                {inputs.salesRepChannel.monthlyGrowthRate > 0 && (
                  <span> · Mo 12: <strong className="text-foreground">{Math.round(inputs.salesRepChannel.startingReps * Math.pow(1 + inputs.salesRepChannel.monthlyGrowthRate / 100, 11))} reps → {Math.round(inputs.salesRepChannel.startingReps * Math.pow(1 + inputs.salesRepChannel.monthlyGrowthRate / 100, 11) * inputs.salesRepChannel.salesPerRepPerMonth)} subs</strong></span>
                )}
              </span>
            </div>
          </div>
        </InputCard>

        {/* Commission Structure */}
        <InputCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title="Commission Structure"
          description="How reps are paid per sale"
          tooltip="Define how your D2D sales reps are compensated — upfront bonus (flat $ or % of plan price), ongoing residual, accelerators, and payout timing."
          defaultOpen={defaultOpen}
        >
          <div className="space-y-3">
            {/* Upfront Commission */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Upfront Commission</span>

              {/* Type toggle */}
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputs({
                      commissionStructure: { ...inputs.commissionStructure, upfrontType: "flat" as const },
                    })}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      (inputs.commissionStructure.upfrontType ?? "flat") === "flat"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                    )}
                  >
                    Flat $
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs({
                      commissionStructure: { ...inputs.commissionStructure, upfrontType: "percent" as const },
                    })}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      inputs.commissionStructure.upfrontType === "percent"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                    )}
                  >
                    % of Plan
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {(inputs.commissionStructure.upfrontType ?? "flat") === "flat" ? (
                  <NumberField
                    label="Bonus per Sale ($)"
                    tooltip="A fixed dollar amount paid to the rep for each new subscription they close, regardless of which plan the subscriber chose."
                    value={inputs.commissionStructure.flatBonusPerSale}
                    step={5}
                    onChange={(v) =>
                      setInputs({
                        commissionStructure: { ...inputs.commissionStructure, flatBonusPerSale: v },
                      })
                    }
                  />
                ) : (
                  <NumberField
                    label="% of Plan Price"
                    tooltip="The rep earns this percentage of the subscriber's monthly plan price as their upfront bonus. 100% means the rep earns the full first month's revenue."
                    value={inputs.commissionStructure.upfrontPercent ?? 100}
                    step={5}
                    max={500}
                    onChange={(v) =>
                      setInputs({
                        commissionStructure: { ...inputs.commissionStructure, upfrontPercent: v },
                      })
                    }
                  />
                )}
                <NumberField
                  label="Payout Delay (months)"
                  tooltip="How many months after the sale before the upfront commission is paid. 0 = immediate. 2 = paid two months after the sale closes. Delays improve cash flow."
                  value={inputs.commissionStructure.payoutDelayMonths ?? 0}
                  step={1}
                  max={12}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, payoutDelayMonths: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Residual */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Residual (ongoing)</span>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Residual %/mo"
                  tooltip="An ongoing monthly percentage of each subscriber's revenue paid to the rep who sold them. This repeats every month the subscriber stays active."
                  value={inputs.commissionStructure.residualPercent}
                  step={0.5}
                  max={100}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, residualPercent: v },
                    })
                  }
                />
                <NumberField
                  label="Starts After (months)"
                  tooltip="How many months after the sale before the rep starts earning residual. 0 = residual begins immediately. 3 = the rep gets nothing for 3 months, then residual kicks in from month 4 onward."
                  value={inputs.commissionStructure.residualDelayMonths ?? 0}
                  step={1}
                  max={12}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, residualDelayMonths: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Accelerator */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Accelerator</span>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="% Hitting Accelerator"
                  tooltip="What percentage of your reps exceed their sales quota and earn the accelerator bonus."
                  value={inputs.commissionStructure.percentHittingAccelerator}
                  step={5}
                  max={100}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, percentHittingAccelerator: v },
                    })
                  }
                />
                <NumberField
                  label="Multiplier"
                  tooltip="The bonus multiplier for top-performing reps. At 1.5x, a rep earning a $50 bonus gets $75 when they hit their accelerator threshold."
                  value={inputs.commissionStructure.acceleratorMultiplier}
                  step={0.1}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, acceleratorMultiplier: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Summary */}
            {(() => {
              const isPercent = inputs.commissionStructure.upfrontType === "percent";
              const upfrontLabel = isPercent
                ? `${inputs.commissionStructure.upfrontPercent ?? 100}% of plan price`
                : `$${inputs.commissionStructure.flatBonusPerSale} flat`;
              const delay = inputs.commissionStructure.payoutDelayMonths ?? 0;
              const delayLabel = delay === 0 ? "paid immediately" : `paid after ${delay} mo`;
              const residual = inputs.commissionStructure.residualPercent;
              const resDelay = inputs.commissionStructure.residualDelayMonths ?? 0;
              const resDelayLabel = resDelay === 0 ? "" : ` (starts after ${resDelay} mo)`;
              return (
                <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  <span>
                    Upfront: <strong className="text-foreground">{upfrontLabel}</strong> ({delayLabel})
                    {residual > 0 && (
                      <> + <strong className="text-foreground">{residual}%/mo</strong> residual{resDelayLabel}</>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
        </InputCard>

        {/* Profit Split */}
        <InputCard
          icon={<PieChart className="h-3.5 w-3.5" />}
          title="Profit Split"
          description="How channel profits are divided between parties"
          tooltip="After all costs (COGS, commissions, overhead), the remaining profit from this sales channel is split between the parties defined here. Percentages should total 100%."
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            {inputs.profitSplitParties.length === 0 && (
              <div className="rounded-lg bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
                No parties defined. Add parties to split the channel profits.
              </div>
            )}

            {inputs.profitSplitParties.map((party, idx) => (
              <div key={party.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[11px] text-muted-foreground mb-0.5 block">Party Name</Label>
                  {readOnly ? (
                    <div className="h-8 flex items-center text-sm font-medium">{party.name}</div>
                  ) : (
                    <Input
                      type="text"
                      value={party.name}
                      placeholder="e.g. HERD, Investor, Partner"
                      onChange={(e) => {
                        const updated = [...inputs.profitSplitParties];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setInputs({ profitSplitParties: updated });
                      }}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                <div className="w-[80px]">
                  <NumberField
                    label="Split %"
                    tooltip="What percentage of the channel's net profit this party receives."
                    value={party.percent}
                    step={5}
                    max={100}
                    onChange={(v) => {
                      const updated = [...inputs.profitSplitParties];
                      updated[idx] = { ...updated[idx], percent: v };
                      setInputs({ profitSplitParties: updated });
                    }}
                  />
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = inputs.profitSplitParties.filter((_, i) => i !== idx);
                      setInputs({ profitSplitParties: updated });
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const newParty = {
                    id: crypto.randomUUID(),
                    name: "",
                    percent: 0,
                  };
                  setInputs({
                    profitSplitParties: [...inputs.profitSplitParties, newParty],
                  });
                }}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50 w-full justify-center border border-dashed border-border/50"
              >
                <Plus className="h-3 w-3" />
                Add Party
              </button>
            )}

            {/* Summary */}
            {inputs.profitSplitParties.length > 0 && (() => {
              const totalPercent = inputs.profitSplitParties.reduce((s, p) => s + p.percent, 0);
              const isValid = totalPercent === 100;
              return (
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1.5",
                  isValid
                    ? "bg-muted/30 text-muted-foreground"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  <PieChart className="h-3 w-3 shrink-0" />
                  <span>
                    {inputs.profitSplitParties.map((p) => (
                      <span key={p.id}>
                        <strong className={isValid ? "text-foreground" : ""}>{p.name || "Unnamed"}</strong>: {p.percent}%
                        {" · "}
                      </span>
                    ))}
                    Total: <strong className={isValid ? "text-foreground" : ""}>{totalPercent}%</strong>
                    {!isValid && <span> (must be 100%)</span>}
                  </span>
                </div>
              );
            })()}
          </div>
        </InputCard>

        {/* Chargebacks */}
        <InputCard
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          title="Chargebacks"
          description="Projected chargeback rate and fees"
          tooltip="Percentage of new subscribers who will dispute/chargeback their purchase. Chargebacks reduce your net subscribers and incur processor fees plus lost COGS on shipped products."
          defaultOpen={defaultOpen}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField
              label="Chargeback Rate %"
              tooltip="What percentage of new subscribers will chargeback each month. E.g., 2% means 2 out of every 100 new sales result in a chargeback."
              value={inputs.chargebackPercent ?? 0}
              step={0.5}
              max={100}
              onChange={(v) => setInputs({ chargebackPercent: v })}
            />
            <NumberField
              label="Fee per Chargeback ($)"
              tooltip="The payment processor fee you pay per chargeback event, typically $15-25."
              value={inputs.chargebackFee ?? 15}
              step={5}
              max={100}
              onChange={(v) => setInputs({ chargebackFee: v })}
            />
          </div>
          {(inputs.chargebackPercent ?? 0) > 0 && (() => {
            const grossSubs = Math.round(inputs.salesRepChannel.startingReps * inputs.salesRepChannel.salesPerRepPerMonth);
            const cbs = Math.round(grossSubs * ((inputs.chargebackPercent ?? 0) / 100));
            return (
              <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground mt-1.5">
                ~{cbs} chargebacks/mo from {grossSubs} new sales → {grossSubs - cbs} net new subscribers
              </div>
            );
          })()}
        </InputCard>

        {/* Plans */}
        {inputs.tiers.length > 0 && (
          <InputCard
            icon={<Layers className="h-3.5 w-3.5" />}
            title="Plans"
            description="Plan structure & performance levers"
            tooltip="Plan structure is read-only from your Plans settings. Performance assumptions — subscriber mix, churn, billing behavior — are the levers that move your projections."
            defaultOpen={false}
            linkedBadge={dataSourceMeta?.linked.tierPricing ? <LinkedBadge label={`${dataSourceMeta.sources.tierCount} plans linked`} /> : undefined}
          >
            <div className="space-y-3">
              {/* Global Defaults */}
              <div className="rounded-md bg-muted/30 px-2.5 py-2.5 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Global Defaults</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <NumberField
                    label="Monthly %"
                    tooltip="Default % of subscribers paying month-to-month. Individual plans can override this in their Overrides section."
                    value={inputs.billingCycleDistribution.monthly}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, monthly: v },
                      })
                    }
                  />
                  <NumberField
                    label="Quarterly %"
                    tooltip="Default % of subscribers paying quarterly."
                    value={inputs.billingCycleDistribution.quarterly}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, quarterly: v },
                      })
                    }
                  />
                  <NumberField
                    label="Annual %"
                    tooltip="Default % of subscribers paying annually."
                    value={inputs.billingCycleDistribution.annual}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, annual: v },
                      })
                    }
                  />
                </div>
                {billingTotal !== 100 && (
                  <p className="text-[10px] text-red-500">Must total 100% (now {billingTotal}%)</p>
                )}
                <div className="grid grid-cols-1 gap-1.5 max-w-[140px]">
                  <NumberField
                    label="Credit Redemption %"
                    tooltip="Default % of credits subscribers actually use. Plans can override this individually. Unredeemed credits become breakage profit."
                    value={Math.round(inputs.creditRedemptionRate * 100)}
                    step={5}
                    max={100}
                    onChange={(v) => setInputs({ creditRedemptionRate: v / 100, breakageRate: 1 - v / 100 })}
                  />
                </div>
              </div>

              {/* Per-tier cards */}
              {inputs.tiers.map((tier, idx) => {
                const meta = tierDisplayMeta?.find((m) => m.tierId === tier.tierId);
                const hasBillingOverride = !!tier.billingDistribution;
                const hasRedemptionOverride = tier.creditRedemptionRate != null;
                const billingOverrideTotal = hasBillingOverride
                  ? (tier.billingDistribution!.monthly + tier.billingDistribution!.quarterly + tier.billingDistribution!.annual)
                  : 100;

                // Compute estimated cost per subscriber for this tier
                const tierRedemption = tier.creditRedemptionRate ?? inputs.creditRedemptionRate;
                const creditCOGS = calculateCreditCOGS(
                  tier.monthlyCredits,
                  tierRedemption,
                  inputs.avgCOGSToMemberPriceRatio
                );
                const estCostPerSub = calculateTotalCOGSPerSub(
                  creditCOGS,
                  tier.apparelCOGSPerMonth,
                  inputs.fulfillmentCostPerOrder,
                  inputs.shippingCostPerOrder
                );

                return (
                  <div key={tier.tierId} className="rounded-lg border bg-background p-2.5 space-y-2.5">
                    {/* Tier header */}
                    <div className="flex items-center gap-1.5">
                      {meta && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.colorAccent }}
                        />
                      )}
                      <p className="text-xs font-semibold">{tier.tierId}</p>
                    </div>

                    {/* Plan Structure — read-only */}
                    <div className="rounded-md bg-muted/50 px-2.5 py-2 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Plan Structure</span>
                        <LinkedBadge label="From Plans" />
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-foreground font-medium">${tier.monthlyPrice}/mo</span>
                        {meta && meta.quarterlyPriceTotal > 0 && (
                          <> · ${meta.quarterlyPriceTotal}/qtr <span className="text-muted-foreground">(${tier.quarterlyPricePerMonth}/mo)</span></>
                        )}
                        {meta && meta.annualPriceTotal > 0 && (
                          <> · ${meta.annualPriceTotal}/yr <span className="text-muted-foreground">(${tier.annualPricePerMonth}/mo)</span></>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {tier.monthlyCredits > 0 && (
                          <span>${tier.monthlyCredits} credits/mo</span>
                        )}
                        {tier.apparelCOGSPerMonth > 0 && (
                          <span>${tier.apparelCOGSPerMonth} apparel/mo</span>
                        )}
                        {tier.monthlyCredits === 0 && tier.apparelCOGSPerMonth === 0 && (
                          <span>No credits or apparel</span>
                        )}
                        {meta && meta.trialDays > 0 && (
                          <span>{meta.trialDays}-day trial</span>
                        )}
                        {meta && meta.setupFee > 0 && (
                          <span>${meta.setupFee} setup fee</span>
                        )}
                      </div>
                      {/* Estimated cost per subscriber — derived from plan + product data */}
                      <div className="pt-1 border-t border-border/30 mt-1.5">
                        <span className="text-xs">
                          Est. cost: <span className="text-foreground font-medium">${Math.round(estCostPerSub * 100) / 100}/sub/mo</span>
                        </span>
                      </div>
                    </div>

                    {/* Performance Assumptions — editable */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Performance</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <NumberField
                          label="Subscriber Mix %"
                          tooltip="What percentage of your total subscribers choose this plan. All plans should add up to 100%."
                          value={tier.subscriberPercent}
                          step={5}
                          max={100}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], subscriberPercent: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                        <NumberField
                          label="Monthly Churn %"
                          tooltip="Monthly cancellation rate for this plan. 6% monthly churn = ~17 month average lifetime. Churn only starts after the minimum commitment period expires."
                          value={tier.churnRateMonthly}
                          step={0.5}
                          max={50}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], churnRateMonthly: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                        <NumberField
                          label="Min Commit (mo)"
                          tooltip="Minimum months a subscriber is locked in before they can cancel. During this period churn is 0 (subscribers can't leave). Sourced from your plan settings."
                          value={tier.minimumCommitMonths ?? 1}
                          step={1}
                          max={24}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], minimumCommitMonths: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                      </div>
                    </div>

                    {/* Advanced Overrides — collapsible */}
                    <TierAdvancedOverrides
                      tier={tier}
                      tierIdx={idx}
                      globalBilling={inputs.billingCycleDistribution}
                      globalRedemptionRate={inputs.creditRedemptionRate}
                      hasBillingOverride={hasBillingOverride}
                      hasRedemptionOverride={hasRedemptionOverride}
                      billingOverrideTotal={billingOverrideTotal}
                      onUpdateTier={(updates) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], ...updates };
                        setInputs({ tiers: newTiers });
                      }}
                      onResetBilling={() => {
                        const newTiers = [...inputs.tiers];
                        const { billingDistribution: _, ...rest } = newTiers[idx];
                        newTiers[idx] = rest as typeof newTiers[number];
                        setInputs({ tiers: newTiers });
                      }}
                      onResetRedemption={() => {
                        const newTiers = [...inputs.tiers];
                        const { creditRedemptionRate: _, ...rest } = newTiers[idx];
                        newTiers[idx] = rest as typeof newTiers[number];
                        setInputs({ tiers: newTiers });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </InputCard>
        )}
      </div>
    </TooltipProvider>
    </ReadOnlyContext.Provider>
  );
}

/* ─── Sub-components ─── */

function LinkedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold px-1.5 py-0.5 uppercase tracking-wider">
      <Link2 className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function TierAdvancedOverrides({
  tier,
  tierIdx,
  globalBilling,
  globalRedemptionRate,
  hasBillingOverride,
  hasRedemptionOverride,
  billingOverrideTotal,
  onUpdateTier,
  onResetBilling,
  onResetRedemption,
}: {
  tier: import("@/lib/financial-engine").TierFinancialInput;
  tierIdx: number;
  globalBilling: import("@/lib/financial-engine").BillingDistribution;
  globalRedemptionRate: number;
  hasBillingOverride: boolean;
  hasRedemptionOverride: boolean;
  billingOverrideTotal: number;
  onUpdateTier: (updates: Partial<import("@/lib/financial-engine").TierFinancialInput>) => void;
  onResetBilling: () => void;
  onResetRedemption: () => void;
}) {
  const [open, setOpen] = useState(false);
  const readOnly = useContext(ReadOnlyContext);
  const hasAnyOverride = hasBillingOverride || hasRedemptionOverride;

  return (
    <div className="border-t border-border/50 pt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-90")} />
        <span className="font-medium uppercase tracking-wider">Overrides</span>
        {hasAnyOverride && (
          <span className="ml-auto text-[9px] rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 font-semibold">
            {[hasBillingOverride && "billing", hasRedemptionOverride && "redemption"].filter(Boolean).join(", ")}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {/* Billing Mix Override */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Billing Mix {hasBillingOverride ? "" : "(global)"}
              </span>
              {hasBillingOverride && !readOnly && (
                <button
                  type="button"
                  onClick={onResetBilling}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <NumberField
                label="Mo %"
                tooltip="Percentage of this plan's subscribers paying monthly. Override the global billing mix for this specific plan."
                value={hasBillingOverride ? tier.billingDistribution!.monthly : globalBilling.monthly}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, monthly: v } });
                }}
              />
              <NumberField
                label="Qtr %"
                tooltip="Percentage of this plan's subscribers paying quarterly."
                value={hasBillingOverride ? tier.billingDistribution!.quarterly : globalBilling.quarterly}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, quarterly: v } });
                }}
              />
              <NumberField
                label="Ann %"
                tooltip="Percentage of this plan's subscribers paying annually."
                value={hasBillingOverride ? tier.billingDistribution!.annual : globalBilling.annual}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, annual: v } });
                }}
              />
            </div>
            {hasBillingOverride && billingOverrideTotal !== 100 && (
              <p className="text-[10px] text-red-500">Must total 100% (now {billingOverrideTotal}%)</p>
            )}
          </div>

          {/* Credit Redemption Override */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Credit Redemption {hasRedemptionOverride ? "" : "(global)"}
              </span>
              {hasRedemptionOverride && !readOnly && (
                <button
                  type="button"
                  onClick={onResetRedemption}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Reset
                </button>
              )}
            </div>
            <div className="max-w-[140px]">
              <NumberField
                label="Redemption %"
                tooltip="What percentage of credits get redeemed by this plan's subscribers. Higher-tier members tend to redeem more. Overrides the global rate."
                value={hasRedemptionOverride ? Math.round(tier.creditRedemptionRate! * 100) : Math.round(globalRedemptionRate * 100)}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  onUpdateTier({ creditRedemptionRate: v / 100 });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputCard({
  icon,
  title,
  description,
  tooltip,
  error,
  defaultOpen = true,
  linkedBadge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tooltip: string;
  error?: string;
  defaultOpen?: boolean;
  linkedBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-muted/30">
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {title}
              </span>
              {linkedBadge}
            </div>
            {description && (
              <span className="text-[11px] text-muted-foreground truncate block">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip>
            <TooltipTrigger
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Collapsible content */}
      {open && (
        <div className="px-3 pb-3">
          <div className="rounded-md bg-background p-3">
            {children}
            {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  min = 0,
  max,
  onChange,
  tooltip,
  readOnly: readOnlyProp,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  tooltip?: string;
  readOnly?: boolean;
}) {
  const readOnlyCtx = useContext(ReadOnlyContext);
  const readOnly = readOnlyProp ?? readOnlyCtx;
  const [displayValue, setDisplayValue] = useState<string>(
    String(Math.round(value * 100) / 100)
  );
  const [focused, setFocused] = useState(false);

  // Sync display when value changes externally (and field isn't focused)
  const rounded = String(Math.round(value * 100) / 100);
  if (!focused && displayValue !== rounded) {
    setDisplayValue(rounded);
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Label className="text-[11px] text-muted-foreground">
          {label}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <HelpCircle className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {readOnly ? (
        <div className="h-8 flex items-center text-sm font-medium tabular-nums">
          {displayValue}
        </div>
      ) : (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={displayValue}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const v = parseFloat(displayValue);
            if (isNaN(v) || displayValue === "") {
              setDisplayValue("0");
              onChange(0);
            } else {
              const clamped = Math.round(v * 100) / 100;
              setDisplayValue(String(clamped));
              onChange(clamped);
            }
          }}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.round(v * 100) / 100);
          }}
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}
