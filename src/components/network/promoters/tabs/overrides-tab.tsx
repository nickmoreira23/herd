"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Crown, UserCog } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface PlanOption {
  id: string;
  name: string;
  version: number;
  overrideRules: { id: string; roleType: string; overrideType: string; overrideValue: number; notes: string | null }[];
}

interface OverridesTabProps {
  plans: PlanOption[];
}

const ROLE_LABEL_KEYS: Record<string, MessageKey> = {
  TEAM_LEAD: "network.promoters.overrides.role.team_lead",
  REGIONAL_LEADER: "network.promoters.overrides.role.regional_leader",
};
const ROLE_ICONS: Record<string, React.ElementType> = { TEAM_LEAD: UserCog, REGIONAL_LEADER: Crown };

export function OverridesTab({ plans: initialPlans }: OverridesTabProps) {
  const t = useT();
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
      if (!res.ok) { notifyError("error.network.promoters.overrides.save_failed", t); return; }
      notifySuccess("network.promoters.feedback.overrides_saved", t);

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
          {t("network.promoters.overrides.description")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs font-medium">{t("network.promoters.overrides.plan_label")}</Label>
        <Select value={selectedPlanId} onValueChange={val => {
          setSelectedPlanId(val ?? "");
          const plan = plans.find(p => p.id === val);
          if (plan) loadRules(plan);
        }}>
          <SelectTrigger className="w-64"><SelectValue placeholder={t("network.promoters.overrides.plan_placeholder")} /></SelectTrigger>
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
                    <h3 className="font-semibold text-sm">{t("network.promoters.overrides.role_override_title", { role: t(ROLE_LABEL_KEYS[role]) })}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">{t("network.promoters.overrides.field.type")}</Label>
                      <Select value={rules[role]?.overrideType || "FLAT"} onValueChange={val => setRules(prev => ({ ...prev, [role]: { ...prev[role], overrideType: val ?? "FLAT" } }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FLAT">{t("network.promoters.overrides.type.flat")}</SelectItem>
                          <SelectItem value="PERCENT_OF_BONUS">{t("network.promoters.overrides.type.percent_of_bonus")}</SelectItem>
                          <SelectItem value="PERCENT_OF_REVENUE">{t("network.promoters.overrides.type.percent_of_revenue")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">
                        {rules[role]?.overrideType === "FLAT"
                          ? t("network.promoters.overrides.field.value_flat")
                          : t("network.promoters.overrides.field.value_percent")}
                      </Label>
                      <Input type="number" step="0.01" value={rules[role]?.overrideValue || ""} onChange={e => setRules(prev => ({ ...prev, [role]: { ...prev[role], overrideValue: e.target.value } }))} className="mt-1" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">{t("network.promoters.overrides.field.notes")}</Label>
                      <Input value={rules[role]?.notes || ""} onChange={e => setRules(prev => ({ ...prev, [role]: { ...prev[role], notes: e.target.value } }))} className="mt-1" placeholder={t("network.promoters.overrides.field.notes_placeholder")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? t("common.states.saving") : t("network.promoters.overrides.save_button")}
          </Button>
        </div>
      )}
    </div>
  );
}
