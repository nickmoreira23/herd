"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutGrid,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface MondayBoard {
  id: string;
  name: string;
  description: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function MondayOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [boards, setBoards] = useState<MondayBoard[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/integrations/monday/boards")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setBoards(json.data.boards ?? json.data);
        else setError(json.error || "Failed to load boards");
      })
      .catch(() => setError("Network error"));

    fetch("/api/tasks?source=monday&limit=0")
      .then((r) => r.json())
      .then((json) => {
        if (typeof json.data?.count === "number") setImportedCount(json.data.count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    fetchData();
  }, [isConnected, fetchData]);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/integrations/monday/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.data) setImportResult(json.data);
    } catch {
      // silent
    } finally {
      setImporting(false);
    }
  };

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Monday to import your boards and items.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (boards === null && !error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-lg border px-4 py-3 text-center">
                  <Skeleton className="h-7 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-14 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 mb-3">
            <LayoutGrid className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Monday.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <LayoutGrid className="h-4 w-4 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {boards?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Boards</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Download className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {importedCount ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Imported</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Import all items from Monday into your workspace. Duplicates are automatically skipped.
          </p>
          <Button
            onClick={handleImport}
            disabled={importing || !boards?.length}
            size="sm"
          >
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Import All Items
              </>
            )}
          </Button>
          {importResult && (
            <div className="mt-3 flex items-start gap-2 text-sm bg-emerald-500/10 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-emerald-600 dark:text-emerald-400">
                {importResult.imported} imported, {importResult.skipped} skipped
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boards List */}
      {boards && boards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Boards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boards.slice(0, 8).map((board) => (
                <div
                  key={board.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                    <LayoutGrid className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{board.name}</p>
                    {board.description && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {board.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
