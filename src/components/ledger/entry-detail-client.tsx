"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "./money";
import { AccountTypeBadge } from "./account-type-badge";
import type { SerializedEntryDetails } from "@/lib/ledger";

interface EntryDetailClientProps {
  entry: SerializedEntryDetails;
}

export function EntryDetailClient({ entry }: EntryDetailClientProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Journal Entry</h1>
        <code className="text-sm text-muted-foreground font-mono">{entry.id}</code>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Source kind">
            <Badge variant="outline">{entry.sourceKind}</Badge>
          </DetailRow>
          <DetailRow label="Source ID">
            <code className="text-xs font-mono">{entry.sourceId}</code>
          </DetailRow>
          <DetailRow label="Posted at">
            <span className="font-mono text-sm">
              {format(new Date(entry.postedAt), "yyyy-MM-dd HH:mm:ss")}
            </span>
          </DetailRow>
          <DetailRow label="Created at">
            <span className="font-mono text-sm text-muted-foreground">
              {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm:ss")}
            </span>
          </DetailRow>
          {entry.description && (
            <DetailRow label="Descrição">
              <span className="text-sm">{entry.description}</span>
            </DetailRow>
          )}
          {entry.idempotencyKey && (
            <DetailRow label="Idempotency key">
              <code className="text-xs font-mono">{entry.idempotencyKey}</code>
            </DetailRow>
          )}
          {Object.keys(entry.metadata).length > 0 && (
            <DetailRow label="Metadata">
              <pre className="text-xs bg-muted p-2 rounded font-mono whitespace-pre-wrap">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            </DetailRow>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines ({entry.lines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Direction</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Link
                      href={`/admin/ledger/accounts/${encodeURIComponent(line.account.code)}`}
                      className="font-mono text-sm hover:underline"
                    >
                      {line.account.code}
                    </Link>
                    <p className="text-xs text-muted-foreground">{line.account.name}</p>
                  </TableCell>
                  <TableCell>
                    <AccountTypeBadge type={line.account.accountType} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={line.direction === "D" ? "default" : "secondary"} className="font-mono">
                      {line.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Money money={line.amount} tone="muted" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
