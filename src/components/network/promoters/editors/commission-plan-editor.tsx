"use client";

import { useState, useEffect } from "react";
import type { SubscriptionTier } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PlanData {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  residualPercent: number;
  notes: string | null;
  planRates: { roleType: string; upfrontBonus: number; residualPercent: number; subscriptionTier: { id: string; name: string } }[];
}

interface CommissionPlanEditorProps {
  plan?: PlanData | null;
  tiers: SubscriptionTier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const ROLES = ["REP", "TEAM_LEAD", "REGIONAL_LEADER"] as const;
const ROLE_LABELS: Record<string, string> = { REP: "Rep", TEAM_LEAD: "Team Lead", REGIONAL_LEADER: "Regional Leader" };

export function CommissionPlanEditor({ plan, tiers, open, onOpenChange, onSaved }: CommissionPlanEditorProps) {
  const [form, setForm] = useState({ name: "", isActive: false, residualPercent: "", effectiveFrom: "", effectiveTo: "", notes: "" });
  const [rates, setRates] = useState<Record<string, { upfrontBonus: string; residualPercent: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        isActive: plan.isActive,
        residualPercent: String(plan.residualPercent),
        effectiveFrom: plan.effectiveFrom ? plan.effectiveFrom.split("T")[0] : "",
        effectiveTo: plan.effectiveTo ? plan.effectiveTo.split("T")[0] : "",
        notes: plan.notes || "",
      });
      const rateMap: typeof rates = {};
      for (const r of plan.planRates) {
        const key = `${r.subscriptionTier.id}:${r.roleType}`;
        rateMap[key] = { upfrontBonus: String(r.upfrontBonus), residualPercent: String(r.residualPercent) };
      }
      setRates(rateMap);
    } else {
      setForm({ name: "", isActive: false, residualPercent: "", effectiveFrom: "", effectiveTo: "", notes: "" });
      setRates({});
    }
  }, [plan, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const planData = {
        name: form.name,
        isActive: form.isActive,
        residualPercent: parseFloat(form.residualPercent),
        effectiveFrom: form.effectiveFrom || null,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || undefined,
      };

      const url = plan ? `/api/commission-plans/${plan.id}` : "/api/commission-plans";
      const method = plan ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(planData) });
      if (!res.ok) { toast.error("Failed to save plan"); return; }
      const json = await res.json();
      const planId = plan?.id || json.data.id;

      // Save rates
      const ratesArray = Object.entries(rates)
        .filter(([, r]) => r.upfrontBonus || r.residualPercent)
        .map(([key, r]) => {
          const [subscriptionTierId, roleType] = key.split(":");
          return { subscriptionTierId, roleType, upfrontBonus: parseFloat(r.upfrontBonus) || 0, residualPercent: parseFloat(r.residualPercent) || 0 };
        });

      if (ratesArray.length > 0) {
        await fetch(`/api/commission-plans/${planId}/rates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates: ratesArray }),
        });
      }

      toast.success(plan ? "Plan updated" : "Plan created");
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function updateRate(tierId: string, role: string, field: string, value: string) {
    const key = `${tierId}:${role}`;
    setRates(prev => ({ ...prev, [key]: { ...(prev[key] || { upfrontBonus: "", residualPercent: "" }), [field]: value } }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? `Edit ${plan.name} v${plan.version}` : "New Commission Plan"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Define upfront bonuses and residual rates by subscription tier and role.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-xs">Plan Name</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder='e.g. "Launch 2026"' className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm h-9 px-3 rounded-lg border bg-muted/30">
              <Switch checked={form.isActive} onCheckedChange={val => setForm({ ...form, isActive: val })} />
              <span className="text-xs font-medium">Active</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Base Residual (%)</Label>
              <Input type="number" step="0.1" required value={form.residualPercent} onChange={e => setForm({ ...form, residualPercent: e.target.value })} placeholder="6" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Effective From</Label>
              <Input type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Effective To</Label>
              <Input type="date" value={form.effectiveTo} onChange={e => setForm({ ...form, effectiveTo: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes..." className="mt-1" />
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider">Rates by Tier & Role</span>
                <p className="text-[11px] text-muted-foreground">Upfront bonus ($) and residual (%) for each role at each subscription tier.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2 font-medium text-muted-foreground w-20">Tier</th>
                    {ROLES.map(role => (
                      <th key={role} colSpan={2} className="text-center py-2 px-1 font-medium text-muted-foreground">{ROLE_LABELS[role]}</th>
                    ))}
                  </tr>
                  <tr className="border-b text-[10px] text-muted-foreground">
                    <th></th>
                    {ROLES.map(role => (
                      <Fragment key={role}>
                        <th className="py-1 px-1 font-normal">Bonus $</th>
                        <th className="py-1 px-1 font-normal">Resid %</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiers.map(tier => (
                    <tr key={tier.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-semibold">{tier.name}</td>
                      {ROLES.map(role => {
                        const key = `${tier.id}:${role}`;
                        return (
                          <Fragment key={role}>
                            <td className="py-1 px-1">
                              <Input type="number" step="0.01" placeholder="0" value={rates[key]?.upfrontBonus || ""} onChange={e => updateRate(tier.id, role, "upfrontBonus", e.target.value)} className="h-7 text-xs w-20" />
                            </td>
                            <td className="py-1 px-1">
                              <Input type="number" step="0.1" placeholder="0" value={rates[key]?.residualPercent || ""} onChange={e => updateRate(tier.id, role, "residualPercent", e.target.value)} className="h-7 text-xs w-20" />
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : plan ? "Save Changes" : "Create Plan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Fragment helper for JSX
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
