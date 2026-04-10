"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { getAgentColumns } from "./agent-columns";
import { AgentCardGrid } from "./agent-card-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { agentConfig } from "@/lib/import-export/entity-config";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { Plus, Search, SlidersHorizontal, Power, PowerOff, Trash2, LayoutGrid, List, MoreHorizontal, Download, Upload } from "lucide-react";
import { useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";

type AgentWithCount = Agent & { _count: { tierAccess: number } };

const CATEGORIES = [
  { value: "All Categories", filterKey: "ALL" },
  { value: "Nutrition", filterKey: "NUTRITION" },
  { value: "Training", filterKey: "TRAINING" },
  { value: "Recovery", filterKey: "RECOVERY" },
  { value: "Coaching", filterKey: "COACHING" },
  { value: "Analytics", filterKey: "ANALYTICS" },
] as const;

const STATUS_OPTIONS = [
  { value: "All Statuses", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Beta", filterKey: "BETA" },
  { value: "Draft", filterKey: "DRAFT" },
  { value: "Deprecated", filterKey: "DEPRECATED" },
] as const;

interface StatItem {
  label: string;
  value: string;
}

interface AgentTableProps {
  initialAgents: AgentWithCount[];
  stats: StatItem[];
}

export function AgentTable({ initialAgents, stats }: AgentTableProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithCount[]>(initialAgents);
  const [search, setSearch] = useState("");
  const [categoryValue, setCategoryValue] = useState("All Categories");
  const [statusValue, setStatusValue] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const categoryFilter = CATEGORIES.find((c) => c.value === categoryValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredAgents = useMemo(() => {
    let filtered = agents;
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [agents, categoryFilter, statusFilter, search]);

  const refreshAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    const json = await res.json();
    if (json.data) setAgents(json.data);
  }, []);

  const handleToggleStatus = useCallback(
    async (agent: AgentWithCount) => {
      const newStatus = agent.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await refreshAgents();
        toast.success(newStatus === "ACTIVE" ? "Activated" : "Deactivated");
      }
    },
    [refreshAgents]
  );

  const handleDelete = useCallback(
    async (agent: AgentWithCount) => {
      if (!confirm(`Delete "${agent.name}"?`)) return;
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== agent.id));
        toast.success("Deleted");
      }
    },
    []
  );

  const handleBulkAction = useCallback(
    async (
      table: ReturnType<typeof useReactTable<AgentWithCount>>,
      action: "activate" | "deactivate" | "delete"
    ) => {
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original.id);
      if (!ids.length) return;

      if (action === "delete" && !confirm(`Delete ${ids.length} agent${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
        return;
      }

      const res = await fetch("/api/agents/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        table.toggleAllRowsSelected(false);
        if (action === "delete") {
          setAgents((prev) => prev.filter((a) => !ids.includes(a.id)));
        } else {
          await refreshAgents();
        }
        const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted";
        toast.success(`${label} ${ids.length} agent${ids.length === 1 ? "" : "s"}`);
      }
    },
    [refreshAgents]
  );

  const columns = useMemo(
    () =>
      getAgentColumns({
        onOpen: (a) => router.push(`/admin/agents/${a.id}`),
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
      }),
    [handleDelete, handleToggleStatus, router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI agents, their configurations, and tier assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/admin/agents/new")}>
            <Plus className="mr-1 h-3 w-3" />
            Add Agent
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-3.5 w-3.5" />
                Import Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExport(true)}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Export Spreadsheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border bg-muted/50 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md px-2.5 py-2 transition-colors ${
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-2.5 py-2 transition-colors ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Category dropdown */}
        <Select
          value={categoryValue}
          onValueChange={(val) => setCategoryValue(val ?? "All Categories")}
        >
          <SelectTrigger className="w-auto min-w-[130px] text-sm shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.value}
                {c.filterKey !== "ALL" && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({agents.filter((a) => a.category === c.filterKey).length})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusValue}
          onValueChange={(val) => setStatusValue(val ?? "All Statuses")}
        >
          <SelectTrigger className="w-auto min-w-[110px] text-sm shrink-0">
            <SlidersHorizontal className="mr-1.5 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-20 text-sm w-full"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
            {filteredAgents.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <AgentCardGrid
          agents={filteredAgents}
          onOpen={(a) => router.push(`/admin/agents/${a.id}`)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAgents}
          enableRowSelection
          toolbar={(table) => (
            <>
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleBulkAction(table, "activate")}
                  >
                    <Power className="mr-1 h-3 w-3" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleBulkAction(table, "deactivate")}
                  >
                    <PowerOff className="mr-1 h-3 w-3" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleBulkAction(table, "delete")}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
            </>
          )}
        />
      )}

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        entityConfig={agentConfig}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityConfig={agentConfig}
        onComplete={refreshAgents}
      />
      <BlockAgentPanel blockName="agents" blockDisplayName="AI Agents" />
    </div>
  );
}
