"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { Edit, PowerOff } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProfileTypeRow {
  id: string
  slug: string
  displayName: string
  networkType: "INTERNAL" | "EXTERNAL"
  isActive: boolean
  wizardFields: unknown[]
  canDelete: boolean
  _count: { profiles: number }
  color?: string | null
}

const columnHelper = createColumnHelper<ProfileTypeRow>()

export function ProfileTypeTable({ data }: { data: ProfileTypeRow[] }) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this profile type?")) return
    setActionLoading(id)
    try {
      await fetch(`/api/network/profile-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      })
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleActivate(id: string) {
    setActionLoading(id)
    try {
      await fetch(`/api/network/profile-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  const columns: ColumnDef<ProfileTypeRow, any>[] = [
    columnHelper.accessor("displayName", {
      header: "Name",
      cell: (info) => (
        <div className="flex items-center gap-2">
          {info.row.original.color && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: info.row.original.color }}
            />
          )}
          <Link
            href={`/admin/network/profile-types/${info.row.original.id}`}
            className="font-medium hover:underline"
          >
            {info.getValue()}
          </Link>
        </div>
      ),
    }),
    columnHelper.accessor("networkType", {
      header: "Type",
      cell: (info) => (
        <Badge variant={info.getValue() === "INTERNAL" ? "secondary" : "default"}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("wizardFields", {
      header: "Custom Fields",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {(info.getValue() as unknown[]).length} fields
        </span>
      ),
    }),
    columnHelper.accessor("_count", {
      header: "Profiles",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {info.getValue().profiles}
        </span>
      ),
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: (info) => (
        <Badge variant={info.getValue() ? "outline" : "destructive"}>
          {info.getValue() ? "Active" : "Inactive"}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => {
        const row = info.row.original
        return (
          <div className="flex items-center gap-1 justify-end">
            <Link
              href={`/admin/network/profile-types/${row.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="sr-only">Edit</span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                row.isActive ? handleDeactivate(row.id) : handleActivate(row.id)
              }
              disabled={actionLoading === row.id}
              title={row.isActive ? "Deactivate" : "Activate"}
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span className="sr-only">{row.isActive ? "Deactivate" : "Activate"}</span>
            </Button>
          </div>
        )
      },
    }),
  ]

  return (
    <DataTable
      data={data}
      columns={columns}
      searchable
      searchPlaceholder="Search profile types..."
    />
  )
}
