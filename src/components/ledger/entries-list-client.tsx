"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { Badge } from "@/components/ui/badge";
import type { SerializedRecentEntry } from "@/lib/ledger";
import type { ColumnDef } from "@tanstack/react-table";

interface EntriesListClientProps {
  initialData: SerializedRecentEntry[];
}

export function EntriesListClient({ initialData }: EntriesListClientProps) {
  const router = useRouter();

  const columns: ColumnDef<SerializedRecentEntry, unknown>[] = [
    {
      id: "postedAt",
      header: "Posted at",
      accessorFn: (row) => row.postedAt,
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {format(new Date(row.original.postedAt), "yyyy-MM-dd HH:mm")}
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
      header: "Source",
      accessorFn: (row) => row.sourceKind,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.sourceKind}
        </Badge>
      ),
    },
    {
      id: "description",
      header: "Description",
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
      header: "Lines",
      accessorFn: (row) => row.lineCount,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.lineCount}</span>
      ),
    },
    {
      id: "id",
      header: "Entry ID",
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
      label: "All Sources",
      options: [
        { label: "Transaction", value: "TRANSACTION" },
        { label: "Commission", value: "COMMISSION" },
        { label: "Refund", value: "REFUND" },
        { label: "Manual Adjustment", value: "MANUAL_ADJUSTMENT" },
        { label: "Seed", value: "SEED" },
        { label: "Reversal", value: "REVERSAL" },
      ],
      filterFn: (row, value) => row.sourceKind === value,
    },
  ];

  return (
    <BlockListPage<SerializedRecentEntry>
      blockName="ledger-entries"
      title="Journal Entries"
      description="As 100 entradas mais recentes do ledger, ordenadas por data de postagem."
      data={initialData}
      getId={(row) => row.id}
      columns={columns}
      onRowClick={(row) => router.push(`/admin/ledger/entries/${row.id}`)}
      searchPlaceholder="Buscar por description, source ID ou ID..."
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
      emptyTitle="Nenhuma entry registrada"
      emptyDescription="O ledger ainda não tem journal entries. Elas aparecerão aqui quando código de domínio começar a postar (Fase 2+)."
    />
  );
}
