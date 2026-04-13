"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Perk } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { getPerkColumns } from "./perk-columns";
import { PerkCardGrid } from "./perk-card-grid";
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
import { perkConfig } from "@/lib/import-export/entity-config";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { Plus, Search, SlidersHorizontal, Power, PowerOff, Trash2, LayoutGrid, List, MoreHorizontal, Download, Upload } from "lucide-react";
import { useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";

type PerkWithCount = Perk & { _count: { tierAssignments: number } };

const STATUS_OPTIONS = [
  { value: "All Statuses", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Draft", filterKey: "DRAFT" },
  { value: "Archived", filterKey: "ARCHIVED" },
] as const;

interface StatItem {
  label: string;
  value: string;
}

interface PerkTableProps {
  initialPerks: PerkWithCount[];
  stats: StatItem[];
}

export function PerkTable({ initialPerks, stats }: PerkTableProps) {
  const router = useRouter();
  const [perks, setPerks] = useState<PerkWithCount[]>(initialPerks);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredPerks = useMemo(() => {
    let filtered = perks;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [perks, statusFilter, search]);

  const refreshPerks = useCallback(async () => {
    const res = await fetch("/api/perks");
    const json = await res.json();
    if (json.data) setPerks(json.data);
  }, []);

  const handleDelete = useCallback(
    async (perk: PerkWithCount) => {
      if (!confirm(`Delete "${perk.name}"?`)) return;
      const res = await fetch(`/api/perks/${perk.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPerks((prev) => prev.filter((p) => p.id !== perk.id));
        toast.success("Deleted");
      }
    },
    []
  );

  const handleBulkAction = useCallback(
    async (
      table: ReturnType<typeof useReactTable<PerkWithCount>>,
      action: "activate" | "deactivate" | "delete"
    ) => {
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original.id);
      if (!ids.length) return;

      if (action === "delete" && !confirm(`Delete ${ids.length} perk${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
        return;
      }

      const res = await fetch("/api/perks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        table.toggleAllRowsSelected(false);
        if (action === "delete") {
          setPerks((prev) => prev.filter((p) => !ids.includes(p.id)));
        } else {
          await refreshPerks();
        }
        const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted";
        toast.success(`${label} ${ids.length} perk${ids.length === 1 ? "" : "s"}`);
      }
    },
    [refreshPerks]
  );

  const columns = useMemo(
    () =>
      getPerkColumns({
        onOpen: (p) => router.push(`/admin/blocks/perks/${p.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage perks and their tier assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/admin/blocks/perks/new")}>
            <Plus className="mr-1 h-3 w-3" />
            Add Perk
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
            {filteredPerks.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <PerkCardGrid
          perks={filteredPerks}
          onOpen={(p) => router.push(`/admin/blocks/perks/${p.id}`)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPerks}
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
        entityConfig={perkConfig}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityConfig={perkConfig}
        onComplete={refreshPerks}
      />
      <BlockAgentPanel blockName="perks" blockDisplayName="Perks" />
    </div>
  );
}
