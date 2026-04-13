"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Target, Clock } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { calculateTierPreview } from "@/lib/financial-engine";
import { InfoTip } from "../info-tip";
import type { TierFormState, TierPricingSnapshotSerialized } from "../tier-detail-client";

interface PricingTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
  pricingSnapshots?: TierPricingSnapshotSerialized[];
}

export function PricingTab({ form, updateForm, onBlurSave, pricingSnapshots }: PricingTabProps) {
  const monthlySavingsQ = useMemo(() => {
    const m = parseFloat(form.monthlyPrice) || 0;
    const q = parseFloat(form.quarterlyPrice) || 0;
    if (m <= 0 || q <= 0 || q >= m) return null;
    return Math.round(((m - q) / m) * 100);
  }, [form.monthlyPrice, form.quarterlyPrice]);

  const monthlySavingsA = useMemo(() => {
    const m = parseFloat(form.monthlyPrice) || 0;
    const a = parseFloat(form.annualPrice) || 0;
    if (m <= 0 || a <= 0 || a >= m) return null;
    return Math.round(((m - a) / m) * 100);
  }, [form.monthlyPrice, form.annualPrice]);

  const preview = useMemo(
    () =>
      calculateTierPreview({
        monthlyPrice: parseFloat(form.monthlyPrice) || 0,
        quarterlyPrice: parseFloat(form.quarterlyPrice) || 0,
        annualPrice: parseFloat(form.annualPrice) || 0,
        monthlyCredits: parseFloat(form.monthlyCredits) || 0,
        apparelCOGSPerMonth:
          form.apparelCadence === "MONTHLY"
            ? parseFloat(form.apparelBudget) || 0
            : form.apparelCadence === "QUARTERLY"
              ? (parseFloat(form.apparelBudget) || 0) / 3
              : 0,
        billingDistribution: { monthly: 60, quarterly: 25, annual: 15 },
        creditRedemptionRate: 0.75,
        avgCOGSToMemberPriceRatio: 0.2,
        breakageRate: 0.25,
        fulfillmentCost: 3,
        shippingCost: 5,
        commissionFlatBonus: 50,
        commissionResidualPercent: 6,
        operationalOverheadPerSub: 0,
      }),
    [form.monthlyPrice, form.quarterlyPrice, form.annualPrice, form.monthlyCredits, form.apparelCadence, form.apparelBudget]
  );

  const marginColor = (pct: number) =>
    pct >= 50 ? "text-emerald-400" : pct >= 30 ? "text-amber-400" : "text-red-400";
  const marginBar = (pct: number) =>
    pct >= 50 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      {/* Left — Pricing fields */}
      <div className="space-y-6">
        {/* Core Prices */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Core Pricing</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Price <InfoTip text="Base monthly subscription price charged to members each billing cycle." /></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.monthlyPrice}
                  onChange={(e) => updateForm("monthlyPrice", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Quarterly/mo <InfoTip text="Per-month price when billed quarterly. Members pay this amount x3 every 3 months." /></Label>
                {monthlySavingsQ && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    Save {monthlySavingsQ}%
                  </Badge>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quarterlyPrice}
                  onChange={(e) => updateForm("quarterlyPrice", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Annual/mo <InfoTip text="Per-month price when billed annually. Members pay this amount x12 once per year." /></Label>
                {monthlySavingsA && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    Save {monthlySavingsA}%
                  </Badge>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.annualPrice}
                  onChange={(e) => updateForm("annualPrice", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Display Prices */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Display Prices</span>
            <span className="text-[10px] text-muted-foreground">(optional — for strikethrough UI)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Quarterly Display $/mo <InfoTip text="Optional display override for the pricing page. Use for strikethrough pricing effects." /></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quarterlyDisplay}
                  onChange={(e) => updateForm("quarterlyDisplay", e.target.value)}
                  onBlur={onBlurSave}
                  placeholder="—"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Annual Display $/mo <InfoTip text="Optional display override for the pricing page. Use for strikethrough pricing effects." /></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.annualDisplay}
                  onChange={(e) => updateForm("annualDisplay", e.target.value)}
                  onBlur={onBlurSave}
                  placeholder="—"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Setup & Trial */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider">Setup & Onboarding</span>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Setup Fee <InfoTip text="One-time fee charged when a member first subscribes to this plan." /></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.setupFee}
                  onChange={(e) => updateForm("setupFee", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trial Days <InfoTip text="Number of free days before the first payment is collected. 0 = no trial period." /></Label>
              <Input
                type="number"
                value={form.trialDays}
                onChange={(e) => updateForm("trialDays", e.target.value)}
                onBlur={onBlurSave}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Billing Anchor <InfoTip text="Signup Date: billing starts when they join. 1st of Month: all members billed on the 1st, prorated for the first cycle." /></Label>
              <Select
                value={form.billingAnchor}
                onValueChange={(val) => {
                  updateForm("billingAnchor", val ?? "SIGNUP_DATE");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGNUP_DATE">Signup Date</SelectItem>
                  <SelectItem value="FIRST_OF_MONTH">1st of Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pricing History */}
        {pricingSnapshots && pricingSnapshots.length > 0 && (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider">Pricing History</span>
            </div>
            <div className="space-y-1">
              {pricingSnapshots.slice(0, 10).map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">
                    {new Date(snap.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span>{formatCurrency(snap.monthlyPrice)}/mo</span>
                    {snap.quarterlyPrice != null && (
                      <span className="text-muted-foreground">{formatCurrency(snap.quarterlyPrice)}/q</span>
                    )}
                    {snap.annualPrice != null && (
                      <span className="text-muted-foreground">{formatCurrency(snap.annualPrice)}/yr</span>
                    )}
                  </div>
                  {snap.reason && (
                    <span className="text-muted-foreground max-w-[140px] truncate">{snap.reason}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right — Unit Economics Preview */}
      <div className="sticky top-0">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Unit Economics
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Live preview based on 60/25/15 billing split.
          </p>

          <div className="space-y-2 text-xs">
            <EconRow label="Revenue/sub" value={formatCurrency(preview.revenuePerSub)} />
            <EconRow label="Credit COGS" value={`-${formatCurrency(preview.creditCOGS)}`} className="text-red-400" />
            <EconRow label="Total COGS" value={`-${formatCurrency(preview.totalCOGS)}`} className="text-red-400" />

            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Gross Margin</span>
                </div>
                <span className={`font-bold tabular-nums ${marginColor(preview.grossMarginPercent)}`}>
                  {formatPercent(preview.grossMarginPercent)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${marginBar(preview.grossMarginPercent)}`}
                  style={{ width: `${Math.max(0, Math.min(100, preview.grossMarginPercent))}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(preview.grossMarginDollars)}/sub
              </p>
            </div>

            <EconRow label="Commission" value={`-${formatCurrency(preview.commissionCost)}`} className="text-red-400" />
            <EconRow label="Breakage" value={`+${formatCurrency(preview.breakageProfit)}`} className="text-emerald-400" />

            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Net Margin</span>
                </div>
                <span className={`font-bold tabular-nums ${marginColor(preview.netMarginPercent)}`}>
                  {formatPercent(preview.netMarginPercent)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${marginBar(preview.netMarginPercent)}`}
                  style={{ width: `${Math.max(0, Math.min(100, preview.netMarginPercent))}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(preview.netMarginDollars)}/sub
              </p>
            </div>

            <div className="border-t pt-2">
              <EconRow
                label="Breakeven subs"
                value={preview.breakeven === Infinity ? "N/A" : String(preview.breakeven)}
                className="font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EconRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${className || ""}`}>{value}</span>
    </div>
  );
}
