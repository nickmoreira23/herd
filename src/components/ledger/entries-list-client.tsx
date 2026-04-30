"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { SourceKindBadge } from "./source-kind-badge";
import type { SerializedRecentEntry } from "@/lib/ledger";
import type { ColumnDef } from "@tanstack/react-table";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/i18n/format-date";

interface EntriesListClientProps {
  initialData: SerializedRecentEntry[];
  locale: Locale;
}

export function EntriesListClient({ initialData, locale }: EntriesListClientProps) {
  const router = useRouter();
  const t = useT();

  const columns: ColumnDef<SerializedRecentEntry, unknown>[] = [
    {
      id: "postedAt",
      header: t("ledger.entry.detail.posted_at"),
      accessorFn: (row) => row.postedAt,
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {formatDate(new Date(row.original.postedAt), locale, "dateTime")}
        </span>
      ),
      sortingFn: (a, b) => {
        const av = new Date(a.original.postedAt).getTime();
        const bv = new Date(b.original.postedAt).getTime();
        return av - bv;
      },
    },
    {
      id: "sourceKind",
      header: t("ledger.entry.detail.source"),
      accessorFn: (row) => row.sourceKind,
      cell: ({ row }) => <SourceKindBadge kind={row.original.sourceKind} />,
    },
    {
      id: "description",
      header: t("ledger.entry.detail.description"),
      accessorFn: (row) => row.description ?? "",
      cell: ({ row }) =>
        row.original.description ? (
          <span className="text-sm">{row.original.description}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">—</span>
        ),
    },
    {
      id: "lineCount",
      header: t("ledger.entry.detail.lines_title"),
      accessorFn: (row) => row.lineCount,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.lineCount}</span>
      ),
    },
    {
      id: "id",
      header: t("ledger.statement.column.entry"),
      accessorFn: (row) => row.id,
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground font-mono">
          {row.original.id.slice(0, 8)}…
        </code>
      ),
    },
  ];

  const filters: FilterDef<SerializedRecentEntry>[] = [
    {
      key: "sourceKind",
      label: t("ledger.entry.detail.source"),
      options: [
        { label: t("ledger.source_kind.transaction"), value: "TRANSACTION" },
        { label: t("ledger.source_kind.commission"), value: "COMMISSION" },
        { label: t("ledger.source_kind.refund"), value: "REFUND" },
        {
          label: t("ledger.source_kind.manual_adjustment"),
          value: "MANUAL_ADJUSTMENT",
        },
        { label: t("ledger.source_kind.seed"), value: "SEED" },
        { label: t("ledger.source_kind.reversal"), value: "REVERSAL" },
      ],
      filterFn: (row, value) => row.sourceKind === value,
    },
  ];

  return (
    <BlockListPage<SerializedRecentEntry>
      blockName="ledger-entries"
      title={t("ledger.entries.list.title")}
      description={t("ledger.entries.list.description")}
      data={initialData}
      getId={(row) => row.id}
      columns={columns}
      onRowClick={(row) => router.push(`/admin/ledger/entries/${row.id}`)}
      searchPlaceholder={t("ledger.accounts.list.search_placeholder")}
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          (row.description?.toLowerCase().includes(q) ?? false) ||
          row.sourceId.toLowerCase().includes(q) ||
          row.id.toLowerCase().includes(q)
        );
      }}
      filters={filters}
      emptyIcon={FileText}
      emptyTitle={t("ledger.entries.list.empty_state")}
      emptyDescription=""
    />
  );
}
