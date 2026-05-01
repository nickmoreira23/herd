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
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { Locale } from "@/lib/i18n/locales";
import type { TableRow, TableStats } from "./types";

interface TablesListClientProps {
  initialTables: TableRow[];
  initialStats: TableStats;
  airtableConnected?: boolean;
  locale: Locale;
}

export function TablesListClient({
  initialTables,
  initialStats,
  airtableConnected = false,
  locale,
}: TablesListClientProps) {
  const t = useT();
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
      notifySuccess(
        table.isActive
          ? "tables.feedback.deactivated"
          : "tables.feedback.activated",
        t,
      );
    }
  }, [refreshTables, t]);

  const handleDelete = useCallback(async (table: TableRow) => {
    const res = await fetch(`/api/tables/${table.id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshTables();
      notifySuccess("tables.feedback.table_deleted", t);
    } else {
      notifyError("error.tables.delete_failed", t);
    }
    setDeleteTarget(null);
  }, [refreshTables, t]);

  const columns = useMemo(
    () => getTableColumns({
      t,
      locale,
      onOpen: handleOpen,
      onToggleActive: handleToggleActive,
      onDelete: (table) => setDeleteTarget(table),
    }),
    [t, locale, handleOpen, handleToggleActive]
  );

  // Stats
  const statCards: StatCard[] = [
    { label: t("tables.list.stats.total"), value: String(stats.total) },
    { label: t("tables.list.stats.ready"), value: String(stats.ready) },
    { label: t("tables.list.stats.processing"), value: String(stats.processing) },
    { label: t("tables.list.stats.total_records"), value: String(stats.totalRecords) },
  ];

  // Filters
  const filters: FilterDef<TableRow>[] = [
    {
      key: "status",
      label: t("tables.list.filter.all_status"),
      options: [
        { value: "PENDING", label: t("tables.list.status.pending") },
        { value: "PROCESSING", label: t("tables.list.status.processing") },
        { value: "READY", label: t("tables.list.status.ready") },
        { value: "ERROR", label: t("tables.list.status.error") },
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
          {t("tables.list.import_from_airtable")}
        </Button>
      )}
      <Button size="sm" onClick={() => setShowCreate(true)}>
        <Plus className="mr-1 h-3 w-3" />
        {t("tables.list.create_table")}
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
      title={t("tables.list.title")}
      description={t("tables.list.description")}
      data={tables}
      getId={(tbl) => tbl.id}
      columns={columns}
      onRowClick={handleOpen}
      searchPlaceholder={t("tables.list.search_placeholder")}
      searchFn={(tbl, q) => tbl.name.toLowerCase().includes(q) || (tbl.description?.toLowerCase().includes(q) ?? false)}
      filters={filters}
      stats={statCards}
      headerActions={headerActions}
      emptyIcon={Table2}
      emptyTitle={t("tables.empty.title")}
      emptyDescription={t("tables.empty.short_description")}
      modals={modals}
      showAgent={false}
    />
  );
}
