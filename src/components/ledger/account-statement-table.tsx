"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "./money";
import type { SerializedAccountStatement, SerializedStatementLine } from "@/lib/ledger";

interface AccountStatementTableProps {
  accountCode: string;
  firstPage: SerializedAccountStatement;
}

export function AccountStatementTable({ accountCode, firstPage }: AccountStatementTableProps) {
  const [lines, setLines] = useState<SerializedStatementLine[]>(firstPage.lines);
  const [cursor, setCursor] = useState<string | null>(firstPage.nextCursor);
  const [hasMore, setHasMore] = useState(firstPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ cursor, limit: "50" });
      const res = await fetch(
        `/api/admin/ledger/accounts/${encodeURIComponent(accountCode)}/statement?${params}`,
      );
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = (await res.json()) as { data: SerializedAccountStatement };
      const next = json.data;
      setLines((prev) => [...prev, ...next.lines]);
      setCursor(next.nextCursor);
      setHasMore(next.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more lines");
    } finally {
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma movimentação nesta conta.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Direction</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-mono text-xs">
                {format(new Date(line.postedAt), "yyyy-MM-dd HH:mm")}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{line.sourceKind}</Badge>
              </TableCell>
              <TableCell className="max-w-md truncate text-sm">
                {line.entryDescription ?? <span className="text-muted-foreground italic">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={line.direction === "D" ? "default" : "secondary"} className="font-mono">
                  {line.direction}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Money money={line.amount} tone="muted" />
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/ledger/entries/${line.journalEntryId}`}
                  className="text-xs text-primary hover:underline"
                >
                  Ver
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {error && <p className="text-sm text-negative">{error}</p>}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
