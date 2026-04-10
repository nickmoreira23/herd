"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  Table2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plug,
  ExternalLink,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableTableSchema {
  id: string;
  name: string;
  description?: string;
  fields: { id: string; name: string; type: string }[];
  primaryFieldId: string;
}

interface ImportedTable {
  id: string;
  name: string;
  sourceId: string | null;
  status: string;
  recordCount: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function AirtableOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [bases, setBases] = useState<AirtableBase[] | null>(null);
  const [basesError, setBasesError] = useState<string | null>(null);
  const [expandedBaseId, setExpandedBaseId] = useState<string | null>(null);
  const [baseSchemas, setBaseSchemas] = useState<
    Record<string, AirtableTableSchema[]>
  >({});
  const [baseSchemaLoading, setBaseSchemaLoading] = useState<
    Record<string, boolean>
  >({});
  const [importedTables, setImportedTables] = useState<
    Map<string, ImportedTable>
  >(new Map());

  // Fetch bases on mount
  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/airtable/bases")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setBases(json.data);
        else setBasesError(json.error || "Failed to load bases");
      })
      .catch(() => setBasesError("Network error"));

    fetch("/api/integrations/airtable/imported")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const map = new Map<string, ImportedTable>();
          for (const t of json.data) {
            if (t.sourceId) map.set(t.sourceId, t);
          }
          setImportedTables(map);
        }
      })
      .catch(() => {});
  }, [isConnected]);

  // Fetch tables for a base when expanded
  const fetchBaseSchema = useCallback(
    (baseId: string) => {
      if (baseSchemas[baseId] || baseSchemaLoading[baseId]) return;

      setBaseSchemaLoading((prev) => ({ ...prev, [baseId]: true }));
      fetch(`/api/integrations/airtable/bases/${baseId}/tables`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setBaseSchemas((prev) => ({ ...prev, [baseId]: json.data }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setBaseSchemaLoading((prev) => ({ ...prev, [baseId]: false }));
        });
    },
    [baseSchemas, baseSchemaLoading]
  );

  const toggleBase = (baseId: string) => {
    if (expandedBaseId === baseId) {
      setExpandedBaseId(null);
    } else {
      setExpandedBaseId(baseId);
      fetchBaseSchema(baseId);
    }
  };

  // Compute summary stats
  const totalTables = Object.values(baseSchemas).reduce(
    (sum, tables) => sum + tables.length,
    0
  );
  const totalFields = Object.values(baseSchemas).reduce(
    (sum, tables) => sum + tables.reduce((s, t) => s + t.fields.length, 0),
    0
  );
  const importedCount = importedTables.size;

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Airtable to see your accessible bases and tables.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (bases === null && !basesError) {
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
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────

  if (basesError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 mb-3">
            <Database className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{basesError}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Airtable.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  const permissionLabel = (level: string) => {
    const labels: Record<string, string> = {
      create: "Creator",
      edit: "Editor",
      comment: "Commenter",
      read: "Read Only",
      none: "No Access",
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Airtable Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {bases?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Bases</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {totalTables > 0 ? totalTables : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Tables</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-500">
                {importedCount}
              </p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {totalFields > 0 ? totalFields : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Fields</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessible Bases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Accessible Bases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bases && bases.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No bases found in your Airtable account.
              </p>
            )}
            {bases?.map((base) => {
              const isExpanded = expandedBaseId === base.id;
              const tables = baseSchemas[base.id];
              const isLoading = baseSchemaLoading[base.id];

              return (
                <div key={base.id} className="rounded-lg border">
                  {/* Base Row */}
                  <button
                    onClick={() => toggleBase(base.id)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                      <Database className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {base.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/50"
                        >
                          {permissionLabel(base.permissionLevel)}
                        </Badge>
                        {tables && (
                          <span className="text-[10px] text-muted-foreground">
                            {tables.length}{" "}
                            {tables.length === 1 ? "table" : "tables"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Expanded Tables */}
                  {isExpanded && (
                    <div className="border-t px-3 pb-3">
                      {isLoading && (
                        <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading tables...
                        </div>
                      )}
                      {tables && tables.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No tables in this base.
                        </p>
                      )}
                      {tables?.map((table) => {
                        const sourceId = `${base.id}/${table.id}`;
                        const imported = importedTables.get(sourceId);

                        return (
                          <div
                            key={table.id}
                            className="flex items-center gap-3 py-2.5 px-1 border-b last:border-b-0"
                          >
                            <Table2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{table.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {table.fields.length}{" "}
                                {table.fields.length === 1 ? "field" : "fields"}
                              </p>
                            </div>
                            {imported ? (
                              <Link
                                href={`/admin/organization/knowledge/tables/${imported.id}`}
                                className="inline-flex items-center gap-1"
                              >
                                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                  Imported
                                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                </Badge>
                              </Link>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-muted/50 text-muted-foreground"
                              >
                                Available
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
