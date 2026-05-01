"use client"

import * as React from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/locale-context"
import type { MessageKey } from "@/lib/i18n/messages/pt-BR"
import type { WizardField } from "@/lib/validators/network-profile-type"

interface WizardFieldsEditorProps {
  value: WizardField[]
  onChange: (fields: WizardField[]) => void
}

const FIELD_TYPES: WizardField["type"][] = [
  "text", "email", "phone", "number", "textarea",
  "select", "multi_select", "toggle", "date", "url",
]

const FIELD_TYPE_KEYS = {
  text: "network.profile_types.field_type.text",
  email: "network.profile_types.field_type.email",
  phone: "network.profile_types.field_type.phone",
  number: "network.profile_types.field_type.number",
  textarea: "network.profile_types.field_type.textarea",
  select: "network.profile_types.field_type.select",
  multi_select: "network.profile_types.field_type.multi_select",
  toggle: "network.profile_types.field_type.toggle",
  date: "network.profile_types.field_type.date",
  url: "network.profile_types.field_type.url",
} as const satisfies Record<WizardField["type"], MessageKey>

const NEW_FIELD: WizardField = {
  key: "",
  label: "",
  type: "text",
  required: false,
  step: 6,
  target: "attribute",
}

export function WizardFieldsEditor({ value, onChange }: WizardFieldsEditorProps) {
  const t = useT()
  const [dragIdx, setDragIdx] = React.useState<number | null>(null)
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null)

  function addField() {
    const updated = [...value, { ...NEW_FIELD }]
    onChange(updated)
    setExpandedIdx(updated.length - 1)
  }

  function removeField(idx: number) {
    const updated = value.filter((_, i) => i !== idx)
    onChange(updated)
    if (expandedIdx === idx) setExpandedIdx(null)
  }

  function updateField(idx: number, patch: Partial<WizardField>) {
    const updated = value.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    onChange(updated)
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const updated = [...value]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(idx, 0, moved)
    onChange(updated)
    setDragIdx(idx)
  }

  function handleDragEnd() {
    setDragIdx(null)
  }

  // Tag input for options array
  function OptionsInput({
    options = [],
    onChange: onOptChange,
  }: {
    options: string[]
    onChange: (opts: string[]) => void
  }) {
    const [inputVal, setInputVal] = React.useState("")

    function addOption(val: string) {
      const trimmed = val.trim()
      if (trimmed && !options.includes(trimmed)) {
        onOptChange([...options, trimmed])
      }
      setInputVal("")
    }

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 min-h-8 p-1 rounded-md border border-input bg-transparent">
          {options.map((opt) => (
            <span
              key={opt}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
            >
              {opt}
              <button
                type="button"
                onClick={() => onOptChange(options.filter((o) => o !== opt))}
                className="hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addOption(inputVal)
            }
          }}
          onBlur={() => inputVal && addOption(inputVal)}
          placeholder={t("network.profile_types.field_editor.option_placeholder")}
          className="h-7 text-xs"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 rounded-lg border border-dashed border-border">
          {t("network.profile_types.field_editor.empty")}
        </p>
      )}

      {value.map((field, idx) => {
        const isExpanded = expandedIdx === idx
        const isDragging = dragIdx === idx
        const hasOptions = field.type === "select" || field.type === "multi_select"

        return (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              "rounded-lg border border-border bg-card transition-opacity",
              isDragging && "opacity-50"
            )}
          >
            {/* Field header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {field.label || (
                      <span className="text-muted-foreground italic">
                        {t("network.profile_types.field_editor.unnamed")}
                      </span>
                    )}
                  </span>
                  <Badge variant="outline" className="text-xs py-0">
                    {t(FIELD_TYPE_KEYS[field.type])}
                  </Badge>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs py-0">
                      {t("network.profile_types.field_editor.required_badge")}
                    </Badge>
                  )}
                </div>
                {field.key && (
                  <p className="text-xs text-muted-foreground font-mono">{field.key}</p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeField(idx)
                }}
                className="p-1 rounded hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {t("network.profile_types.field_editor.label_label")}
                  </label>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value
                      // Auto-generate key from label if key is empty or matches previous auto-gen
                      const autoKey = label
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "_")
                        .replace(/^_|_$/g, "")
                      updateField(idx, {
                        label,
                        key: field.key ? field.key : autoKey,
                      })
                    }}
                    placeholder={t("network.profile_types.field_editor.label_placeholder")}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {t("network.profile_types.field_editor.key_label")}
                  </label>
                  <Input
                    value={field.key}
                    onChange={(e) =>
                      updateField(idx, { key: e.target.value.replace(/[^a-z0-9_]/g, "") })
                    }
                    placeholder={t("network.profile_types.field_editor.key_placeholder")}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {t("network.profile_types.field_editor.type_label")}
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(idx, { type: e.target.value as WizardField["type"] })
                    }
                    className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {t(FIELD_TYPE_KEYS[ft])}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {t("network.profile_types.field_editor.step_label")}
                  </label>
                  <select
                    value={field.step}
                    onChange={(e) => updateField(idx, { step: Number(e.target.value) })}
                    className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={6}>
                      {t("network.profile_types.field_editor.step_6")}
                    </option>
                    <option value={2}>
                      {t("network.profile_types.field_editor.step_2")}
                    </option>
                    <option value={3}>
                      {t("network.profile_types.field_editor.step_3")}
                    </option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {t("network.profile_types.field_editor.placeholder_label")}
                  </label>
                  <Input
                    value={field.placeholder ?? ""}
                    onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                    placeholder={t("network.profile_types.field_editor.placeholder_hint")}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id={`required-${idx}`}
                    checked={field.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor={`required-${idx}`} className="text-xs font-medium cursor-pointer">
                    {t("network.profile_types.field_editor.required_field")}
                  </label>
                </div>
                {hasOptions && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium">
                      {t("network.profile_types.field_editor.options_label")}
                    </label>
                    <OptionsInput
                      options={field.options ?? []}
                      onChange={(opts) => updateField(idx, { options: opts })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" onClick={addField} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        {t("network.profile_types.field_editor.add_field")}
      </Button>
    </div>
  )
}
