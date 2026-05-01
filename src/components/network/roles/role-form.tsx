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
import { useT } from "@/lib/i18n/locale-context"

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
  const t = useT()
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
      setError(t("error.network.unexpected"))
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
            <p className="text-sm font-medium text-amber-500">
              {t("network.roles.detail.system_role_title")}
            </p>
            <p className="text-xs text-amber-500/80 mt-0.5">
              {t("network.roles.detail.system_role_hint")}
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
          <Label>{t("network.roles.detail.display_name_label")}</Label>
          <Input
            value={form.displayName ?? ""}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("network.roles.detail.display_name_placeholder")}
            required
            disabled={isSystem}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("network.roles.detail.slug_label")}</Label>
          <Input
            value={form.slug ?? ""}
            onChange={(e) =>
              handleChange("slug", e.target.value.replace(/[^a-z0-9_-]/g, ""))
            }
            placeholder={t("network.roles.detail.slug_placeholder")}
            required
            readOnly={mode === "edit"}
            className={mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("network.roles.detail.description_label")}</Label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={t("network.roles.detail.description_placeholder")}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("network.roles.detail.network_type_label")}</Label>
          <Select
            value={form.networkType ?? "BOTH"}
            onValueChange={(val) =>
              handleChange("networkType", val === "BOTH" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("network.roles.detail.network_type_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOTH">{t("network.type.both")}</SelectItem>
              <SelectItem value="INTERNAL">{t("network.type.internal_only")}</SelectItem>
              <SelectItem value="EXTERNAL">{t("network.type.external_only")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("network.roles.detail.parent_role_label")}</Label>
          <Select
            value={form.parentRoleId ?? "NONE"}
            onValueChange={(val) =>
              handleChange("parentRoleId", val === "NONE" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("network.roles.detail.parent_role_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{t("network.roles.detail.parent_role_none")}</SelectItem>
              {availableParentRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("network.roles.detail.parent_role_hint")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || isSystem}>
          {isSubmitting
            ? mode === "create"
              ? t("network.roles.detail.creating")
              : t("network.roles.detail.saving")
            : mode === "create"
            ? t("network.roles.detail.create_button")
            : t("network.roles.detail.save_button")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/network/roles")}
        >
          {t("network.roles.detail.cancel")}
        </Button>
      </div>
    </form>
  )
}
