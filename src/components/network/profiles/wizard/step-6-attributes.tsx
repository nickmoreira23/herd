"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useWizardStore } from "@/stores/wizard-store"
import type { WizardField } from "@/lib/validators/network-profile-type"

interface StepAttributesProps {
  onNext: () => void
  onBack: () => void
}

export function StepAttributes({ onNext, onBack }: StepAttributesProps) {
  const { formData, updateFormData, profileTypeConfig } = useWizardStore()

  const fields = (profileTypeConfig?.wizardFields ?? []) as WizardField[]
  const step6Fields = fields.filter((f) => f.step === 6)

  const attrs = (formData.attributes ?? {}) as Record<string, unknown>

  function setAttr(key: string, value: unknown) {
    updateFormData({ attributes: { ...attrs, [key]: value } })
  }

  // Check required fields are filled
  const isValid = step6Fields
    .filter((f) => f.required)
    .every((f) => {
      const val = attrs[f.key]
      if (f.type === "multi_select") return Array.isArray(val) && val.length > 0
      return val !== undefined && val !== "" && val !== null
    })

  if (step6Fields.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Additional Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No additional fields for this profile type.
          </p>
        </div>
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
            className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Additional Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide details specific to{" "}
          {profileTypeConfig?.displayName ?? "this profile type"}.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {step6Fields.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={attrs[field.key]}
            onChange={(val) => setAttr(field.key, val)}
          />
        ))}
      </div>

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
          disabled={!isValid}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            isValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: WizardField
  value: unknown
  onChange: (val: unknown) => void
}) {
  const labelEl = (
    <label className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  )

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      )

    case "select":
      return (
        <div className="space-y-1.5">
          {labelEl}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select an option</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )

    case "multi_select": {
      const selected = (value as string[]) ?? []
      return (
        <div className="space-y-1.5">
          {labelEl}
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, opt])
                    else onChange(selected.filter((s) => s !== opt))
                  }}
                  className="rounded"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    case "toggle":
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`field-${field.key}`}
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={`field-${field.key}`} className="text-sm font-medium cursor-pointer">
            {field.label}
          </label>
        </div>
      )

    case "number":
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      )

    default:
      return (
        <div className="space-y-1.5">
          {labelEl}
          <Input
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      )
  }
}
