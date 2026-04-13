"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/types";
import { getAgentColumns } from "./agent-columns";
import { AgentCardGrid } from "./agent-card-grid";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { agentConfig } from "@/lib/import-export/entity-config";
import { BlockListPage } from "@/components/shared/block-list-page";
import type {
  FilterDef,
  StatCard,
  BulkActionDef,
} from "@/components/shared/block-list-page/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Download,
  Upload,
  Bot,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

type AgentWithCount = Agent & { _count: { tierAccess: number } };

interface AgentsListClientProps {
  initialAgents: AgentWithCount[];
  stats: StatCard[];
}

// ─── Component ───────────────────────────────────────────────────────

export function AgentsListClient({
  initialAgents,
  stats,
}: AgentsListClientProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithCount[]>(initialAgents);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ── Data handlers ─────────────────────────────────────────────────

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
    [refreshAgents],
  );

  const handleDelete = useCallback(async (agent: AgentWithCount) => {
    if (!confirm(`Delete "${agent.name}"?`)) return;
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      toast.success("Deleted");
    }
  }, []);

  // ── Columns ───────────────────────────────────────────────────────

  const columns = useMemo(
    () =>
      getAgentColumns({
        onOpen: (a) => router.push(`/admin/blocks/agents/${a.id}`),
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
      }),
    [handleDelete, handleToggleStatus, router],
  );

  // ── Filters ───────────────────────────────────────────────────────

  const filters: FilterDef<AgentWithCount>[] = [
    {
      key: "category",
      label: "All Categories",
      options: [
        {
          value: "NUTRITION",
          label: `Nutrition (${agents.filter((a) => a.category === "NUTRITION").length})`,
        },
        {
          value: "TRAINING",
          label: `Training (${agents.filter((a) => a.category === "TRAINING").length})`,
        },
        {
          value: "RECOVERY",
          label: `Recovery (${agents.filter((a) => a.category === "RECOVERY").length})`,
        },
        {
          value: "COACHING",
          label: `Coaching (${agents.filter((a) => a.category === "COACHING").length})`,
        },
        {
          value: "ANALYTICS",
          label: `Analytics (${agents.filter((a) => a.category === "ANALYTICS").length})`,
        },
      ],
      filterFn: (item, value) => item.category === value,
    },
    {
      key: "status",
      label: "All Statuses",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "BETA", label: "Beta" },
        { value: "DRAFT", label: "Draft" },
        { value: "DEPRECATED", label: "Deprecated" },
      ],
      filterFn: (item, value) => item.status === value,
    },
  ];

  // ── Bulk actions ──────────────────────────────────────────────────

  const bulkActions: BulkActionDef[] = [
    {
      key: "activate",
      label: "Activate",
      icon: Power,
      handler: async (ids) => {
        const res = await fetch("/api/agents/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "activate" }),
        });
        if (res.ok) {
          await refreshAgents();
          toast.success(
            `Activated ${ids.length} agent${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
    {
      key: "deactivate",
      label: "Deactivate",
      icon: PowerOff,
      handler: async (ids) => {
        const res = await fetch("/api/agents/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "deactivate" }),
        });
        if (res.ok) {
          await refreshAgents();
          toast.success(
            `Deactivated ${ids.length} agent${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      handler: async (ids) => {
        if (
          !confirm(
            `Delete ${ids.length} agent${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
          )
        )
          return;
        const res = await fetch("/api/agents/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "delete" }),
        });
        if (res.ok) {
          setAgents((prev) => prev.filter((a) => !ids.includes(a.id)));
          toast.success(
            `Deleted ${ids.length} agent${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
  ];

  // ── Header actions ────────────────────────────────────────────────

  const headerActions = (
    <>
      <Button
        size="sm"
        onClick={() => router.push("/admin/blocks/agents/new")}
      >
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
    </>
  );

  // ── Modals ────────────────────────────────────────────────────────

  const modals = (
    <>
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
    </>
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <BlockListPage<AgentWithCount>
      blockName="agents"
      title="Agents"
      description="Manage AI agents, their configurations, and tier assignments."
      data={agents}
      getId={(a) => a.id}
      columns={columns}
      enableRowSelection
      onRowClick={(a) => router.push(`/admin/blocks/agents/${a.id}`)}
      searchPlaceholder="Search by name, key, or description..."
      searchFn={(a, q) =>
        a.name.toLowerCase().includes(q) ||
        a.key.toLowerCase().includes(q) ||
        (a.description ? a.description.toLowerCase().includes(q) : false)
      }
      filters={filters}
      stats={stats}
      additionalViews={[
        {
          type: "card",
          render: (data) => (
            <AgentCardGrid
              agents={data}
              onOpen={(a) => router.push(`/admin/blocks/agents/${a.id}`)}
            />
          ),
        },
      ]}
      headerActions={headerActions}
      bulkActions={bulkActions}
      emptyIcon={Bot}
      emptyTitle="No agents found"
      emptyDescription="Add your first agent or import from a spreadsheet."
      modals={modals}
    />
  );
}
