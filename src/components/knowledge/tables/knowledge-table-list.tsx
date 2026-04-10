"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getKnowledgeTableColumns } from "./knowledge-table-columns";
import { KnowledgeCreateTableModal } from "./knowledge-create-table-modal";
import { KnowledgeTableDeleteDialog } from "./knowledge-table-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal, Download } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeTableRow, KnowledgeTableStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";
import { AirtableImportModal } from "./airtable-import-modal";

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Processing", filterKey: "PROCESSING" },
  { value: "Ready", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface KnowledgeTableListProps {
  initialTables: KnowledgeTableRow[];
  initialStats: KnowledgeTableStats;
  airtableConnected?: boolean;
}

export function KnowledgeTableList({
  initialTables,
  initialStats,
  airtableConnected = false,
}: KnowledgeTableListProps) {
  const router = useRouter();
  const [tables, setTables] = useState<KnowledgeTableRow[]>(initialTables);
  const [stats, setStats] = useState<KnowledgeTableStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeTableRow | null>(
    null
  );

  const statusFilter =
    STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredTables = useMemo(() => {
    let filtered = tables;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [tables, statusFilter, search]);

  const refreshTables = useCallback(async () => {
    const res = await fetch("/api/knowledge/tables");
    const json = await res.json();
    if (json.data) {
      setTables(json.data.tables);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback(
    (table: KnowledgeTableRow) => {
      router.push(`/admin/organization/knowledge/tables/${table.id}`);
    },
    [router]
  );

  const handleToggleActive = useCallback(
    async (table: KnowledgeTableRow) => {
      const res = await fetch(`/api/knowledge/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !table.isActive }),
      });
      if (res.ok) {
        await refreshTables();
        toast.success(table.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshTables]
  );

  const handleDelete = useCallback(
    async (table: KnowledgeTableRow) => {
      const res = await fetch(`/api/knowledge/tables/${table.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshTables();
        toast.success("Table deleted");
      } else {
        toast.error("Failed to delete table");
      }
      setDeleteTarget(null);
    },
    [refreshTables]
  );

  const columns = useMemo(
    () =>
      getKnowledgeTableColumns({
        onOpen: handleOpen,
        onToggleActive: handleToggleActive,
        onDelete: (table) => setDeleteTarget(table),
      }),
    [handleOpen, handleToggleActive]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Tables"
          description="Structured datasets, lookup tables, and reference data for operations and reporting."
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              {airtableConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImport(true)}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Import from Airtable
                </Button>
              )}
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Create Table
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Total
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Ready
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.ready}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Processing
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.processing}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Total Records
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.totalRecords}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={filteredTables}
            toolbar={() => (
              <div className="flex items-center gap-3">
                {/* Status filter */}
                <Select
                  value={statusValue}
                  onValueChange={(val) =>
                    setStatusValue(val ?? "All Status")
                  }
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
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
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredTables.length} items
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <KnowledgeCreateTableModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onComplete={refreshTables}
      />

      <KnowledgeTableDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tableName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <AirtableImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onComplete={refreshTables}
      />
    </>
  );
}
