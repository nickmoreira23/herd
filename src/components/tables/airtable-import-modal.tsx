"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Database,
  Table2,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

// ─── Field type mapping (client-side mirror) ────────────────────

const AIRTABLE_TO_HERD_TYPE: Record<string, string> = {
  singleLineText: "singleLineText",
  multilineText: "multilineText",
  richText: "multilineText",
  email: "email",
  url: "url",
  number: "number",
  percent: "percent",
  currency: "currency",
  singleSelect: "singleSelect",
  multipleSelects: "multiSelect",
  checkbox: "checkbox",
  date: "date",
  dateTime: "date",
  multipleAttachments: "media",
  phoneNumber: "singleLineText",
  rating: "number",
  duration: "singleLineText",
  barcode: "singleLineText",
  singleCollaborator: "singleLineText",
  multipleCollaborators: "singleLineText",
  multipleRecordLinks: "singleLineText",
  formula: "formula",
  rollup: "rollup",
  lookup: "lookup",
  count: "count",
  createdTime: "createdTime",
  lastModifiedTime: "lastModifiedTime",
  autoNumber: "autoNumber",
  createdBy: "singleLineText",
  lastModifiedBy: "singleLineText",
  button: "singleLineText",
  externalSyncSource: "singleLineText",
  aiText: "multilineText",
};

const HERD_FIELD_TYPES = [
  "singleLineText",
  "multilineText",
  "number",
  "singleSelect",
  "multiSelect",
  "checkbox",
  "date",
  "url",
  "email",
  "currency",
  "percent",
  "media",
  "formula",
  "rollup",
  "lookup",
  "count",
  "createdTime",
  "lastModifiedTime",
  "autoNumber",
];

// ─── Types ──────────────────────────────────────────────────────

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: Record<string, unknown>;
}

interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  fields: AirtableField[];
  primaryFieldId: string;
}

interface FieldMapping {
  airtableFieldId: string;
  airtableFieldName: string;
  airtableFieldType: string;
  herdFieldType: string;
  herdFieldName: string;
  options?: Record<string, unknown>;
  skip: boolean;
}

type Step = "select-base" | "select-table" | "field-mapping" | "importing" | "complete";

interface AirtableImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

// ─── Helper to map options ──────────────────────────────────────

function mapFieldOptions(
  field: AirtableField
): Record<string, unknown> | undefined {
  switch (field.type) {
    case "number":
      return { precision: (field.options?.precision as number) ?? 0 };
    case "currency":
      return {
        symbol: (field.options?.symbol as string) ?? "$",
        precision: (field.options?.precision as number) ?? 2,
      };
    case "percent":
      return { precision: (field.options?.precision as number) ?? 1 };
    case "rating":
      return { precision: 0 };
    case "singleSelect":
    case "multipleSelects": {
      const choices = (
        field.options?.choices as { id: string; name: string; color?: string }[]
      )?.map((c) => ({ id: c.id, name: c.name, color: c.color || "zinc" }));
      return choices ? { choices } : undefined;
    }
    default:
      return undefined;
  }
}

// ─── Component ──────────────────────────────────────────────────

export function AirtableImportModal({
  open,
  onOpenChange,
  onComplete,
}: AirtableImportModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select-base");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [bases, setBases] = useState<AirtableBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<AirtableBase | null>(null);

  // Step 2
  const [tables, setTables] = useState<AirtableTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<AirtableTable | null>(null);

  // Step 3
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  // Step 4
  const [importedTableId, setImportedTableId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({
    recordCount: 0,
    status: "PROCESSING",
    errorMessage: null as string | null,
  });
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("select-base");
      setBases([]);
      setSelectedBase(null);
      setTables([]);
      setSelectedTable(null);
      setFieldMappings([]);
      setImportedTableId(null);
      setImportProgress({ recordCount: 0, status: "PROCESSING", errorMessage: null });
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [open]);

  // Step 1: Fetch bases
  useEffect(() => {
    if (open && step === "select-base" && bases.length === 0) {
      setLoading(true);
      fetch("/api/integrations/airtable/bases")
        .then((r) => r.json())
        .then((json) => {
          if (json.data) setBases(json.data);
          else toast.error(json.error || "Failed to load bases");
        })
        .catch(() => toast.error("Failed to connect to Airtable"))
        .finally(() => setLoading(false));
    }
  }, [open, step, bases.length]);

  // Step 2: Fetch tables for selected base
  const fetchTables = useCallback(async (baseId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/airtable/bases/${baseId}/tables`
      );
      const json = await res.json();
      if (json.data) {
        setTables(json.data);
      } else {
        toast.error(json.error || "Failed to load tables");
      }
    } catch {
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  }, []);

  // Build field mappings from selected table
  const buildFieldMappings = useCallback((table: AirtableTable) => {
    const mappings: FieldMapping[] = table.fields.map((field) => ({
      airtableFieldId: field.id,
      airtableFieldName: field.name,
      airtableFieldType: field.type,
      herdFieldType: AIRTABLE_TO_HERD_TYPE[field.type] || "singleLineText",
      herdFieldName: field.name,
      options: mapFieldOptions(field),
      skip: false,
    }));
    setFieldMappings(mappings);
  }, []);

  // Step navigation
  const handleSelectBase = useCallback(
    (base: AirtableBase) => {
      setSelectedBase(base);
      fetchTables(base.id);
      setStep("select-table");
    },
    [fetchTables]
  );

  const handleSelectTable = useCallback(
    (table: AirtableTable) => {
      setSelectedTable(table);
      buildFieldMappings(table);
      setStep("field-mapping");
    },
    [buildFieldMappings]
  );

  const handleUpdateMapping = useCallback(
    (index: number, updates: Partial<FieldMapping>) => {
      setFieldMappings((prev) =>
        prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
      );
    },
    []
  );

  // Start import
  const handleImport = useCallback(async () => {
    if (!selectedBase || !selectedTable) return;

    setStep("importing");
    setLoading(true);

    try {
      const res = await fetch("/api/integrations/airtable/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseId: selectedBase.id,
          tableId: selectedTable.id,
          tableName: selectedTable.name,
          fieldMappings: fieldMappings.map((m) => ({
            airtableFieldId: m.airtableFieldId,
            airtableFieldName: m.airtableFieldName,
            airtableFieldType: m.airtableFieldType,
            herdFieldType: m.herdFieldType,
            herdFieldName: m.herdFieldName,
            options: m.options,
            skip: m.skip,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Import failed");
        setStep("field-mapping");
        setLoading(false);
        return;
      }

      const tableId = json.data.tableId;
      setImportedTableId(tableId);

      // Poll for progress
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/tables/${tableId}`
          );
          const statusJson = await statusRes.json();
          if (statusJson.data) {
            const { status, recordCount, errorMessage } = statusJson.data;
            setImportProgress({ status, recordCount, errorMessage });

            if (status !== "PROCESSING") {
              if (pollRef.current) clearInterval(pollRef.current);
              setLoading(false);
              setStep("complete");
            }
          }
        } catch {
          // Continue polling
        }
      }, 2000);
    } catch {
      toast.error("Failed to start import");
      setStep("field-mapping");
      setLoading(false);
    }
  }, [selectedBase, selectedTable, fieldMappings]);

  const activeFieldCount = fieldMappings.filter((m) => !m.skip).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading || step === "complete") onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Import from Airtable
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className={step === "select-base" ? "text-foreground font-medium" : ""}>
            1. Base
          </span>
          <span>&rarr;</span>
          <span className={step === "select-table" ? "text-foreground font-medium" : ""}>
            2. Table
          </span>
          <span>&rarr;</span>
          <span className={step === "field-mapping" ? "text-foreground font-medium" : ""}>
            3. Fields
          </span>
          <span>&rarr;</span>
          <span className={step === "importing" || step === "complete" ? "text-foreground font-medium" : ""}>
            4. Import
          </span>
        </div>

        {/* Step 1: Select Base */}
        {step === "select-base" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select an Airtable base to import from.
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading bases...
                </span>
              </div>
            ) : bases.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No bases found. Make sure your Airtable token has access to at
                least one base.
              </div>
            ) : (
              <div className="grid gap-2">
                {bases.map((base) => (
                  <button
                    key={base.id}
                    onClick={() => handleSelectBase(base)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                  >
                    <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {base.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {base.permissionLevel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Table */}
        {step === "select-table" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("select-base");
                  setTables([]);
                  setSelectedTable(null);
                }}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Badge variant="outline" className="text-xs">
                {selectedBase?.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a table to import.
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading tables...
                </span>
              </div>
            ) : (
              <div className="grid gap-2">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                  >
                    <Table2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {table.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {table.fields.length} fields
                        {table.description && ` — ${table.description}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Field Mapping */}
        {step === "field-mapping" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("select-table");
                  setSelectedTable(null);
                  setFieldMappings([]);
                }}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Badge variant="outline" className="text-xs">
                {selectedBase?.name}
              </Badge>
              <span className="text-muted-foreground text-xs">&rarr;</span>
              <Badge variant="outline" className="text-xs">
                {selectedTable?.name}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Review field mappings. Adjust types, rename fields, or skip fields
              you don&apos;t need.
            </p>

            {/* Field mapping table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_140px_1fr_60px] gap-0 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                <div className="px-3 py-2">Airtable Field</div>
                <div className="px-3 py-2">HERD Type</div>
                <div className="px-3 py-2">HERD Name</div>
                <div className="px-3 py-2 text-center">Skip</div>
              </div>
              <div className="max-h-[45vh] overflow-y-auto divide-y">
                {fieldMappings.map((mapping, idx) => (
                  <div
                    key={mapping.airtableFieldId}
                    className={`grid grid-cols-[1fr_140px_1fr_60px] gap-0 items-center ${
                      mapping.skip ? "opacity-40" : ""
                    }`}
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm truncate">{mapping.airtableFieldName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {mapping.airtableFieldType}
                      </p>
                    </div>
                    <div className="px-2 py-1">
                      <Select
                        value={mapping.herdFieldType}
                        onValueChange={(val) => {
                          if (val) handleUpdateMapping(idx, { herdFieldType: val });
                        }}
                        disabled={mapping.skip}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HERD_FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        value={mapping.herdFieldName}
                        onChange={(e) =>
                          handleUpdateMapping(idx, {
                            herdFieldName: e.target.value,
                          })
                        }
                        disabled={mapping.skip}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={mapping.skip}
                        onChange={(e) =>
                          handleUpdateMapping(idx, { skip: e.target.checked })
                        }
                        className="rounded border-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {activeFieldCount} of {fieldMappings.length} fields selected
              </span>
              <Button
                onClick={handleImport}
                disabled={activeFieldCount === 0}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
                Import {selectedTable?.name}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Importing {selectedTable?.name}...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {importProgress.recordCount} records imported
              </p>
            </div>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{
                  width: importProgress.recordCount > 0 ? "60%" : "10%",
                  animation: "pulse 2s infinite",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              This may take a few minutes for large tables. Do not close this
              dialog.
            </p>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            {importProgress.status === "ERROR" ? (
              <>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Import Failed</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    {importProgress.errorMessage || "An unknown error occurred"}
                  </p>
                  {importProgress.recordCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {importProgress.recordCount} records were imported before
                      the error.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  {importedTableId && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        onComplete();
                        router.push(
                          `/admin/organization/knowledge/tables/${importedTableId}`
                        );
                      }}
                    >
                      View Table
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Import Complete</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully imported {importProgress.recordCount} records
                    from {selectedTable?.name}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onComplete();
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onComplete();
                      router.push(
                        `/admin/organization/knowledge/tables/${importedTableId}`
                      );
                    }}
                  >
                    View Table
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
