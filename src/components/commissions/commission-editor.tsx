"use client";

import { useState, useEffect } from "react";
import type { CommissionStructure, CommissionTierRate, SubscriptionTier } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Shield, Zap } from "lucide-react";

type StructureWithRates = CommissionStructure & {
  tierRates: (CommissionTierRate & { subscriptionTier: SubscriptionTier })[];
};

interface CommissionEditorProps {
  structure?: StructureWithRates | null;
  tiers: SubscriptionTier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    data: Record<string, unknown>,
    rates: { subscriptionTierId: string; flatBonusAmount: number; acceleratorThreshold?: number; acceleratorMultiplier?: number }[]
  ) => void;
}

export function CommissionEditor({
  structure,
  tiers,
  open,
  onOpenChange,
  onSave,
}: CommissionEditorProps) {
  const [form, setForm] = useState({
    name: "",
    clawbackWindowDays: "60",
    residualPercent: "",
    isActive: false,
    notes: "",
  });
  const [rates, setRates] = useState<
    Record<string, { flatBonus: string; threshold: string; multiplier: string }>
  >({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (structure) {
      setForm({
        name: structure.name,
        clawbackWindowDays: String(structure.clawbackWindowDays),
        residualPercent: String(structure.residualPercent),
        isActive: structure.isActive,
        notes: structure.notes || "",
      });
      const rateMap: typeof rates = {};
      for (const rate of structure.tierRates) {
        rateMap[rate.subscriptionTierId] = {
          flatBonus: String(rate.flatBonusAmount),
          threshold: rate.acceleratorThreshold ? String(rate.acceleratorThreshold) : "",
          multiplier: rate.acceleratorMultiplier ? String(rate.acceleratorMultiplier) : "",
        };
      }
      setRates(rateMap);
    } else {
      setForm({
        name: "",
        clawbackWindowDays: "60",
        residualPercent: "",
        isActive: false,
        notes: "",
      });
      setRates({});
    }
  }, [structure, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ratesArray = Object.entries(rates)
        .filter(([, r]) => r.flatBonus)
        .map(([tierId, r]) => ({
          subscriptionTierId: tierId,
          flatBonusAmount: parseFloat(r.flatBonus),
          acceleratorThreshold: r.threshold ? parseFloat(r.threshold) : undefined,
          acceleratorMultiplier: r.multiplier ? parseFloat(r.multiplier) : undefined,
        }));

      await onSave(
        {
          name: form.name,
          clawbackWindowDays: parseInt(form.clawbackWindowDays),
          residualPercent: parseFloat(form.residualPercent),
          isActive: form.isActive,
          notes: form.notes || undefined,
        },
        ratesArray
      );
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function updateRate(tierId: string, field: string, value: string) {
    setRates((prev) => ({
      ...prev,
      [tierId]: { ...(prev[tierId] || { flatBonus: "", threshold: "", multiplier: "" }), [field]: value },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {structure ? "Edit Commission Structure" : "New Commission Structure"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {structure
              ? "Update how your sales reps are compensated under this plan."
              : "Set up a new compensation plan for your D2D sales team."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Active */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-xs">Structure Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='e.g. "Launch 2026" or "Summer Push"'
                className="mt-1"
              />
            </div>
            <label className="flex items-center gap-2 text-sm h-9 px-3 rounded-lg border bg-muted/30">
              <Switch checked={form.isActive} onCheckedChange={(val) => setForm({ ...form, isActive: val })} />
              <span className="text-xs font-medium">Active</span>
            </label>
          </div>

          {/* Residual & Clawback */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider">Residual & Clawback</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Residual (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={form.residualPercent}
                  onChange={(e) => setForm({ ...form, residualPercent: e.target.value })}
                  placeholder="e.g. 6"
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  % of each subscriber&apos;s monthly payment that goes to the rep who signed them up, every month.
                </p>
              </div>
              <div>
                <Label className="text-xs">Clawback Window (days)</Label>
                <Input
                  type="number"
                  value={form.clawbackWindowDays}
                  onChange={(e) => setForm({ ...form, clawbackWindowDays: e.target.value })}
                  placeholder="e.g. 60"
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  If a subscriber cancels within this window, the rep&apos;s signup bonus is taken back. Standard: 30-90 days.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes about this commission plan..."
              className="mt-1"
            />
          </div>

          {/* Tier Rates */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider">Per-Tier Signup Bonuses</span>
                <p className="text-[11px] text-muted-foreground">
                  One-time cash bonus per new subscriber. Higher tiers = higher bonuses to incentivize premium sales.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {tiers.map((tier) => (
                <div key={tier.id} className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2 items-center rounded-lg border bg-background p-2.5">
                  <span className="text-xs font-semibold">{tier.name}</span>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Bonus ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={rates[tier.id]?.flatBonus || ""}
                      onChange={(e) => updateRate(tier.id, "flatBonus", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground">Accel. Threshold</Label>
                      <Zap className="h-2.5 w-2.5 text-amber-500" />
                    </div>
                    <Input
                      type="number"
                      step="1"
                      placeholder="—"
                      value={rates[tier.id]?.threshold || ""}
                      onChange={(e) => updateRate(tier.id, "threshold", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground">Multiplier</Label>
                      <Zap className="h-2.5 w-2.5 text-amber-500" />
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="1.5x"
                      value={rates[tier.id]?.multiplier || ""}
                      onChange={(e) => updateRate(tier.id, "multiplier", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500 inline mr-0.5 -mt-0.5" />
              Accelerator: when a rep exceeds the threshold % of quota, their bonus is multiplied (e.g. 1.5x = 50% more).
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : structure ? "Save Changes" : "Create Structure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
