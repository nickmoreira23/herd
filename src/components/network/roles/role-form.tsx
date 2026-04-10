"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldAlert } from "lucide-react"

interface CreateRoleInput {
  displayName: string
  slug: string
  description?: string
  networkType?: "INTERNAL" | "EXTERNAL"
  parentRoleId?: string
}

interface RoleOption {
  id: string
  displayName: string
  slug: string
}

interface RoleFormProps {
  defaultValues?: Partial<CreateRoleInput>
  roleId?: string
  mode: "create" | "edit"
  isSystem?: boolean
  availableParentRoles: RoleOption[]
}

export function RoleForm({
  defaultValues,
  roleId,
  mode,
  isSystem = false,
  availableParentRoles,
}: RoleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [form, setForm] = React.useState<Partial<CreateRoleInput>>({
    displayName: "",
    slug: "",
    description: "",
    networkType: undefined,
    parentRoleId: undefined,
    ...defaultValues,
  })

  function handleChange(field: keyof CreateRoleInput, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNameChange(name: string) {
    handleChange("displayName", name)
    if (mode === "create") {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
      handleChange("slug", slug)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url =
        mode === "create"
          ? "/api/network/roles"
          : `/api/network/roles/${roleId}`

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          parentRoleId: form.parentRoleId || undefined,
          networkType: form.networkType || undefined,
        }),
      })

      const json = await res.json()
      if (json.error) {
        setError(json.error)
        return
      }

      router.push("/admin/network/roles")
      router.refresh()
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {isSystem && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-500">System Role</p>
            <p className="text-xs text-amber-500/80 mt-0.5">
              Some fields on system roles cannot be modified.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Display Name *</Label>
          <Input
            value={form.displayName ?? ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Regional Manager"
            required
            disabled={isSystem}
          />
        </div>

        <div className="space-y-2">
          <Label>Slug *</Label>
          <Input
            value={form.slug ?? ""}
            onChange={(e) =>
              handleChange("slug", e.target.value.replace(/[^a-z0-9_-]/g, ""))
            }
            placeholder="e.g., regional_manager"
            required
            readOnly={mode === "edit"}
            className={mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="What is this role responsible for?"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Network Type</Label>
          <Select
            value={form.networkType ?? "BOTH"}
            onValueChange={(val) =>
              handleChange("networkType", val === "BOTH" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Both networks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOTH">Both networks</SelectItem>
              <SelectItem value="INTERNAL">Internal only</SelectItem>
              <SelectItem value="EXTERNAL">External only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Inherits From (Parent Role)</Label>
          <Select
            value={form.parentRoleId ?? "NONE"}
            onValueChange={(val) =>
              handleChange("parentRoleId", val === "NONE" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No parent (top-level role)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">No parent (top-level role)</SelectItem>
              {availableParentRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This role will inherit all permissions from the parent role.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || isSystem}>
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create Role"
            : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/network/roles")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
