"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface AgentInfo {
  id: string;
  name: string;
  key: string;
  category: string;
  icon: string;
  description: string | null;
}

interface TierAccessRow {
  id: string;
  agentId: string;
  isEnabled: boolean;
  dailyUsageLimitOverride: number | null;
  priorityAccess: boolean;
  agent: AgentInfo;
}

interface AgentsTabProps {
  tierId: string;
  onBenefitSaved?: () => void;
}

const CATEGORY_ORDER = ["NUTRITION", "TRAINING", "RECOVERY", "COACHING", "ANALYTICS"];
const CATEGORY_COLORS: Record<string, string> = {
  NUTRITION: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  TRAINING: "border-orange-400/50 bg-orange-400/10 text-orange-400",
  RECOVERY: "border-purple-400/50 bg-purple-400/10 text-purple-400",
  COACHING: "border-cyan-400/50 bg-cyan-400/10 text-cyan-400",
  ANALYTICS: "border-pink-400/50 bg-pink-400/10 text-pink-400",
};

interface AgentState {
  agentId: string;
  isEnabled: boolean;
  dailyUsageLimitOverride: number | null;
  priorityAccess: boolean;
}

export function AgentsTab({ tierId, onBenefitSaved }: AgentsTabProps) {
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([]);
  const [assignments, setAssignments] = useState<Map<string, AgentState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER)
  );

  // Fetch all active agents and current tier assignments
  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, accessRes] = await Promise.all([
          fetch("/api/agents?status=ACTIVE"),
          fetch(`/api/tiers/${tierId}/agents`),
        ]);
        const agentsJson = await agentsRes.json();
        const accessJson = await accessRes.json();

        const agents: AgentInfo[] = (agentsJson.data || []).map(
          (a: AgentInfo & { _count?: unknown }) => ({
            id: a.id,
            name: a.name,
            key: a.key,
            category: a.category,
            icon: a.icon,
            description: a.description,
          })
        );
        setAllAgents(agents);

        // Build assignment map from existing access rows
        const map = new Map<string, AgentState>();
        for (const row of (accessJson.data || []) as TierAccessRow[]) {
          map.set(row.agentId, {
            agentId: row.agentId,
            isEnabled: row.isEnabled,
            dailyUsageLimitOverride: row.dailyUsageLimitOverride,
            priorityAccess: row.priorityAccess,
          });
        }
        setAssignments(map);
      } catch {
        toast.error("Failed to load agents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tierId]);

  const saveAssignments = useCallback(
    async (newMap: Map<string, AgentState>) => {
      // Convert map to array — include all agents that are enabled
      const arr = Array.from(newMap.values()).filter((a) => a.isEnabled);
      try {
        const res = await fetch(`/api/tiers/${tierId}/agents`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: arr }),
        });
        if (!res.ok) {
          toast.error("Failed to save");
        } else {
          onBenefitSaved?.();
        }
      } catch {
        toast.error("Failed to save");
      }
    },
    [tierId, onBenefitSaved]
  );

  const toggleAgent = useCallback(
    (agentId: string, enabled: boolean) => {
      const newMap = new Map(assignments);
      if (enabled) {
        newMap.set(agentId, {
          agentId,
          isEnabled: true,
          dailyUsageLimitOverride: newMap.get(agentId)?.dailyUsageLimitOverride ?? null,
          priorityAccess: newMap.get(agentId)?.priorityAccess ?? false,
        });
      } else {
        newMap.delete(agentId);
      }
      setAssignments(newMap);
      saveAssignments(newMap);
    },
    [assignments, saveAssignments]
  );

  const updateOverride = useCallback(
    (agentId: string, field: "dailyUsageLimitOverride" | "priorityAccess", value: number | null | boolean) => {
      const newMap = new Map(assignments);
      const existing = newMap.get(agentId);
      if (!existing) return;
      newMap.set(agentId, { ...existing, [field]: value });
      setAssignments(newMap);
      saveAssignments(newMap);
    },
    [assignments, saveAssignments]
  );

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group agents by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    agents: allAgents.filter((a) => a.category === cat),
  })).filter((g) => g.agents.length > 0);

  const enabledCount = Array.from(assignments.values()).filter((a) => a.isEnabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading agents...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">AI Agent Access</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {allAgents.length} enabled
        </span>
      </div>

      <div className="space-y-3">
        {grouped.map(({ category, agents }) => {
          const expanded = expandedCategories.has(category);
          const catEnabled = agents.filter((a) => assignments.get(a.id)?.isEnabled).length;
          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 w-full text-left py-1.5"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] font-normal ${CATEGORY_COLORS[category] || ""}`}
                >
                  {category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {catEnabled}/{agents.length}
                </span>
              </button>

              {expanded && (
                <div className="space-y-2 ml-5">
                  {agents.map((agent) => {
                    const state = assignments.get(agent.id);
                    const isEnabled = !!state?.isEnabled;
                    return (
                      <div
                        key={agent.id}
                        className="rounded-lg border bg-card px-4 py-3 space-y-2"
                      >
                        <label className="flex items-center justify-between gap-4 cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{agent.name}</p>
                            {agent.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {agent.description}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(val) => toggleAgent(agent.id, val)}
                          />
                        </label>

                        {/* Per-tier overrides — only shown when enabled */}
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
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  updateOverride(agent.id, "dailyUsageLimitOverride", val);
                                }}
                              />
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <Switch
                                className="scale-75"
                                checked={state?.priorityAccess ?? false}
                                onCheckedChange={(val) =>
                                  updateOverride(agent.id, "priorityAccess", val)
                                }
                              />
                              <span className="text-[11px] text-muted-foreground">Priority</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {allAgents.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No agents configured yet. Add agents from the{" "}
            <Link href="/admin/blocks/agents" className="text-brand underline">
              AI Agents
            </Link>{" "}
            page.
          </div>
        )}
      </div>
    </div>
  );
}
