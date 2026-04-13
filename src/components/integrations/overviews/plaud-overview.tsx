"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  Clock,
  Tag,
  Download,
  CheckCircle2,
  Loader2,
  FileAudio,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface PlaudRecording {
  id: string;
  filename: string;
  duration: number;
  start_time: number;
  is_trans: boolean;
  is_summary: boolean;
  keywords: string[];
}

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// ─── Component ───────────────────────────────────────────────────

export default function PlaudOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [recordings, setRecordings] = useState<PlaudRecording[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/integrations/plaud/recordings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setRecordings(json.data);
        else setError(json.error || "Failed to load recordings");
      })
      .catch(() => setError("Network error"));

    // Check how many are already imported
    fetch("/api/audios?sourceIntegration=plaud&countOnly=true")
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

  const handleImportAll = async () => {
    if (!recordings || recordings.length === 0) return;
    setImporting(true);
    setImportResult(null);

    const allIds = recordings.map((r) => r.id);
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // Process in batches of 5
    for (let i = 0; i < allIds.length; i += 5) {
      const batch = allIds.slice(i, i + 5);
      try {
        const res = await fetch("/api/integrations/plaud/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileIds: batch }),
        });
        const json = await res.json();
        if (json.data) {
          totalImported += json.data.imported;
          totalSkipped += json.data.skipped;
          totalFailed += json.data.failed;
          if (json.data.errors) allErrors.push(...json.data.errors);
        }
      } catch {
        totalFailed += batch.length;
        allErrors.push(`Batch starting at index ${i}: Network error`);
      }
    }

    setImportResult({
      imported: totalImported,
      skipped: totalSkipped,
      failed: totalFailed,
      errors: allErrors,
    });
    setImporting(false);

    // Refresh imported count
    fetch("/api/audios?sourceIntegration=plaud&countOnly=true")
      .then((r) => r.json())
      .then((json) => {
        if (typeof json.data?.count === "number") setImportedCount(json.data.count);
      })
      .catch(() => {});
  };

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Mic className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Plaud to import your recordings, transcriptions, and summaries.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (recordings === null && !error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
            <Mic className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Plaud.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const totalDuration = recordings?.reduce((sum, r) => sum + (r.duration || 0), 0) ?? 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const transcribedCount = recordings?.filter((r) => r.is_trans).length ?? 0;

  const formatDate = (epoch: number) => {
    if (!epoch) return "—";
    const d = new Date(epoch * 1000);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Mic className="h-4 w-4 text-violet-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {recordings?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Recordings</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Clock className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">{durationStr}</p>
                <p className="text-[10px] text-muted-foreground">Total Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <FileAudio className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">{transcribedCount}</p>
                <p className="text-[10px] text-muted-foreground">Transcribed</p>
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
          <CardTitle className="text-sm">Import Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Import recordings from Plaud into your knowledge base. Audio files, transcriptions,
            and summaries will be saved. Duplicates are automatically skipped.
          </p>
          <Button
            onClick={handleImportAll}
            disabled={importing || !recordings?.length}
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
                Import All ({recordings?.length ?? 0} recordings)
              </>
            )}
          </Button>
          {importResult && (
            <div className="mt-3 flex items-start gap-2 text-sm bg-emerald-500/10 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-600 dark:text-emerald-400">
                  {importResult.imported} imported, {importResult.skipped} skipped
                  {importResult.failed > 0 && `, ${importResult.failed} failed`}
                </p>
                {importResult.errors.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {importResult.errors.slice(0, 3).join("; ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Recordings */}
      {recordings && recordings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Recordings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recordings.slice(0, 8).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                    <Mic className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.filename}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{formatDuration(rec.duration)}</span>
                      <span>·</span>
                      <span>{formatDate(rec.start_time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rec.is_trans && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        Transcribed
                      </Badge>
                    )}
                    {rec.is_summary && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"
                      >
                        Summary
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords */}
      {recordings && recordings.some((r) => r.keywords?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(recordings.flatMap((r) => r.keywords || []))].slice(0, 30).map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
