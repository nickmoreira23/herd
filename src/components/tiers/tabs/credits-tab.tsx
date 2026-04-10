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
import { CreditCard, Coins, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TierFormState } from "../tier-detail-client";

interface CreditsTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function CreditsTab({ form, updateForm, onBlurSave }: CreditsTabProps) {
  const annualValue = useMemo(() => {
    const monthly = parseFloat(form.monthlyCredits) || 0;
    const bonus = parseFloat(form.annualBonusCredits) || 0;
    return monthly * 12 + bonus;
  }, [form.monthlyCredits, form.annualBonusCredits]);

  return (
    <div className="grid grid-cols-[1fr_280px] gap-6">
      {/* Left — Fields */}
      <div className="space-y-6">
        {/* Core Credits */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Core Credits</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Credits ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.monthlyCredits}
                  onChange={(e) => updateForm("monthlyCredits", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Credit Expiration (days)</Label>
              <Input
                type="number"
                value={form.creditExpirationDays}
                onChange={(e) => updateForm("creditExpirationDays", e.target.value)}
                onBlur={onBlurSave}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Issuing Timing</Label>
              <Select
                value={form.creditIssuing}
                onValueChange={(val) => {
                  updateForm("creditIssuing", val ?? "ON_PAYMENT");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_PAYMENT">On Payment</SelectItem>
                  <SelectItem value="FIXED_DATE">Fixed Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry Behavior</Label>
              <Select
                value={form.creditExpiry}
                onValueChange={(val) => {
                  updateForm("creditExpiry", val ?? "FORFEIT");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORFEIT">Forfeit</SelectItem>
                  <SelectItem value="CONVERT">Convert to Store Credit</SelectItem>
                  <SelectItem value="DONATE">Donate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Rollover */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Rollover</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Rollover Months</Label>
              <Input
                type="number"
                value={form.rolloverMonths}
                onChange={(e) => updateForm("rolloverMonths", e.target.value)}
                onBlur={onBlurSave}
                placeholder="0 = no rollover"
              />
              <p className="text-[10px] text-muted-foreground">0 means no rollover allowed</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rollover Cap ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.rolloverCap}
                  onChange={(e) => updateForm("rolloverCap", e.target.value)}
                  onBlur={onBlurSave}
                  placeholder="No cap"
                  className="pl-7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Leave empty for no cap</p>
            </div>
          </div>
        </div>

        {/* Bonus Credits */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bonus Credits</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Annual Bonus Credits ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.annualBonusCredits}
                  onChange={(e) => updateForm("annualBonusCredits", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Extra credits for annual plan subscribers</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Referral Credit ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={form.referralCreditAmt}
                  onChange={(e) => updateForm("referralCreditAmt", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Credit awarded per successful referral</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Partner Discount %</Label>
              <Input
                type="number"
                step="0.1"
                value={form.partnerDiscountPercent}
                onChange={(e) => updateForm("partnerDiscountPercent", e.target.value)}
                onBlur={onBlurSave}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right — Value Summary */}
      <div className="sticky top-0">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Credit Value Summary
          </p>
          <div className="space-y-3">
            <SummaryRow label="Monthly Credits" value={formatCurrency(parseFloat(form.monthlyCredits) || 0)} />
            <SummaryRow label="Annual Total" value={formatCurrency((parseFloat(form.monthlyCredits) || 0) * 12)} />
            {parseFloat(form.annualBonusCredits) > 0 && (
              <SummaryRow label="+ Annual Bonus" value={`+${formatCurrency(parseFloat(form.annualBonusCredits))}`} className="text-emerald-400" />
            )}
            <div className="border-t pt-2">
              <SummaryRow
                label="Annual Plan Value"
                value={formatCurrency(annualValue)}
                className="font-bold"
              />
            </div>
            {parseInt(form.rolloverMonths) > 0 && (
              <div className="border-t pt-2">
                <SummaryRow
                  label="Max Rollover"
                  value={
                    form.rolloverCap
                      ? formatCurrency(parseFloat(form.rolloverCap))
                      : `${form.rolloverMonths} months`
                  }
                />
              </div>
            )}
            <div className="border-t pt-2">
              <SummaryRow label="Expiration" value={`${form.creditExpirationDays} days`} />
              <SummaryRow
                label="Expiry Action"
                value={form.creditExpiry === "FORFEIT" ? "Forfeited" : form.creditExpiry === "CONVERT" ? "Store Credit" : "Donated"}
              />
            </div>
            {parseFloat(form.referralCreditAmt) > 0 && (
              <div className="border-t pt-2">
                <SummaryRow label="Referral Reward" value={formatCurrency(parseFloat(form.referralCreditAmt))} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${className || ""}`}>{value}</span>
    </div>
  );
}
