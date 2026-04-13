"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CommunityBenefit } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { getCommunityColumns } from "./community-columns";
import { CommunityCardGrid } from "./community-card-grid";
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
import { communityConfig } from "@/lib/import-export/entity-config";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { Plus, Search, SlidersHorizontal, Power, PowerOff, Trash2, LayoutGrid, List, MoreHorizontal, Download, Upload } from "lucide-react";
import { useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";

type BenefitWithCount = CommunityBenefit & { _count: { tierAssignments: number } };

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

interface CommunityTableProps {
  initialBenefits: BenefitWithCount[];
  stats: StatItem[];
}

export function CommunityTable({ initialBenefits, stats }: CommunityTableProps) {
  const router = useRouter();
  const [benefits, setBenefits] = useState<BenefitWithCount[]>(initialBenefits);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredBenefits = useMemo(() => {
    let filtered = benefits;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.key.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [benefits, statusFilter, search]);

  const refreshBenefits = useCallback(async () => {
    const res = await fetch("/api/community");
    const json = await res.json();
    if (json.data) setBenefits(json.data);
  }, []);

  const handleDelete = useCallback(
    async (benefit: BenefitWithCount) => {
      if (!confirm(`Delete "${benefit.name}"?`)) return;
      const res = await fetch(`/api/community/${benefit.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBenefits((prev) => prev.filter((b) => b.id !== benefit.id));
        toast.success("Deleted");
      }
    },
    []
  );

  const handleBulkAction = useCallback(
    async (
      table: ReturnType<typeof useReactTable<BenefitWithCount>>,
      action: "activate" | "deactivate" | "delete"
    ) => {
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original.id);
      if (!ids.length) return;

      if (action === "delete" && !confirm(`Delete ${ids.length} benefit${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
        return;
      }

      const res = await fetch("/api/community/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        table.toggleAllRowsSelected(false);
        if (action === "delete") {
          setBenefits((prev) => prev.filter((b) => !ids.includes(b.id)));
        } else {
          await refreshBenefits();
        }
        const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted";
        toast.success(`${label} ${ids.length} benefit${ids.length === 1 ? "" : "s"}`);
      }
    },
    [refreshBenefits]
  );

  const columns = useMemo(
    () =>
      getCommunityColumns({
        onOpen: (b) => router.push(`/admin/blocks/community/${b.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage community benefits, platforms, and tier assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/admin/blocks/community/new")}>
            <Plus className="mr-1 h-3 w-3" />
            Add Benefit
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
            {filteredBenefits.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <CommunityCardGrid
          benefits={filteredBenefits}
          onOpen={(b) => router.push(`/admin/blocks/community/${b.id}`)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredBenefits}
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
        entityConfig={communityConfig}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityConfig={communityConfig}
        onComplete={refreshBenefits}
      />
      <BlockAgentPanel blockName="community" blockDisplayName="Community Benefits" />
    </div>
  );
}
