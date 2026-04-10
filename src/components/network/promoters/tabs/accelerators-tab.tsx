"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, Save } from "lucide-react";
import { toast } from "sonner";

interface PerfTierData {
  label: string;
  minSales: string;
  maxSales: string;
  bonusMultiplier: string;
  bonusFlat: string;
}

interface PlanOption {
  id: string;
  name: string;
  version: number;
  performanceTiers: { id: string; label: string; minSales: number; maxSales: number | null; bonusMultiplier: number; bonusFlat: number; sortOrder: number }[];
}

interface AcceleratorsTabProps {
  plans: PlanOption[];
}

export function AcceleratorsTab({ plans: initialPlans }: AcceleratorsTabProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlans[0]?.id || "");
  const [tiers, setTiers] = useState<PerfTierData[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const loadTiers = useCallback((plan: PlanOption) => {
    setTiers(plan.performanceTiers.map(t => ({
      label: t.label,
      minSales: String(t.minSales),
      maxSales: t.maxSales !== null ? String(t.maxSales) : "",
      bonusMultiplier: String(t.bonusMultiplier),
      bonusFlat: String(t.bonusFlat),
    })));
  }, []);

  useState(() => { if (selectedPlan) loadTiers(selectedPlan); });

  function addTier() {
    setTiers(prev => [...prev, { label: "", minSales: "", maxSales: "", bonusMultiplier: "1.0", bonusFlat: "0" }]);
  }

  function updateTier(idx: number, field: string, value: string) {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  function removeTier(idx: number) {
    setTiers(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!selectedPlanId) return;
    setSaving(true);
    try {
      const tiersArray = tiers
        .filter(t => t.label && t.minSales)
        .map((t, idx) => ({
          label: t.label,
          minSales: parseInt(t.minSales),
          maxSales: t.maxSales ? parseInt(t.maxSales) : null,
          bonusMultiplier: parseFloat(t.bonusMultiplier) || 1.0,
          bonusFlat: parseFloat(t.bonusFlat) || 0,
          sortOrder: idx,
        }));

      const res = await fetch(`/api/commission-plans/${selectedPlanId}/performance-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers: tiersArray }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      toast.success("Performance tiers saved");

      const plansRes = await fetch("/api/commission-plans");
      const json = await plansRes.json();
      if (json.data) setPlans(json.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-lg">
          Volume-based bonus escalation. Reps who sell more in a period get higher multipliers on their upfront bonuses.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs font-medium">Plan:</Label>
        <Select value={selectedPlanId} onValueChange={val => {
          setSelectedPlanId(val ?? "");
          const plan = plans.find(p => p.id === val);
          if (plan) loadTiers(plan);
        }}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select plan" /></SelectTrigger>
          <SelectContent>
            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} v{p.version}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Performance Tiers</span>
              </div>
              <Button variant="outline" size="xs" onClick={addTier}>
                <Plus className="h-3 w-3 mr-1" />Add Tier
              </Button>
            </div>

            {tiers.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No performance tiers. All reps earn the base bonus.</p>
            )}

            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="grid grid-cols-[120px_80px_80px_80px_80px_auto] gap-2 items-center rounded-lg border bg-background p-2.5">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Label</Label>
                    <Input value={tier.label} onChange={e => updateTier(idx, "label", e.target.value)} placeholder="Bronze" className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Min Sales</Label>
                    <Input type="number" value={tier.minSales} onChange={e => updateTier(idx, "minSales", e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Max Sales</Label>
                    <Input type="number" value={tier.maxSales} onChange={e => updateTier(idx, "maxSales", e.target.value)} placeholder="—" className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Multiplier</Label>
                    <Input type="number" step="0.05" value={tier.bonusMultiplier} onChange={e => updateTier(idx, "bonusMultiplier", e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Flat $</Label>
                    <Input type="number" value={tier.bonusFlat} onChange={e => updateTier(idx, "bonusFlat", e.target.value)} className="h-7 text-xs" />
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeTier(idx)} className="mt-3">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save Performance Tiers"}
          </Button>
        </div>
      )}
    </div>
  );
}
