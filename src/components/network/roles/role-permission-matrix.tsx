"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShieldAlert } from "lucide-react"
import { getPermissionMeta, getResourceMeta } from "@/lib/permission-metadata"

interface Permission {
  id: string
  resource: string
  action: string
}

interface RolePermissionMatrixProps {
  roleId: string
  permissions: Permission[]
  assignedPermissionIds: Set<string>
  isSystem?: boolean
}

export function RolePermissionMatrix({
  roleId,
  permissions,
  assignedPermissionIds: initialAssigned,
  isSystem = false,
}: RolePermissionMatrixProps) {
  const router = useRouter()
  const [assigned, setAssigned] = React.useState<Set<string>>(
    new Set(initialAssigned)
  )
  const [loading, setLoading] = React.useState<string | null>(null)

  // Group permissions by resource
  const grouped = React.useMemo(() => {
    const g: Record<string, Permission[]> = {}
    for (const p of permissions) {
      if (!g[p.resource]) g[p.resource] = []
      g[p.resource].push(p)
    }
    return g
  }, [permissions])

  async function toggle(permissionId: string) {
    if (isSystem) return
    const isCurrentlyAssigned = assigned.has(permissionId)
    setLoading(permissionId)

    // Optimistic update
    setAssigned((prev) => {
      const next = new Set(prev)
      if (isCurrentlyAssigned) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })

    try {
      const res = await fetch(`/api/network/roles/${roleId}/permissions`, {
        method: isCurrentlyAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId }),
      })

      if (!res.ok) {
        // Revert on failure
        setAssigned((prev) => {
          const next = new Set(prev)
          if (isCurrentlyAssigned) next.add(permissionId)
          else next.delete(permissionId)
          return next
        })
      } else {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  async function toggleGroup(perms: Permission[], allAssigned: boolean) {
    if (isSystem) return
    for (const p of perms) {
      if (allAssigned && assigned.has(p.id)) await toggle(p.id)
      else if (!allAssigned && !assigned.has(p.id)) await toggle(p.id)
    }
  }

  return (
    <div className="space-y-6">
      {isSystem && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-500">System Role</p>
            <p className="text-xs text-amber-500/80 mt-0.5">
              Permissions for system roles cannot be modified.
            </p>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([resource, perms]) => {
        const meta = getResourceMeta(resource)
        const Icon = meta.icon
        const assignedCount = perms.filter((p) => assigned.has(p.id)).length
        const allAssigned = assignedCount === perms.length
        const noneAssigned = assignedCount === 0

        return (
          <div
            key={resource}
            className="rounded-xl ring-1 ring-foreground/10 overflow-hidden"
          >
            {/* Resource header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="px-1 py-1 text-xs tabular-nums">
                  {assignedCount} / {perms.length}
                </Badge>
                <Switch
                  checked={allAssigned}
                  onCheckedChange={() => toggleGroup(perms, allAssigned)}
                  disabled={isSystem}
                  size="sm"
                />
              </div>
            </div>

            {/* Individual permissions */}
            <div>
              {perms.map((perm, idx) => {
                const permMeta = getPermissionMeta(perm.resource, perm.action)
                const isLoading = loading === perm.id

                return (
                  <React.Fragment key={perm.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{permMeta.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {permMeta.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isLoading && (
                          <span className="text-xs text-muted-foreground">Saving...</span>
                        )}
                        <Switch
                          checked={assigned.has(perm.id)}
                          onCheckedChange={() => toggle(perm.id)}
                          disabled={isSystem || isLoading}
                          size="sm"
                        />
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
