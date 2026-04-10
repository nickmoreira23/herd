"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useWizardStore } from "@/stores/wizard-store"
import { Skeleton } from "@/components/ui/skeleton"

interface RoleOption {
  id: string
  slug: string
  displayName: string
  networkType?: string | null
  description?: string | null
  rolePermissions?: { permission: { resource: string; action: string } }[]
}

interface StepRolesProps {
  onNext: () => void
  onBack: () => void
}

export function StepRoles({ onNext, onBack }: StepRolesProps) {
  const { formData, updateFormData } = useWizardStore()
  const [roles, setRoles] = React.useState<RoleOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedRoleId, setExpandedRoleId] = React.useState<string | null>(null)

  const selectedIds = formData.roleIds ?? []

  React.useEffect(() => {
    const nt = formData.networkType
    const url = nt ? `/api/network/roles?network_type=${nt}` : "/api/network/roles"
    fetch(url)
      .then((r) => r.json())
      .then((json) => json.data && setRoles(json.data))
      .finally(() => setLoading(false))
  }, [formData.networkType])

  function toggleRole(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((r) => r !== id)
      : [...selectedIds, id]
    updateFormData({ roleIds: next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Role Assignment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Assign roles to control what this profile can access.
        </p>
      </div>

      <div className="space-y-2 max-w-lg">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))
          : roles.map((role) => {
              const isSelected = selectedIds.includes(role.id)
              const isExpanded = expandedRoleId === role.id
              const permCount = role.rolePermissions?.length ?? 0

              return (
                <div
                  key={role.id}
                  className={cn(
                    "rounded-lg border transition-all",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRole(role.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{role.displayName}</span>
                        {role.networkType && (
                          <Badge
                            variant={role.networkType === "INTERNAL" ? "secondary" : "default"}
                            className="text-xs py-0"
                          >
                            {role.networkType}
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      )}
                    </div>
                    {permCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setExpandedRoleId(isExpanded ? null : role.id)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {permCount} perms
                      </button>
                    )}
                  </label>

                  {isExpanded && role.rolePermissions && (
                    <div className="border-t border-border px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {role.rolePermissions.map((rp) => (
                          <span
                            key={`${rp.permission.resource}:${rp.permission.action}`}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-mono"
                          >
                            {rp.permission.resource}:{rp.permission.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
      </div>

      {selectedIds.length === 0 && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 max-w-lg">
          No roles selected. This profile will have no access permissions.
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
