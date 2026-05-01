"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { WizardFieldsEditor } from "./wizard-fields-editor"
import type { WizardField, CreateProfileTypeInput } from "@/lib/validators/network-profile-type"
import { useT } from "@/lib/i18n/locale-context"
import type { MessageKey } from "@/lib/i18n/messages/pt-BR"

type NetworkType = "INTERNAL" | "EXTERNAL"

const NETWORK_TYPE_KEYS = {
  INTERNAL: "network.type.INTERNAL",
  EXTERNAL: "network.type.EXTERNAL",
} as const satisfies Record<NetworkType, MessageKey>

const NETWORK_TYPE_HINT_KEYS = {
  INTERNAL: "network.profile_types.detail.network_type.internal_hint",
  EXTERNAL: "network.profile_types.detail.network_type.external_hint",
} as const satisfies Record<NetworkType, MessageKey>

interface ProfileTypeFormProps {
  defaultValues?: Partial<CreateProfileTypeInput>
  profileTypeId?: string
  mode: "create" | "edit"
}

export function ProfileTypeForm({
  defaultValues,
  profileTypeId,
  mode,
}: ProfileTypeFormProps) {
  const router = useRouter()
  const t = useT()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [form, setForm] = React.useState<Partial<CreateProfileTypeInput>>({
    displayName: "",
    slug: "",
    description: "",
    networkType: "INTERNAL" as NetworkType,
    wizardFields: [],
    isActive: true,
    sortOrder: 0,
    ...defaultValues,
  })

  function handleChange(field: keyof CreateProfileTypeInput, value: unknown) {
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
          ? "/api/network/profile-types"
          : `/api/network/profile-types/${profileTypeId}`

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (json.error) {
        setError(json.error)
        return
      }

      router.push("/admin/network/profile-types")
      router.refresh()
    } catch {
      setError(t("error.network.unexpected"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Network Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("network.profile_types.detail.network_type_label")}
        </label>
        <div className="flex gap-3">
          {(["INTERNAL", "EXTERNAL"] as NetworkType[]).map((nt) => (
            <button
              key={nt}
              type="button"
              onClick={() => handleChange("networkType", nt)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                form.networkType === nt
                  ? "border-[#CCFF00] bg-[#CCFF00]/10 text-foreground"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <Badge variant={nt === "INTERNAL" ? "secondary" : "default"} className="mb-1">
                {t(NETWORK_TYPE_KEYS[nt])}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {t(NETWORK_TYPE_HINT_KEYS[nt])}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("network.profile_types.detail.display_name_label")}
        </label>
        <Input
          value={form.displayName ?? ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t("network.profile_types.detail.display_name_placeholder")}
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("network.profile_types.detail.slug_label")}
        </label>
        <Input
          value={form.slug ?? ""}
          onChange={(e) =>
            handleChange("slug", e.target.value.replace(/[^a-z0-9_-]/g, ""))
          }
          placeholder={t("network.profile_types.detail.slug_placeholder")}
          required
          readOnly={mode === "edit"}
          className={mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}
        />
        <p className="text-xs text-muted-foreground">
          {t("network.profile_types.detail.slug_hint")}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("network.profile_types.detail.description_label")}
        </label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={t("network.profile_types.detail.description_placeholder")}
          rows={2}
        />
      </div>

      {/* Color & Icon */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("network.profile_types.detail.color_label")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color ?? "#6366f1"}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border border-input"
            />
            <Input
              value={form.color ?? ""}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="#6366f1"
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("network.profile_types.detail.sort_order_label")}
          </label>
          <Input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive ?? true}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
          {t("network.profile_types.detail.active_label")}
        </label>
      </div>

      {/* Wizard Fields */}
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium">
            {t("network.profile_types.detail.wizard_fields_label")}
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("network.profile_types.detail.wizard_fields_hint")}
          </p>
        </div>
        <WizardFieldsEditor
          value={(form.wizardFields ?? []) as WizardField[]}
          onChange={(fields) => handleChange("wizardFields", fields)}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? t("network.profile_types.detail.creating")
              : t("network.profile_types.detail.saving")
            : mode === "create"
            ? t("network.profile_types.detail.create_button")
            : t("network.profile_types.detail.save_button")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/network/profile-types")}
        >
          {t("network.profile_types.detail.cancel")}
        </Button>
      </div>
    </form>
  )
}
