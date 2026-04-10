"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2, Lock } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as React from "react"

interface RoleRow {
  id: string
  slug: string
  displayName: string
  networkType?: "INTERNAL" | "EXTERNAL" | null
  isSystem: boolean
  parentRole?: { id: string; displayName: string } | null
  _count: { profileRoles: number }
}

const columnHelper = createColumnHelper<RoleRow>()

export function RoleTable({ data }: { data: RoleRow[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = React.useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete role "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/network/roles/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
        return
      }
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  const columns: ColumnDef<RoleRow, any>[] = [
    columnHelper.accessor("displayName", {
      header: "Role",
      cell: (info) => (
        <div className="flex items-center gap-2">
          {info.row.original.isSystem && (
            <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          <Link
            href={`/admin/network/roles/${info.row.original.id}`}
            className="font-medium hover:underline"
          >
            {info.getValue()}
          </Link>
        </div>
      ),
    }),
    columnHelper.accessor("slug", {
      header: "Slug",
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("networkType", {
      header: "Network",
      cell: (info) => {
        const nt = info.getValue()
        if (!nt) return <span className="text-xs text-muted-foreground">Both</span>
        return (
          <Badge variant={nt === "INTERNAL" ? "secondary" : "default"}>
            {nt}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("parentRole", {
      header: "Inherits From",
      cell: (info) => {
        const parent = info.getValue()
        if (!parent) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <Link
            href={`/admin/network/roles/${parent.id}`}
            className="text-sm hover:underline text-muted-foreground"
          >
            {parent.displayName}
          </Link>
        )
      },
    }),
    columnHelper.accessor("_count", {
      header: "Members",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {info.getValue().profileRoles}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => {
        const row = info.row.original
        return (
          <div className="flex items-center gap-1 justify-end">
            <Link
              href={`/admin/network/roles/${row.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="sr-only">Edit</span>
            </Link>
            {!row.isSystem && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(row.id, row.displayName)}
                disabled={deleting === row.id}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
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
      searchPlaceholder="Search roles..."
    />
  )
}
