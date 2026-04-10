"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import type { BulkImportRow } from "@/lib/validators/product";

interface CsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: BulkImportRow[]) => void;
}

export function ProductCsvImport({ open, onOpenChange, onImport }: CsvImportProps) {
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setErrors(["CSV must have a header row and at least one data row"]);
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

        const category = row.category?.toUpperCase();
        if (!["SUPPLEMENT", "APPAREL", "ACCESSORY"].includes(category)) {
          errs.push(`Row ${i + 1}: invalid category "${row.category}"`);
          continue;
        }

        const retailPrice = parseFloat(row.retailprice);
        const costOfGoods = parseFloat(row.costofgoods);

        if (isNaN(retailPrice) || isNaN(costOfGoods)) {
          errs.push(`Row ${i + 1}: invalid price values`);
          continue;
        }

        parsed.push({
          name: row.name,
          sku: row.sku,
          category: category as "SUPPLEMENT" | "APPAREL" | "ACCESSORY",
          retailPrice,
          costOfGoods,
        });
      }

      setRows(parsed);
      setErrors(errs);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    try {
      await onImport(rows);
      onOpenChange(false);
      setRows([]);
      setErrors([]);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSV columns: name, sku, category, retailPrice, costOfGoods
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{rows.length} rows ready</Badge>
              </div>
              <div className="max-h-48 overflow-y-auto rounded border text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Category</th>
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
            </div>
          )}
        </div>

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
