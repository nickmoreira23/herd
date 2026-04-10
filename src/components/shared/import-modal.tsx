"use client";

import { useState, useRef, useCallback } from "react";
import type { EntityConfig } from "@/lib/import-export/entity-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityConfig: EntityConfig;
  onComplete?: () => void;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ImportResult {
  updated: number;
  notFound: string[];
  errors: Array<{ identifier: string; error: string }>;
}

export function ImportModal({
  open,
  onOpenChange,
  entityConfig,
  onComplete,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setDetectedColumns([]);
    setParseErrors([]);
    setImporting(false);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const parseFile = useCallback(
    async (f: File) => {
      setFile(f);
      setResult(null);
      setParseErrors([]);

      try {
        const XLSX = await import("xlsx");
        const buffer = await f.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setParseErrors(["No worksheet found in file"]);
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (raw.length === 0) {
          setParseErrors(["No data found in file"]);
          return;
        }

        // Read headers
        const headers: string[] = (raw[0] || []).map((h) => String(h ?? "").trim());

        // Check for identifier column
        const identifierFound = headers.some(
          (h) =>
            h.toLowerCase() === entityConfig.identifierField.toLowerCase() ||
            h.toLowerCase() === entityConfig.identifierLabel.toLowerCase()
        );

        if (!identifierFound) {
          setParseErrors([
            `Missing required column: "${entityConfig.identifierLabel}". Your spreadsheet must include this column to identify which records to update.`,
          ]);
          return;
        }

        // Detect which data columns are present
        const knownLabels = new Map<string, string>();
        for (const col of entityConfig.columns) {
          knownLabels.set(col.label.toLowerCase(), col.label);
          knownLabels.set(col.key.toLowerCase(), col.label);
        }

        const detected: string[] = [];
        for (const h of headers) {
          const lower = h.toLowerCase();
          if (
            lower === entityConfig.identifierField.toLowerCase() ||
            lower === entityConfig.identifierLabel.toLowerCase()
          ) {
            continue;
          }
          const match = knownLabels.get(lower);
          if (match) detected.push(match);
        }
        setDetectedColumns(detected);

        // Preview rows
        const rows: string[][] = [];
        const totalRows = raw.length - 1; // exclude header
        for (let i = 1; i < raw.length && rows.length < 10; i++) {
          const rowData = raw[i] as unknown[];
          const cells: string[] = [];
          for (let j = 0; j < headers.length; j++) {
            cells.push(String(rowData[j] ?? ""));
          }
          rows.push(cells);
        }

        setPreview({ headers, rows, totalRows });
      } catch {
        setParseErrors(["Failed to parse file. Please ensure it is a valid .xlsx, .csv, or .numbers file."]);
      }
    },
    [entityConfig]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${entityConfig.apiBasePath}/import`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Import failed");
        setParseErrors([json.error || "Import failed"]);
        return;
      }

      const importResult: ImportResult = json.data;
      setResult(importResult);

      if (importResult.updated > 0) {
        toast.success(`Updated ${importResult.updated} ${entityConfig.displayName.toLowerCase()}`);
        onComplete?.();
      }

      if (importResult.notFound.length > 0) {
        toast.warning(`${importResult.notFound.length} ${entityConfig.identifierLabel.toLowerCase()}(s) not found`);
      }
    } catch {
      toast.error("Import failed unexpectedly");
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadTemplate() {
    const allColumns = entityConfig.columns.map((c) => c.key).join(",");
    window.open(
      `${entityConfig.apiBasePath}/export?columns=${encodeURIComponent(allColumns)}`,
      "_blank"
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden transition-[max-width]",
          preview ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>Import {entityConfig.displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 min-h-0 flex-1">
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Upload a spreadsheet file with a{" "}
            <span className="font-medium text-foreground">
              {entityConfig.identifierLabel}
            </span>{" "}
            column to identify records. Only the columns present in the file will
            be updated.
          </p>

          {/* Drop zone / file info */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse. Supports .xlsx, .csv, and .numbers files.
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv,.numbers"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
                {preview && (
                  <Badge variant="secondary">{preview.totalRows} rows</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={reset} className="h-6 w-6">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Download template */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
            Download template spreadsheet
          </button>

          {/* Detected columns */}
          {detectedColumns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Columns to update:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detectedColumns.map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-sm text-red-700 dark:text-red-400 p-3 space-y-1">
              {parseErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {preview && preview.rows.length > 0 && (
            <div className="max-h-48 overflow-auto rounded border text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {preview.headers.map((h, i) => (
                      <th key={i} className="p-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 whitespace-nowrap max-w-[200px] truncate">
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.totalRows > 10 && (
                <p className="p-2 text-muted-foreground">
                  ...and {preview.totalRows - 10} more
                </p>
              )}
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-2 rounded border p-3">
              {result.updated > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{result.updated} record(s) updated</span>
                </div>
              )}
              {result.notFound.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {result.notFound.length}{" "}
                      {entityConfig.identifierLabel.toLowerCase()}(s) not found:
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {result.notFound.slice(0, 10).join(", ")}
                    {result.notFound.length > 10 && ` ...and ${result.notFound.length - 10} more`}
                  </p>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.errors.length} error(s)</span>
                  </div>
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-6">
                      {err.identifier}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => { onOpenChange(false); reset(); }}>
              Done
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={!file || !preview || parseErrors.length > 0 || importing}
            >
              {importing
                ? "Importing..."
                : `Import ${preview?.totalRows ?? 0} ${entityConfig.displayName}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
