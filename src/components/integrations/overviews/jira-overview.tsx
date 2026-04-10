"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bug,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function JiraOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [projects, setProjects] = useState<JiraProject[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/integrations/jira/projects")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setProjects(json.data.projects ?? json.data);
        else setError(json.error || "Failed to load projects");
      })
      .catch(() => setError("Network error"));

    fetch("/api/tasks?source=jira&limit=0")
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
      const res = await fetch("/api/integrations/jira/import", {
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
            <Bug className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Jira to import your projects and issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (projects === null && !error) {
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
            <Bug className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Jira.
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
              <Bug className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {projects?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Projects</p>
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
          <CardTitle className="text-sm">Import Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Import all issues from Jira into your workspace. Duplicates are automatically skipped.
          </p>
          <Button
            onClick={handleImport}
            disabled={importing || !projects?.length}
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
                Import All Issues
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

      {/* Projects List */}
      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.slice(0, 8).map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 shrink-0">
                    <Bug className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{proj.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {proj.projectTypeKey}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-600/10 text-blue-600 border-blue-600/20"
                  >
                    {proj.key}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
