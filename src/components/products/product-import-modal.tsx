"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Download, X } from "lucide-react";
import type { BulkImportRow } from "@/lib/validators/product";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: BulkImportRow[]) => void;
  onComplete?: () => void;
}

const CHUNK_SIZE = 200;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProductImportModal({ open, onOpenChange, onImport, onComplete }: ImportModalProps) {
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, created: 0, skipped: 0 });
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setErrors(["File must have a header row and at least one data row"]);
      return;
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredCols = ["name", "sku", "category", "retailprice", "costofgoods"];
    const missing = requiredCols.filter((c) => !header.includes(c));
    if (missing.length) {
      setErrors([`Missing columns: ${missing.join(", ")}`]);
      return;
    }

    const parsed: BulkImportRow[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      header.forEach((h, idx) => (row[h] = cols[idx] || ""));

      const category = row.category?.toUpperCase() || "SUPPLEMENT";
      if (!["SUPPLEMENT", "APPAREL", "ACCESSORY"].includes(category)) {
        errs.push(`Row ${i + 1}: invalid category "${row.category}"`);
        continue;
      }

      const retailPrice = row.retailprice ? parseFloat(row.retailprice) : 0;
      const costOfGoods = row.costofgoods ? parseFloat(row.costofgoods) : 0;

      if ((row.retailprice && isNaN(retailPrice)) || (row.costofgoods && isNaN(costOfGoods))) {
        errs.push(`Row ${i + 1}: invalid price values`);
        continue;
      }

      const redemptionType = row.redemptiontype || row["redemption type"] || undefined;
      const validRedemptionTypes = ["Members Store", "Members Rate"];
      const normalizedRedemptionType = redemptionType && validRedemptionTypes.includes(redemptionType)
        ? (redemptionType as "Members Store" | "Members Rate")
        : undefined;

      parsed.push({
        name: row.name,
        sku: row.sku,
        category: category as "SUPPLEMENT" | "APPAREL" | "ACCESSORY",
        subCategory: row.subcategory || undefined,
        redemptionType: normalizedRedemptionType,
        retailPrice,
        costOfGoods,
      });
    }

    setRows(parsed);
    setErrors(errs);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

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
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setRows([]);
    setErrors([]);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImport() {
    setImporting(true);
    const total = rows.length;
    let sent = 0;
    let created = 0;
    let skipped = 0;

    setProgress({ sent: 0, total, created: 0, skipped: 0 });

    try {
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const res = await fetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });

        if (!res.ok) {
          const json = await res.json();
          setErrors((prev) => [...prev, `Chunk ${Math.floor(i / CHUNK_SIZE) + 1} failed: ${json.error || "Unknown error"}`]);
        } else {
          const json = await res.json();
          created += json.data.created;
          skipped += json.data.skipped;
        }

        sent += chunk.length;
        setProgress({ sent, total, created, skipped });
      }

      onComplete?.();
      onOpenChange(false);
      handleClear();
    } catch {
      setErrors((prev) => [...prev, "Import failed unexpectedly"]);
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadTemplate() {
    window.open("/api/products/template", "_blank");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) handleClear();
      }}
    >
      <DialogContent className={cn(
        "max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden transition-[max-width]",
        rows.length > 0 ? "sm:max-w-3xl" : "sm:max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 min-h-0 flex-1">
          {/* Drop zone */}
          {!fileName ? (
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
                <p className="text-sm font-medium">
                  Drag & drop your file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse. Supports CSV files.
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                {rows.length > 0 && (
                  <Badge variant="secondary">{rows.length} rows</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleClear}
              >
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
            Download template CSV
          </button>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-sm text-red-700 dark:text-red-400 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <div className="py-4 px-3 space-y-1">
                {errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">SKU</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left whitespace-nowrap">Subcategory</th>
                    <th className="p-2 text-left">Redemption</th>
                    <th className="p-2 text-right">Retail</th>
                    <th className="p-2 text-right">COGS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2 font-mono">{row.sku}</td>
                      <td className="p-2">{row.category}</td>
                      <td className="p-2">{row.subCategory || "—"}</td>
                      <td className="p-2">{row.redemptionType || "Members Store"}</td>
                      <td className="p-2 text-right">${row.retailPrice.toFixed(2)}</td>
                      <td className="p-2 text-right">${row.costOfGoods.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <p className="p-2 text-muted-foreground">
                  ...and {rows.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>

        {importing && (
          <div className="space-y-2 px-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.sent} of {progress.total} rows processed</span>
              <span>{progress.created} created, {progress.skipped} skipped</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={rows.length === 0 || importing}
          >
            {importing ? "Importing..." : `Import ${rows.length} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
