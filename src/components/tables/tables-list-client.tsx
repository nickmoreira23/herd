"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTableColumns } from "./table-columns";
import { CreateTableModal } from "./create-table-modal";
import { TableDeleteDialog } from "./table-delete-dialog";
import { AirtableImportModal } from "./airtable-import-modal";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { TableRow, TableStats } from "./types";

interface TablesListClientProps {
  initialTables: TableRow[];
  initialStats: TableStats;
  airtableConnected?: boolean;
}

export function TablesListClient({
  initialTables,
  initialStats,
  airtableConnected = false,
}: TablesListClientProps) {
  const router = useRouter();
  const [tables, setTables] = useState<TableRow[]>(initialTables);
  const [stats, setStats] = useState<TableStats>(initialStats);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableRow | null>(null);

  const refreshTables = useCallback(async () => {
    const res = await fetch("/api/tables");
    const json = await res.json();
    if (json.data) {
      setTables(json.data.tables);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback((table: TableRow) => {
    router.push(`/admin/organization/knowledge/tables/${table.id}`);
  }, [router]);

  const handleToggleActive = useCallback(async (table: TableRow) => {
    const res = await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !table.isActive }),
    });
    if (res.ok) {
      await refreshTables();
      toast.success(table.isActive ? "Deactivated" : "Activated");
    }
  }, [refreshTables]);

  const handleDelete = useCallback(async (table: TableRow) => {
    const res = await fetch(`/api/tables/${table.id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshTables();
      toast.success("Table deleted");
    } else {
      toast.error("Failed to delete table");
    }
    setDeleteTarget(null);
  }, [refreshTables]);

  const columns = useMemo(
    () => getTableColumns({
      onOpen: handleOpen,
      onToggleActive: handleToggleActive,
      onDelete: (table) => setDeleteTarget(table),
    }),
    [handleOpen, handleToggleActive]
  );

  // Stats
  const statCards: StatCard[] = [
    { label: "Total", value: String(stats.total) },
    { label: "Ready", value: String(stats.ready) },
    { label: "Processing", value: String(stats.processing) },
    { label: "Total Records", value: String(stats.totalRecords) },
  ];

  // Filters
  const filters: FilterDef<TableRow>[] = [
    {
      key: "status",
      label: "All Status",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "PROCESSING", label: "Processing" },
        { value: "READY", label: "Ready" },
        { value: "ERROR", label: "Error" },
      ],
      filterFn: (item, value) => item.status === value,
    },
  ];

  // Header actions
  const headerActions = (
    <>
      {airtableConnected && (
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
          <Download className="mr-1 h-3 w-3" />
          Import from Airtable
        </Button>
      )}
      <Button size="sm" onClick={() => setShowCreate(true)}>
        <Plus className="mr-1 h-3 w-3" />
        Create Table
      </Button>
    </>
  );

  // Modals
  const modals = (
    <>
      <CreateTableModal open={showCreate} onOpenChange={setShowCreate} onComplete={refreshTables} />
      <TableDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        tableName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
      <AirtableImportModal open={showImport} onOpenChange={setShowImport} onComplete={refreshTables} />
    </>
  );

  return (
    <BlockListPage<TableRow>
      blockName="tables"
      title="Tables"
      description="Structured datasets, lookup tables, and reference data for operations and reporting."
      data={tables}
      getId={(t) => t.id}
      columns={columns}
      onRowClick={handleOpen}
      searchPlaceholder="Search by name or description..."
      searchFn={(t, q) => t.name.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false)}
      filters={filters}
      stats={statCards}
      headerActions={headerActions}
      emptyIcon={Table2}
      emptyTitle="No tables yet"
      emptyDescription="Create a table or import from Airtable."
      modals={modals}
      showAgent={false}
    />
  );
}
