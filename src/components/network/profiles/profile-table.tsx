"use client"

import Link from "next/link"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
type ProfileStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "TERMINATED"

interface ProfileRow {
  id: string
  firstName: string
  lastName: string
  email: string
  networkType: "INTERNAL" | "EXTERNAL"
  status: ProfileStatus
  avatarUrl?: string | null
  profileType: { displayName: string; color?: string | null } | null
  profileRanks?: { rankTier: { displayName: string; color?: string | null } }[]
}

const columnHelper = createColumnHelper<ProfileRow>()

const STATUS_VARIANT: Record<ProfileStatus, "default" | "outline" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  PENDING: "outline",
  SUSPENDED: "secondary",
  TERMINATED: "destructive",
}

export function ProfileTable({ data }: { data: ProfileRow[] }) {
  const columns: ColumnDef<ProfileRow, any>[] = [
    columnHelper.display({
      id: "name",
      header: "Name",
      cell: (info) => {
        const row = info.row.original
        return (
          <div className="flex items-center gap-3">
            {row.avatarUrl ? (
              <img
                src={row.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ backgroundColor: row.profileType?.color ?? "#6366f1" }}
              >
                {row.firstName[0]}
                {row.lastName[0]}
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={`/admin/network/profiles/${row.id}`}
                className="text-sm font-medium hover:underline block"
              >
                {row.firstName} {row.lastName}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{row.email}</p>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor("networkType", {
      header: "Network",
      cell: (info) => (
        <Badge variant={info.getValue() === "INTERNAL" ? "secondary" : "default"}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "type",
      header: "Profile Type",
      cell: (info) => {
        const pt = info.row.original.profileType
        return pt ? (
          <div className="flex items-center gap-1.5">
            {pt.color && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pt.color }}
              />
            )}
            <span className="text-sm">{pt.displayName}</span>
          </div>
        ) : null
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const val = info.getValue() as ProfileStatus
        return (
          <Badge variant={STATUS_VARIANT[val]}>
            {val}
          </Badge>
        )
      },
    }),
    columnHelper.display({
      id: "rank",
      header: "Rank",
      cell: (info) => {
        const rank = info.row.original.profileRanks?.[0]?.rankTier
        if (!rank) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span
            className="text-xs font-medium"
            style={{ color: rank.color ?? undefined }}
          >
            {rank.displayName}
          </span>
        )
      },
    }),
  ]

  return (
    <DataTable
      data={data}
      columns={columns}
      searchable
      searchPlaceholder="Search profiles..."
    />
  )
}
