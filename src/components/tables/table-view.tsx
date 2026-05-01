"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Zap } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/t";
import { FieldConfigModal } from "./field-config-modal";
import { TableGrid } from "./table-grid";
import type {
  TableRow,
  TableFieldRow,
  TableRecordRow,
} from "./types";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_LABEL_KEYS = {
  PENDING: "tables.view.status.pending",
  PROCESSING: "tables.view.status.processing",
  READY: "tables.view.status.ready",
  ERROR: "tables.view.status.error",
} as const satisfies Record<
  "PENDING" | "PROCESSING" | "READY" | "ERROR",
  MessageKey
>;

function getStatusLabel(
  status: string,
  t: (key: MessageKey, params?: Record<string, string | number>) => string
): string {
  if (status in STATUS_LABEL_KEYS) {
    return t(STATUS_LABEL_KEYS[status as keyof typeof STATUS_LABEL_KEYS]);
  }
  return status;
}

interface TableViewProps {
  table: TableRow;
  initialFields: TableFieldRow[];
  initialRecords: TableRecordRow[];
  totalRecords: number;
}

export function TableView({
  table: initialTable,
  initialFields,
  initialRecords,
  totalRecords,
}: TableViewProps) {
  const t = useT();
  const router = useRouter();
  const [table, setTable] = useState<TableRow>(initialTable);
  const [fields, setFields] =
    useState<TableFieldRow[]>(initialFields);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [processing, setProcessing] = useState(false);

  const refreshFields = useCallback(async () => {
    const res = await fetch(`/api/tables/${table.id}/fields`);
    const json = await res.json();
    if (json.data) {
      setFields(json.data);
    }
  }, [table.id]);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const res = await fetch(
        `/api/tables/${table.id}/process`,
        { method: "POST" }
      );
      const json = await res.json();
      if (res.ok && json.data) {
        setTable((prev) => ({
          ...prev,
          status: json.data.status,
          chunkCount: json.data.chunkCount,
          contentLength: json.data.contentLength ?? prev.contentLength,
          processedAt: json.data.processedAt,
          errorMessage: json.data.errorMessage,
        }));
        notifySuccess("tables.feedback.processed_for_knowledge", t);
      } else {
        notifyError("error.tables.processing_failed", t);
      }
    } catch {
      notifyError("error.tables.processing_failed", t);
    } finally {
      setProcessing(false);
    }
  }, [table.id, t]);

  const showProcessButton =
    table.status === "PENDING" || table.status === "ERROR";

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push("/admin/organization/knowledge/tables")
            }
            className="text-xs text-muted-foreground hover:text-foreground -ml-2 mb-2"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            {t("tables.view.back_to_tables")}
          </Button>
        </div>

        <PageHeader
          title={table.name}
          description={
            table.description || t("tables.view.no_description")
          }
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              {showProcessButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="mr-1 h-3 w-3" />
                  )}
                  {t("tables.view.process_button")}
                </Button>
              )}
              {processing && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20"
                >
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {t("tables.view.processing_badge")}
                </Badge>
              )}
              <Button
                size="sm"
                onClick={() => setShowFieldConfig(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("tables.view.add_field")}
              </Button>
            </div>
          }
        />

        {/* Table info */}
        <div className="flex items-center gap-3 mb-4">
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            {t("tables.view.fields_count", { count: fields.length })}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {t("tables.view.records_count", { count: table.recordCount })}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_STYLES[table.status] || ""}`}
          >
            {getStatusLabel(table.status, t)}
          </Badge>
          {table.status === "READY" && table.chunkCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {t("tables.view.chunks_count", {
                count: table.chunkCount,
              })}
            </Badge>
          )}
          {table.errorMessage && (
            <span className="text-xs text-red-500 truncate max-w-[300px]">
              {table.errorMessage}
            </span>
          )}
        </div>

        {/* Grid */}
        <TableGrid
          table={table}
          fields={fields}
          initialRecords={initialRecords}
          totalRecords={totalRecords}
          onFieldsChange={refreshFields}
        />
      </div>

      <FieldConfigModal
        open={showFieldConfig}
        onOpenChange={setShowFieldConfig}
        tableId={table.id}
        onComplete={refreshFields}
      />
    </>
  );
}
