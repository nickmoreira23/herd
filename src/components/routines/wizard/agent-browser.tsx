"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_CATEGORIES = [
  "NUTRITION",
  "TRAINING",
  "RECOVERY",
  "COACHING",
  "ANALYTICS",
  "IMAGE_GENERATION",
  "VIDEO_GENERATION",
  "VOICE",
  "MULTIMODAL",
] as const;

const AGENT_STATUSES = ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"] as const;

export interface AgentSummary {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  category: string;
  status: string;
  modelProvider?: string | null;
  modelId?: string | null;
  systemPrompt?: string | null;
  icon?: string | null;
}

interface AgentBrowserProps {
  value: string | null;
  onChange: (agentId: string, agent: AgentSummary) => void;
}

export function AgentBrowser({ value, onChange }: AgentBrowserProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("ACTIVE");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents?limit=500")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json.data)
          ? (json.data as AgentSummary[])
          : (json.data?.agents ?? []);
        setAgents(list);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load agents");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (category !== "all" && a.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          (a.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [agents, search, status, category]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="pl-7"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {AGENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {AGENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {agents.length}
        </span>
      </div>

      {error && (
        <div className="text-xs text-rose-500 border border-rose-500/30 rounded p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-md border bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded">
          No agents match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((agent) => {
            const selected = agent.id === value;
            return (
              <button
                type="button"
                key={agent.id}
                onClick={() => onChange(agent.id, agent)}
                className={cn(
                  "text-left rounded-md border p-3 transition-all",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-foreground/30 hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {agent.key}
                      </div>
                    </div>
                  </div>
                  {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
                {agent.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {agent.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {agent.category.replace(/_/g, " ")}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5",
                      agent.status === "ACTIVE"
                        ? "bg-emerald-200 text-emerald-800"
                        : agent.status === "BETA"
                          ? "bg-amber-200 text-amber-800"
                          : agent.status === "DRAFT"
                            ? "bg-slate-200 text-slate-800"
                            : "bg-rose-200 text-rose-800"
                    )}
                  >
                    {agent.status}
                  </span>
                  {agent.modelId && (
                    <span className="rounded bg-muted px-1.5 py-0.5 truncate max-w-[160px]">
                      {agent.modelId}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
