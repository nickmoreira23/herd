"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { Money } from "./money";
import { AccountTypeBadge } from "./account-type-badge";
import type { SerializedAccountBalance } from "@/lib/ledger";
import type { ColumnDef } from "@tanstack/react-table";

interface AccountsListClientProps {
  initialData: SerializedAccountBalance[];
}

export function AccountsListClient({ initialData }: AccountsListClientProps) {
  const router = useRouter();

  const columns: ColumnDef<SerializedAccountBalance, unknown>[] = [
    {
      id: "code",
      header: "Code",
      accessorFn: (row) => row.account.code,
      cell: ({ row }) => (
        <Link
          href={`/admin/ledger/accounts/${encodeURIComponent(row.original.account.code)}`}
          className="font-mono text-sm text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.account.code}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => row.account.name,
      cell: ({ row }) => <span>{row.original.account.name}</span>,
    },
    {
      id: "accountType",
      header: "Type",
      accessorFn: (row) => row.account.accountType,
      cell: ({ row }) => <AccountTypeBadge type={row.original.account.accountType} />,
    },
    {
      id: "currency",
      header: "Currency",
      accessorFn: (row) => row.account.currency,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.account.currency}</span>,
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => <Money money={row.original.balance} />,
      sortingFn: (a, b) => {
        const av = BigInt(a.original.balance.amountCents);
        const bv = BigInt(b.original.balance.amountCents);
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      },
    },
    {
      id: "lineCount",
      header: "Lines",
      accessorFn: (row) => row.lineCount,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.lineCount}</span>,
    },
  ];

  // BlockListPage's FilterDef uses `key` + optional `filterFn`. Our nested
  // `account.accountType` / `account.currency` requires custom filterFn.
  const filters: FilterDef<SerializedAccountBalance>[] = [
    {
      key: "accountType",
      label: "All Types",
      options: [
        { label: "Asset", value: "ASSET" },
        { label: "Liability", value: "LIABILITY" },
        { label: "Revenue", value: "REVENUE" },
        { label: "Expense", value: "EXPENSE" },
        { label: "Equity", value: "EQUITY" },
      ],
      filterFn: (row, value) => row.account.accountType === value,
    },
    {
      key: "currency",
      label: "All Currencies",
      options: [
        { label: "BRL", value: "BRL" },
        { label: "USD", value: "USD" },
      ],
      filterFn: (row, value) => row.account.currency === value,
    },
  ];

  return (
    <BlockListPage<SerializedAccountBalance>
      blockName="ledger"
      title="Plano de Contas"
      description="Contas estruturais da plataforma e seus saldos atuais."
      data={initialData}
      getId={(row) => row.account.id}
      columns={columns}
      onRowClick={(row) =>
        router.push(`/admin/ledger/accounts/${encodeURIComponent(row.account.code)}`)
      }
      searchPlaceholder="Buscar por código ou nome..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          row.account.code.toLowerCase().includes(q) ||
          row.account.name.toLowerCase().includes(q)
        );
      }}
      filters={filters}
      emptyIcon={Receipt}
      emptyTitle="Nenhuma conta cadastrada"
      emptyDescription="Execute o seed do plano de contas: npm run db:seed:ledger"
    />
  );
}
