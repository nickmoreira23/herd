"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getTableColumns } from "./table-columns";
import { CreateTableModal } from "./create-table-modal";
import { TableDeleteDialog } from "./table-delete-dialog";
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
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { TableRow, TableStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";
import { AirtableImportModal } from "./airtable-import-modal";

type StatusFilter = "ALL" | "PENDING" | "PROCESSING" | "READY" | "ERROR";

const STATUS_OPTIONS: { filterKey: StatusFilter; labelKey: MessageKey }[] = [
  { filterKey: "ALL", labelKey: "tables.list.filter.all_status" },
  { filterKey: "PENDING", labelKey: "tables.list.status.pending" },
  { filterKey: "PROCESSING", labelKey: "tables.list.status.processing" },
  { filterKey: "READY", labelKey: "tables.list.status.ready" },
  { filterKey: "ERROR", labelKey: "tables.list.status.error" },
];

interface TableListProps {
  initialTables: TableRow[];
  initialStats: TableStats;
  airtableConnected?: boolean;
  locale: Locale;
}

export function TableList({
  initialTables,
  initialStats,
  airtableConnected = false,
  locale,
}: TableListProps) {
  const t = useT();
  const router = useRouter();
  const [tables, setTables] = useState<TableRow[]>(initialTables);
  const [stats, setStats] = useState<TableStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableRow | null>(
    null
  );

  const filteredTables = useMemo(() => {
    let filtered = tables;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((tbl) => tbl.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (tbl) =>
          tbl.name.toLowerCase().includes(q) ||
          (tbl.description && tbl.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [tables, statusFilter, search]);

  const refreshTables = useCallback(async () => {
    const res = await fetch("/api/tables");
    const json = await res.json();
    if (json.data) {
      setTables(json.data.tables);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback(
    (table: TableRow) => {
      router.push(`/admin/organization/knowledge/tables/${table.id}`);
    },
    [router]
  );

  const handleToggleActive = useCallback(
    async (table: TableRow) => {
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
    },
    [refreshTables, t]
  );

  const handleDelete = useCallback(
    async (table: TableRow) => {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshTables();
        notifySuccess("tables.feedback.table_deleted", t);
      } else {
        notifyError("error.tables.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshTables, t]
  );

  const columns = useMemo(
    () =>
      getTableColumns({
        t,
        locale,
        onOpen: handleOpen,
        onToggleActive: handleToggleActive,
        onDelete: (table) => setDeleteTarget(table),
      }),
    [t, locale, handleOpen, handleToggleActive]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("tables.list.title")}
          description={t("tables.list.description")}
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
                  {t("tables.list.import_from_airtable")}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("tables.list.create_table")}
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("tables.list.stats.total")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("tables.list.stats.ready")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.ready}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("tables.list.stats.processing")}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {stats.processing}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("tables.list.stats.total_records")}
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
                  value={statusFilter}
                  onValueChange={(val) =>
                    setStatusFilter((val as StatusFilter) ?? "ALL")
                  }
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.filterKey} value={s.filterKey}>
                        {t(s.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("tables.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("tables.list.items_count", {
                      count: filteredTables.length,
                    })}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <CreateTableModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onComplete={refreshTables}
      />

      <TableDeleteDialog
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
