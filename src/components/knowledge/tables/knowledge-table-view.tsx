"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeFieldConfigModal } from "./knowledge-field-config-modal";
import { KnowledgeTableGrid } from "./knowledge-table-grid";
import type {
  KnowledgeTableRow,
  KnowledgeTableFieldRow,
  KnowledgeTableRecordRow,
} from "./types";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface KnowledgeTableViewProps {
  table: KnowledgeTableRow;
  initialFields: KnowledgeTableFieldRow[];
  initialRecords: KnowledgeTableRecordRow[];
  totalRecords: number;
}

export function KnowledgeTableView({
  table: initialTable,
  initialFields,
  initialRecords,
  totalRecords,
}: KnowledgeTableViewProps) {
  const router = useRouter();
  const [table, setTable] = useState<KnowledgeTableRow>(initialTable);
  const [fields, setFields] =
    useState<KnowledgeTableFieldRow[]>(initialFields);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [processing, setProcessing] = useState(false);

  const refreshFields = useCallback(async () => {
    const res = await fetch(`/api/knowledge/tables/${table.id}/fields`);
    const json = await res.json();
    if (json.data) {
      setFields(json.data);
    }
  }, [table.id]);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const res = await fetch(
        `/api/knowledge/tables/${table.id}/process`,
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
        toast.success("Table processed for knowledge base");
      } else {
        toast.error(json.error || "Processing failed");
      }
    } catch {
      toast.error("Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [table.id]);

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
            Back to Tables
          </Button>
        </div>

        <PageHeader
          title={table.name}
          description={table.description || "No description"}
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
                  Process
                </Button>
              )}
              {processing && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20"
                >
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Processing...
                </Badge>
              )}
              <Button
                size="sm"
                onClick={() => setShowFieldConfig(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Field
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
            {fields.length} fields
          </Badge>
          <Badge variant="outline" className="text-xs">
            {table.recordCount} records
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_STYLES[table.status] || ""}`}
          >
            {table.status}
          </Badge>
          {table.status === "READY" && table.chunkCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {table.chunkCount} chunks
            </Badge>
          )}
          {table.errorMessage && (
            <span className="text-xs text-red-500 truncate max-w-[300px]">
              {table.errorMessage}
            </span>
          )}
        </div>

        {/* Grid */}
        <KnowledgeTableGrid
          table={table}
          fields={fields}
          initialRecords={initialRecords}
          totalRecords={totalRecords}
          onFieldsChange={refreshFields}
        />
      </div>

      <KnowledgeFieldConfigModal
        open={showFieldConfig}
        onOpenChange={setShowFieldConfig}
        tableId={table.id}
        onComplete={refreshFields}
      />
    </>
  );
}
