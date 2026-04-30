"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "./money";
import { AccountTypeBadge } from "./account-type-badge";
import { SourceKindBadge } from "./source-kind-badge";
import type { SerializedEntryDetails } from "@/lib/ledger";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/i18n/format-date";

interface EntryDetailClientProps {
  entry: SerializedEntryDetails;
  locale: Locale;
}

export function EntryDetailClient({ entry, locale }: EntryDetailClientProps) {
  const t = useT();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("ledger.entry.detail.title")}</h1>
        <code className="text-sm text-muted-foreground font-mono">{entry.id}</code>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("ledger.entry.detail.section_details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label={t("ledger.entry.detail.source")}>
            <SourceKindBadge kind={entry.sourceKind} />
          </DetailRow>
          <DetailRow label={t("ledger.entry.detail.source_id")}>
            <code className="text-xs font-mono">{entry.sourceId}</code>
          </DetailRow>
          <DetailRow label={t("ledger.entry.detail.posted_at")}>
            <span className="font-mono text-sm">
              {formatDate(new Date(entry.postedAt), locale, "dateTime")}
            </span>
          </DetailRow>
          <DetailRow label={t("ledger.entry.detail.created_at")}>
            <span className="font-mono text-sm text-muted-foreground">
              {formatDate(new Date(entry.createdAt), locale, "dateTime")}
            </span>
          </DetailRow>
          {entry.description && (
            <DetailRow label={t("ledger.entry.detail.description")}>
              <span className="text-sm">{entry.description}</span>
            </DetailRow>
          )}
          {entry.idempotencyKey && (
            <DetailRow label={t("ledger.entry.detail.idempotency_key")}>
              <code className="text-xs font-mono">{entry.idempotencyKey}</code>
            </DetailRow>
          )}
          {Object.keys(entry.metadata).length > 0 && (
            <DetailRow label={t("ledger.entry.detail.metadata")}>
              <pre className="text-xs bg-muted p-2 rounded font-mono whitespace-pre-wrap">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            </DetailRow>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("ledger.entry.detail.lines_with_count", { count: entry.lines.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ledger.entry.detail.line.account")}</TableHead>
                <TableHead>{t("ledger.entry.detail.line.type")}</TableHead>
                <TableHead className="text-right">
                  {t("ledger.entry.detail.line.direction")}
                </TableHead>
                <TableHead className="text-right">
                  {t("ledger.entry.detail.line.amount")}
                </TableHead>
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
                    <Money money={line.amount} locale={locale} tone="muted" />
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
