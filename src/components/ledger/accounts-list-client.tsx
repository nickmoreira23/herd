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
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";

interface AccountsListClientProps {
  initialData: SerializedAccountBalance[];
  locale: Locale;
}

export function AccountsListClient({ initialData, locale }: AccountsListClientProps) {
  const router = useRouter();
  const t = useT();

  const columns: ColumnDef<SerializedAccountBalance, unknown>[] = [
    {
      id: "code",
      header: t("ledger.accounts.column.code"),
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
      header: t("ledger.accounts.column.name"),
      accessorFn: (row) => row.account.name,
      cell: ({ row }) => <span>{row.original.account.name}</span>,
    },
    {
      id: "accountType",
      header: t("ledger.accounts.column.type"),
      accessorFn: (row) => row.account.accountType,
      cell: ({ row }) => <AccountTypeBadge type={row.original.account.accountType} />,
    },
    {
      id: "currency",
      header: t("ledger.accounts.column.currency"),
      accessorFn: (row) => row.account.currency,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.account.currency}</span>,
    },
    {
      id: "balance",
      header: t("ledger.accounts.column.balance"),
      cell: ({ row }) => <Money money={row.original.balance} locale={locale} />,
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
      header: t("ledger.statement.column.entry"),
      accessorFn: (row) => row.lineCount,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.lineCount}</span>,
    },
  ];

  // BlockListPage's FilterDef uses `key` + optional `filterFn`. Our nested
  // `account.accountType` / `account.currency` requires custom filterFn.
  const filters: FilterDef<SerializedAccountBalance>[] = [
    {
      key: "accountType",
      label: t("ledger.accounts.column.type"),
      options: [
        { label: t("ledger.account_type.asset"), value: "ASSET" },
        { label: t("ledger.account_type.liability"), value: "LIABILITY" },
        { label: t("ledger.account_type.revenue"), value: "REVENUE" },
        { label: t("ledger.account_type.expense"), value: "EXPENSE" },
        { label: t("ledger.account_type.equity"), value: "EQUITY" },
      ],
      filterFn: (row, value) => row.account.accountType === value,
    },
    {
      key: "currency",
      label: t("ledger.accounts.column.currency"),
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
      title={t("ledger.accounts.list.title")}
      description={t("ledger.accounts.list.description")}
      data={initialData}
      getId={(row) => row.account.id}
      columns={columns}
      onRowClick={(row) =>
        router.push(`/admin/ledger/accounts/${encodeURIComponent(row.account.code)}`)
      }
      searchPlaceholder={t("ledger.accounts.list.search_placeholder")}
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          row.account.code.toLowerCase().includes(q) ||
          row.account.name.toLowerCase().includes(q)
        );
      }}
      filters={filters}
      emptyIcon={Receipt}
      emptyTitle={t("ledger.accounts.list.empty_state")}
      emptyDescription="npm run db:seed:ledger"
    />
  );
}
