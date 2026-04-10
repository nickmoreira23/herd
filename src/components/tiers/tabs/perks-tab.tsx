"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { TierFormState } from "../tier-detail-client";

interface PerkInfo {
  id: string;
  name: string;
  key: string;
  description: string | null;
  icon: string;
  status: string;
  hasSubConfig: boolean;
  subConfigLabel: string | null;
  subConfigType: string | null;
  subConfigOptions: string[];
}

interface PerkAssignment {
  perkId: string;
  isEnabled: boolean;
  configValue: string | null;
}

interface TierAssignmentRow {
  id: string;
  perkId: string;
  isEnabled: boolean;
  configValue: string | null;
  perk: PerkInfo;
}

interface PerksTabProps {
  tierId: string;
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function PerksTab({ tierId, form, updateForm, onBlurSave }: PerksTabProps) {
  const [allPerks, setAllPerks] = useState<PerkInfo[]>([]);
  const [assignments, setAssignments] = useState<Map<string, PerkAssignment>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch all active perks and current tier assignments
  useEffect(() => {
    async function load() {
      try {
        const [perksRes, assignmentsRes] = await Promise.all([
          fetch("/api/perks?status=ACTIVE"),
          fetch(`/api/tiers/${tierId}/perks`),
        ]);
        const perksJson = await perksRes.json();
        const assignmentsJson = await assignmentsRes.json();

        const perks: PerkInfo[] = (perksJson.data || []).map(
          (p: PerkInfo & { _count?: unknown }) => ({
            id: p.id,
            name: p.name,
            key: p.key,
            description: p.description,
            icon: p.icon,
            status: p.status,
            hasSubConfig: p.hasSubConfig,
            subConfigLabel: p.subConfigLabel,
            subConfigType: p.subConfigType,
            subConfigOptions: p.subConfigOptions || [],
          })
        );
        setAllPerks(perks);

        // Build assignment map
        const map = new Map<string, PerkAssignment>();
        for (const row of (assignmentsJson.data || []) as TierAssignmentRow[]) {
          map.set(row.perkId, {
            perkId: row.perkId,
            isEnabled: row.isEnabled,
            configValue: row.configValue,
          });
        }
        setAssignments(map);
      } catch {
        toast.error("Failed to load perks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tierId]);

  const saveAssignments = useCallback(
    async (newMap: Map<string, PerkAssignment>) => {
      const arr = Array.from(newMap.values());
      try {
        const res = await fetch(`/api/tiers/${tierId}/perks`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: arr }),
        });
        if (!res.ok) {
          toast.error("Failed to save");
        }
      } catch {
        toast.error("Failed to save");
      }
    },
    [tierId]
  );

  const togglePerk = useCallback(
    (perkId: string, enabled: boolean) => {
      const newMap = new Map(assignments);
      if (enabled) {
        newMap.set(perkId, {
          perkId,
          isEnabled: true,
          configValue: newMap.get(perkId)?.configValue ?? null,
        });
      } else {
        newMap.delete(perkId);
      }
      setAssignments(newMap);
      saveAssignments(newMap);
    },
    [assignments, saveAssignments]
  );

  const updateConfigValue = useCallback(
    (perkId: string, value: string) => {
      const newMap = new Map(assignments);
      const existing = newMap.get(perkId);
      if (!existing) return;
      newMap.set(perkId, { ...existing, configValue: value || null });
      setAssignments(newMap);
      saveAssignments(newMap);
    },
    [assignments, saveAssignments]
  );

  const enabledCount = Array.from(assignments.values()).filter((a) => a.isEnabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading perks...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Apparel Program — existing form fields */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Apparel Program</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Cadence</Label>
            <Select
              value={form.apparelCadence}
              onValueChange={(val) => {
                updateForm("apparelCadence", val);
                onBlurSave?.();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.apparelCadence !== "NONE" && (
            <div className="space-y-1.5">
              <Label>Budget per Drop ($)</Label>
              <Input
                type="number"
                value={form.apparelBudget}
                onChange={(e) => updateForm("apparelBudget", e.target.value)}
                onBlur={onBlurSave}
                placeholder="14.00"
              />
            </div>
          )}
        </div>
      </div>

      {/* Perks from foundation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Perks</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {enabledCount} of {allPerks.length} enabled
          </span>
        </div>

        <div className="space-y-2">
          {allPerks.map((perk) => {
            const assignment = assignments.get(perk.id);
            const isEnabled = !!assignment?.isEnabled;
            return (
              <div
                key={perk.id}
                className="rounded-lg border bg-card px-4 py-3 space-y-2"
              >
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{perk.name}</p>
                    {perk.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {perk.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(val) => togglePerk(perk.id, val)}
                  />
                </label>

                {/* Sub-configuration — shown when enabled and perk has config */}
                {isEnabled && perk.hasSubConfig && (
                  <div className="pl-1 pt-2 border-t border-dashed border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {perk.subConfigLabel || "Value"}:
                      </span>
                      {perk.subConfigType === "select" ? (
                        <Select
                          value={assignment?.configValue || ""}
                          onValueChange={(val) => updateConfigValue(perk.id, val ?? "")}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {perk.subConfigOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number"
                          className="h-7 w-24 text-xs px-2"
                          placeholder="0"
                          value={assignment?.configValue || ""}
                          onChange={(e) =>
                            updateConfigValue(perk.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {allPerks.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No perks configured yet. Add perks from the{" "}
              <Link href="/admin/perks" className="text-brand underline">
                Perks
              </Link>{" "}
              page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
