"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Crown, UserCog } from "lucide-react";
import { toast } from "sonner";

interface PlanOption {
  id: string;
  name: string;
  version: number;
  overrideRules: { id: string; roleType: string; overrideType: string; overrideValue: number; notes: string | null }[];
}

interface OverridesTabProps {
  plans: PlanOption[];
}

const ROLE_LABELS: Record<string, string> = { TEAM_LEAD: "Team Lead", REGIONAL_LEADER: "Regional Leader" };
const ROLE_ICONS: Record<string, React.ElementType> = { TEAM_LEAD: UserCog, REGIONAL_LEADER: Crown };

export function OverridesTab({ plans: initialPlans }: OverridesTabProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlans[0]?.id || "");
  const [rules, setRules] = useState<Record<string, { overrideType: string; overrideValue: string; notes: string }>>({});
  const [saving, setSaving] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const loadRules = useCallback((plan: PlanOption) => {
    const map: typeof rules = {};
    for (const role of ["TEAM_LEAD", "REGIONAL_LEADER"]) {
      const existing = plan.overrideRules.find(r => r.roleType === role);
      map[role] = {
        overrideType: existing?.overrideType || "FLAT",
        overrideValue: existing ? String(existing.overrideValue) : "",
        notes: existing?.notes || "",
      };
    }
    setRules(map);
  }, []);

  // Load on plan change
  useState(() => { if (selectedPlan) loadRules(selectedPlan); });

  async function handleSave() {
    if (!selectedPlanId) return;
    setSaving(true);
    try {
      const rulesArray = Object.entries(rules)
        .filter(([, r]) => r.overrideValue)
        .map(([roleType, r]) => ({
          roleType,
          overrideType: r.overrideType,
          overrideValue: parseFloat(r.overrideValue),
          notes: r.notes || undefined,
        }));

      const res = await fetch(`/api/commission-plans/${selectedPlanId}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesArray }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      toast.success("Override rules saved");

      // Refresh plans
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
          When a rep sells, their upline earns overrides. Define the override amount per role level for each plan.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs font-medium">Plan:</Label>
        <Select value={selectedPlanId} onValueChange={val => {
          setSelectedPlanId(val ?? "");
          const plan = plans.find(p => p.id === val);
          if (plan) loadRules(plan);
        }}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select plan" /></SelectTrigger>
          <SelectContent>
            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} v{p.version}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <div className="space-y-3">
          {(["TEAM_LEAD", "REGIONAL_LEADER"] as const).map(role => {
            const Icon = ROLE_ICONS[role];
            return (
              <Card key={role}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{ROLE_LABELS[role]} Override</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Override Type</Label>
                      <Select value={rules[role]?.overrideType || "FLAT"} onValueChange={val => setRules(prev => ({ ...prev, [role]: { ...prev[role], overrideType: val ?? "FLAT" } }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FLAT">Flat $ per sale</SelectItem>
                          <SelectItem value="PERCENT_OF_BONUS">% of rep bonus</SelectItem>
                          <SelectItem value="PERCENT_OF_REVENUE">% of revenue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Value {rules[role]?.overrideType === "FLAT" ? "($)" : "(%)"}</Label>
                      <Input type="number" step="0.01" value={rules[role]?.overrideValue || ""} onChange={e => setRules(prev => ({ ...prev, [role]: { ...prev[role], overrideValue: e.target.value } }))} className="mt-1" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input value={rules[role]?.notes || ""} onChange={e => setRules(prev => ({ ...prev, [role]: { ...prev[role], notes: e.target.value } }))} className="mt-1" placeholder="Optional" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save Overrides"}
          </Button>
        </div>
      )}
    </div>
  );
}
