"use client";

import { createContext, useContext, useState } from "react";
import { useFinancialStore } from "@/stores/financial-store";

const ReadOnlyContext = createContext(false);
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Users,
  CreditCard,
  Package,
  DollarSign,
  Building2,
  Layers,
  HelpCircle,
  UserPlus,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ScenarioBuilder({ readOnly = false, defaultOpen = true }: { readOnly?: boolean; defaultOpen?: boolean }) {
  const { inputs, setInputs } = useFinancialStore();

  const billingTotal =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.quarterly +
    inputs.billingCycleDistribution.annual;

  return (
    <ReadOnlyContext.Provider value={readOnly}>
    <TooltipProvider>
      <div className="space-y-3">
        {/* Sales Rep Channel */}
        <InputCard
          icon={<UserPlus className="h-3.5 w-3.5" />}
          title="Sales Rep Channel"
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

        {/* Sampler Channel */}
        <InputCard
          icon={<Megaphone className="h-3.5 w-3.5" />}
          title="Sampler Channel"
          description="Marketing spend, distribution & conversion"
          tooltip="Your sampler/starter pack acquisition channel. Define how much you invest in marketing, the cost to produce each sampler, what % convert to paying subscribers, and how fast you scale this channel."
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Monthly Spend ($)"
                tooltip="How much you invest in sampler distribution per month. This covers production, packaging, and distribution of free starter packs."
                value={inputs.samplerChannel.monthlyMarketingSpend}
                step={500}
                onChange={(v) =>
                  setInputs({
                    samplerChannel: { ...inputs.samplerChannel, monthlyMarketingSpend: v },
                  })
                }
              />
              <NumberField
                label="Cost/Sampler ($)"
                tooltip="The all-in cost to produce and distribute one sampler pack. Divide your monthly spend by this to get the number of samplers you distribute."
                value={inputs.samplerChannel.costPerSampler}
                step={1}
                onChange={(v) =>
                  setInputs({
                    samplerChannel: { ...inputs.samplerChannel, costPerSampler: v },
                  })
                }
              />
              <NumberField
                label="Conversion %"
                tooltip="What percentage of sampler recipients become paying subscribers. If you distribute 200 samplers and 30 people subscribe, that's a 15% conversion rate."
                value={inputs.samplerChannel.conversionRate}
                step={1}
                max={100}
                onChange={(v) =>
                  setInputs({
                    samplerChannel: { ...inputs.samplerChannel, conversionRate: v },
                  })
                }
              />
              <NumberField
                label="Growth %/Mo"
                tooltip="How fast you scale sampler spend each month. At 10%, $5,000/mo becomes $5,500 next month, growing to ~$14,000 by month 12."
                value={inputs.samplerChannel.monthlyGrowthRate}
                step={1}
                max={100}
                onChange={(v) =>
                  setInputs({
                    samplerChannel: { ...inputs.samplerChannel, monthlyGrowthRate: v },
                  })
                }
              />
            </div>
            {(() => {
              const samplers = inputs.samplerChannel.costPerSampler > 0
                ? Math.round(inputs.samplerChannel.monthlyMarketingSpend / inputs.samplerChannel.costPerSampler)
                : 0;
              const converted = Math.round(samplers * (inputs.samplerChannel.conversionRate / 100));
              const mo12Spend = Math.round(inputs.samplerChannel.monthlyMarketingSpend * Math.pow(1 + inputs.samplerChannel.monthlyGrowthRate / 100, 11));
              const mo12Samplers = inputs.samplerChannel.costPerSampler > 0
                ? Math.round(mo12Spend / inputs.samplerChannel.costPerSampler)
                : 0;
              const mo12Converted = Math.round(mo12Samplers * (inputs.samplerChannel.conversionRate / 100));
              return (
                <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Megaphone className="h-3 w-3 shrink-0" />
                  <span>
                    Mo 1: {samplers} samplers → <strong className="text-foreground">{converted} new subs</strong>
                    {inputs.samplerChannel.monthlyGrowthRate > 0 && (
                      <span> · Mo 12: ${mo12Spend.toLocaleString()} → {mo12Samplers} samplers → <strong className="text-foreground">{mo12Converted} subs</strong></span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
        </InputCard>

        {/* Billing Distribution */}
        <InputCard
          icon={<CreditCard className="h-3.5 w-3.5" />}
          title="Billing Mix"
          description="Monthly, quarterly & annual split"
          tooltip="How your subscribers pay. Quarterly and annual plans are typically discounted, which lowers average revenue per subscriber. Must total 100%."
          defaultOpen={defaultOpen}
          error={billingTotal !== 100 ? `Must total 100% (now ${billingTotal}%)` : undefined}
        >
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Monthly %"
              tooltip="Percentage of subscribers paying month-to-month at full price. These generate the highest per-subscriber revenue."
              value={inputs.billingCycleDistribution.monthly}
              step={5}
              max={100}
              onChange={(v) =>
                setInputs({
                  billingCycleDistribution: {
                    ...inputs.billingCycleDistribution,
                    monthly: v,
                  },
                })
              }
            />
            <NumberField
              label="Quarterly %"
              tooltip="Percentage paying quarterly (usually at a discount). They commit longer but you earn less per month than monthly payers."
              value={inputs.billingCycleDistribution.quarterly}
              step={5}
              max={100}
              onChange={(v) =>
                setInputs({
                  billingCycleDistribution: {
                    ...inputs.billingCycleDistribution,
                    quarterly: v,
                  },
                })
              }
            />
            <NumberField
              label="Annual %"
              tooltip="Percentage paying annually (deepest discount). Lowest monthly revenue per subscriber but highest retention and upfront cash."
              value={inputs.billingCycleDistribution.annual}
              step={5}
              max={100}
              onChange={(v) =>
                setInputs({
                  billingCycleDistribution: {
                    ...inputs.billingCycleDistribution,
                    annual: v,
                  },
                })
              }
            />
          </div>
        </InputCard>

        {/* COGS / Operations */}
        <InputCard
          icon={<Package className="h-3.5 w-3.5" />}
          title="COGS & Operations"
          description="Direct costs per subscriber"
          tooltip="Cost of goods sold — the direct costs to fulfill subscriber benefits. These costs scale with each subscriber you add."
          defaultOpen={defaultOpen}
        >
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Credit Redemption %"
              tooltip="How much of their monthly credits subscribers actually spend. At 65%, a subscriber with $100 in credits typically uses $65. Higher redemption = higher COGS."
              value={Math.round(inputs.creditRedemptionRate * 100)}
              step={5}
              max={100}
              onChange={(v) => setInputs({ creditRedemptionRate: v / 100 })}
            />
            <NumberField
              label="COGS/Price Ratio %"
              tooltip="Your average product cost as a percentage of member pricing. If a product sells to members at $50 and costs you $10, this ratio is 20%."
              value={Math.round(inputs.avgCOGSToMemberPriceRatio * 100)}
              step={1}
              max={100}
              onChange={(v) => setInputs({ avgCOGSToMemberPriceRatio: v / 100 })}
            />
            <NumberField
              label="Breakage Rate %"
              tooltip="Percentage of credits that expire unused each month. This is money subscribers paid for but never redeemed — it becomes pure profit for you."
              value={Math.round(inputs.breakageRate * 100)}
              step={5}
              max={100}
              onChange={(v) => setInputs({ breakageRate: v / 100 })}
            />
            <NumberField
              label="Fulfillment $/order"
              tooltip="The cost to pick, pack, and prepare each order for shipping. Includes warehouse labor, packaging materials, and handling fees."
              value={inputs.fulfillmentCostPerOrder}
              step={0.5}
              onChange={(v) => setInputs({ fulfillmentCostPerOrder: v })}
            />
            <NumberField
              label="Shipping $/order"
              tooltip="Average shipping cost per order. This is the carrier fee (UPS, FedEx, USPS) you pay to deliver each subscriber's order."
              value={inputs.shippingCostPerOrder}
              step={0.5}
              onChange={(v) => setInputs({ shippingCostPerOrder: v })}
            />
          </div>
        </InputCard>

        {/* Commission Structure */}
        <InputCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title="Commission Structure"
          description="Fixed bonus, residual & accelerators"
          tooltip="How your sales reps are compensated for each sale. You can pay a one-time fixed bonus, an ongoing monthly residual, or both. Set either to 0 to disable."
          defaultOpen={defaultOpen}
        >
          <div className="space-y-3">
            {/* Commission type explanation */}
            <div className="rounded-lg bg-muted/30 px-2.5 py-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pay Structure</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {inputs.commissionStructure.flatBonusPerSale > 0 && inputs.commissionStructure.residualPercent > 0
                  ? "Fixed + Residual — reps earn a one-time bonus per sale AND an ongoing monthly cut."
                  : inputs.commissionStructure.flatBonusPerSale > 0
                    ? "Fixed Only — reps earn a one-time bonus per sale, no ongoing payments."
                    : inputs.commissionStructure.residualPercent > 0
                      ? "Residual Only — reps earn an ongoing monthly % of subscriber revenue."
                      : "No commission configured. Set a fixed bonus or residual % below."}
              </p>
            </div>

            {/* Fixed + Residual fields side by side */}
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Fixed Bonus / Sale ($)"
                tooltip="A one-time dollar amount paid to the rep for each new subscription they close. This is an upfront cost that doesn't repeat monthly. It directly impacts your CAC."
                value={inputs.commissionStructure.flatBonusPerSale}
                step={5}
                onChange={(v) =>
                  setInputs({
                    commissionStructure: {
                      ...inputs.commissionStructure,
                      flatBonusPerSale: v,
                    },
                  })
                }
              />
              <NumberField
                label="Residual %/mo"
                tooltip="An ongoing monthly percentage of each subscriber's revenue paid to the rep who sold them. This repeats every month as long as the subscriber stays active."
                value={inputs.commissionStructure.residualPercent}
                step={0.5}
                max={100}
                onChange={(v) =>
                  setInputs({
                    commissionStructure: {
                      ...inputs.commissionStructure,
                      residualPercent: v,
                    },
                  })
                }
              />
            </div>

            {/* Accelerator fields */}
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="% Hitting Accelerator"
                tooltip="What percentage of your reps exceed their sales quota and earn the accelerator bonus. Top performers get their fixed bonus multiplied by the accelerator."
                value={inputs.commissionStructure.percentHittingAccelerator}
                step={5}
                max={100}
                onChange={(v) =>
                  setInputs({
                    commissionStructure: {
                      ...inputs.commissionStructure,
                      percentHittingAccelerator: v,
                    },
                  })
                }
              />
              <NumberField
                label="Accelerator Multiplier"
                tooltip="The bonus multiplier for top-performing reps. At 1.5x, a rep who normally earns a $50 bonus would earn $75 per sale when they hit their accelerator threshold."
                value={inputs.commissionStructure.acceleratorMultiplier}
                step={0.1}
                onChange={(v) =>
                  setInputs({
                    commissionStructure: {
                      ...inputs.commissionStructure,
                      acceleratorMultiplier: v,
                    },
                  })
                }
              />
            </div>
          </div>
        </InputCard>

        {/* Overhead */}
        <InputCard
          icon={<Building2 className="h-3.5 w-3.5" />}
          title="Overhead"
          description={inputs.operationalOverhead.mode === "milestone-scaled" ? "Auto-scaled from Operations page" : "Fixed monthly operating costs"}
          tooltip="Operational costs like rent, salaries, software, and admin. Can be a fixed monthly amount or automatically scaled from your Operations page based on subscriber milestones."
          defaultOpen={defaultOpen}
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

        {/* Per-Tier Inputs */}
        {inputs.tiers.length > 0 && (
          <InputCard
            icon={<Layers className="h-3.5 w-3.5" />}
            title="Per-Tier Assumptions"
            description="Distribution, churn & pricing per tier"
            tooltip="Fine-tune the financial assumptions for each subscription tier — subscriber distribution, monthly churn, pricing, credit allocation, and apparel costs."
            defaultOpen={false}
          >
            <div className="space-y-2">
              {inputs.tiers.map((tier, idx) => (
                <div key={tier.tierId} className="rounded-lg border bg-background p-2.5 space-y-2">
                  <p className="text-xs font-semibold">{tier.tierId}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <NumberField
                      label="Subs %"
                      tooltip="What percentage of your total subscribers are on this tier. All tiers should add up to 100%."
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
                      label="Churn %/mo"
                      tooltip="Monthly cancellation rate for this tier. If 6% of subscribers cancel each month, the average subscriber stays ~17 months."
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
                      label="Price/mo"
                      tooltip="The monthly subscription price for this tier. Used to calculate blended revenue based on your billing mix."
                      value={tier.monthlyPrice}
                      step={1}
                      onChange={(v) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], monthlyPrice: v };
                        setInputs({ tiers: newTiers });
                      }}
                    />
                    <NumberField
                      label="Credits/mo"
                      tooltip="Monthly store credits included in this tier. Combined with redemption rate and COGS ratio, this determines your credit cost per subscriber."
                      value={tier.monthlyCredits}
                      step={5}
                      onChange={(v) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], monthlyCredits: v };
                        setInputs({ tiers: newTiers });
                      }}
                    />
                    <NumberField
                      label="Apparel COGS"
                      tooltip="Your monthly cost to provide apparel for this tier. If apparel ships quarterly, this is the quarterly cost divided by 3."
                      value={tier.apparelCOGSPerMonth}
                      step={1}
                      onChange={(v) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = {
                          ...newTiers[idx],
                          apparelCOGSPerMonth: v,
                        };
                        setInputs({ tiers: newTiers });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </InputCard>
        )}
      </div>
    </TooltipProvider>
    </ReadOnlyContext.Provider>
  );
}

/* ─── Sub-components ─── */

function InputCard({
  icon,
  title,
  description,
  tooltip,
  error,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tooltip: string;
  error?: string;
  defaultOpen?: boolean;
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
            <span className="text-xs font-semibold uppercase tracking-wider block">
              {title}
            </span>
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
