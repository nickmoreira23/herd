"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gem } from "lucide-react";
import { toast } from "sonner";

interface TierAccess {
  agentId: string;
  subscriptionTierId: string;
  isEnabled: boolean;
  dailyUsageLimitOverride: number | null;
  priorityAccess: boolean;
}

interface TiersTabProps {
  agentId: string;
  allTiers: { id: string; name: string }[];
}

export function TiersTab({ agentId, allTiers }: TiersTabProps) {
  const [access, setAccess] = useState<Map<string, TierAccess>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        const json = await res.json();
        const map = new Map<string, TierAccess>();
        for (const row of json.data?.tierAccess || []) {
          map.set(row.subscriptionTierId, {
            agentId: row.agentId,
            subscriptionTierId: row.subscriptionTierId,
            isEnabled: row.isEnabled,
            dailyUsageLimitOverride: row.dailyUsageLimitOverride,
            priorityAccess: row.priorityAccess,
          });
        }
        setAccess(map);
      } catch {
        toast.error("Failed to load tier access");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  const saveForTier = useCallback(
    async (tierId: string, newAccess: Map<string, TierAccess>) => {
      // Build assignments for this specific tier
      // We need to save via the tier's agent endpoint
      const allAssignments: {
        agentId: string;
        isEnabled: boolean;
        dailyUsageLimitOverride?: number | null;
        priorityAccess?: boolean;
      }[] = [];

      const entry = newAccess.get(tierId);
      if (entry?.isEnabled) {
        allAssignments.push({
          agentId,
          isEnabled: true,
          dailyUsageLimitOverride: entry.dailyUsageLimitOverride,
          priorityAccess: entry.priorityAccess,
        });
      }

      try {
        // Fetch existing assignments for this tier first
        const existingRes = await fetch(`/api/tiers/${tierId}/agents`);
        const existingJson = await existingRes.json();
        const existingAssignments = (existingJson.data || [])
          .filter(
            (a: { agentId: string; isEnabled: boolean }) =>
              a.agentId !== agentId && a.isEnabled
          )
          .map(
            (a: {
              agentId: string;
              isEnabled: boolean;
              dailyUsageLimitOverride: number | null;
              priorityAccess: boolean;
            }) => ({
              agentId: a.agentId,
              isEnabled: true,
              dailyUsageLimitOverride: a.dailyUsageLimitOverride,
              priorityAccess: a.priorityAccess,
            })
          );

        const merged = [...existingAssignments, ...allAssignments];

        const res = await fetch(`/api/tiers/${tierId}/agents`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: merged }),
        });
        if (!res.ok) toast.error("Failed to save");
      } catch {
        toast.error("Failed to save");
      }
    },
    [agentId]
  );

  const toggleTier = useCallback(
    (tierId: string, enabled: boolean) => {
      const newMap = new Map(access);
      if (enabled) {
        newMap.set(tierId, {
          agentId,
          subscriptionTierId: tierId,
          isEnabled: true,
          dailyUsageLimitOverride:
            newMap.get(tierId)?.dailyUsageLimitOverride ?? null,
          priorityAccess: newMap.get(tierId)?.priorityAccess ?? false,
        });
      } else {
        newMap.delete(tierId);
      }
      setAccess(newMap);
      saveForTier(tierId, newMap);
    },
    [access, agentId, saveForTier]
  );

  const updateOverride = useCallback(
    (
      tierId: string,
      field: "dailyUsageLimitOverride" | "priorityAccess",
      value: number | null | boolean
    ) => {
      const newMap = new Map(access);
      const existing = newMap.get(tierId);
      if (!existing) return;
      newMap.set(tierId, { ...existing, [field]: value });
      setAccess(newMap);
      saveForTier(tierId, newMap);
    },
    [access, saveForTier]
  );

  const enabledCount = Array.from(access.values()).filter(
    (a) => a.isEnabled
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading tiers...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gem className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Tier Access</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {allTiers.length} tiers
        </span>
      </div>

      <div className="space-y-2">
        {allTiers.map((tier) => {
          const state = access.get(tier.id);
          const isEnabled = !!state?.isEnabled;
          return (
            <div
              key={tier.id}
              className="rounded-lg border bg-card px-4 py-3 space-y-2"
            >
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal"
                  >
                    <Gem className="h-3 w-3 mr-1" />
                    {tier.name}
                  </Badge>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(val) => toggleTier(tier.id, val)}
                />
              </label>

              {isEnabled && (
                <div className="flex items-center gap-4 pl-1 pt-1 border-t border-dashed border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      Daily limit override:
                    </span>
                    <Input
                      type="number"
                      className="h-6 w-20 text-xs px-2"
                      placeholder="Default"
                      value={state?.dailyUsageLimitOverride ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value)
                          : null;
                        updateOverride(tier.id, "dailyUsageLimitOverride", val);
                      }}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch
                      className="scale-75"
                      checked={state?.priorityAccess ?? false}
                      onCheckedChange={(val) =>
                        updateOverride(tier.id, "priorityAccess", val)
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Priority
                    </span>
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {allTiers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No subscription tiers configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
