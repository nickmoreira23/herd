"use client";

import { useState, useCallback } from "react";
import type { EntityConfig } from "@/lib/import-export/entity-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Lock } from "lucide-react";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityConfig: EntityConfig;
}

export function ExportModal({ open, onOpenChange, entityConfig }: ExportModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(entityConfig.columns.map((c) => c.key))
  );
  const [exporting, setExporting] = useState(false);

  const toggleColumn = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(entityConfig.columns.map((c) => c.key)));
  }, [entityConfig.columns]);

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  async function handleExport() {
    if (selectedKeys.size === 0) return;
    setExporting(true);

    const columnsParam = Array.from(selectedKeys).join(",");
    const url = `${entityConfig.apiBasePath}/export?columns=${encodeURIComponent(columnsParam)}`;

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {entityConfig.displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select columns to include in the export. The{" "}
            <span className="font-medium text-foreground">
              {entityConfig.identifierLabel}
            </span>{" "}
            column is always included.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              onClick={deselectAll}
              className="text-xs text-primary hover:underline"
            >
              Deselect all
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedKeys.size} of {entityConfig.columns.length} selected
            </span>
          </div>

          <ScrollArea className="h-64 rounded-md border">
            <div className="p-3 space-y-1">
              {/* Identifier — always included, locked */}
              <label className="flex items-center gap-2 rounded px-2 py-1.5 bg-muted/50 opacity-70 cursor-default">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded border-gray-300"
                />
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {entityConfig.identifierLabel}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  always included
                </span>
              </label>

              {/* Selectable columns */}
              {entityConfig.columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{col.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {col.type}
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedKeys.size === 0 || exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : `Export ${entityConfig.displayName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
