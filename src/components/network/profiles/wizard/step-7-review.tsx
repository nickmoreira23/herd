"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWizardStore } from "@/stores/wizard-store"
import type { WizardField } from "@/lib/validators/network-profile-type"

interface StepReviewProps {
  onBack: () => void
  goToStep: (step: number) => void
}

export function StepReview({ onBack, goToStep }: StepReviewProps) {
  const router = useRouter()
  const { formData, profileTypeConfig, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fields = (profileTypeConfig?.wizardFields ?? []) as WizardField[]
  const attrs = (formData.attributes ?? {}) as Record<string, unknown>

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/network/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (json.error) {
        setError(json.error)
        return
      }

      reset()
      router.push(`/admin/network/profiles/${json.data.id}`)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function EditButton({ step }: { step: number }) {
    return (
      <button
        type="button"
        onClick={() => goToStep(step)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Edit2 className="w-3 h-3" />
        Edit
      </button>
    )
  }

  function Section({
    title,
    step,
    children,
  }: {
    title: string
    step: number
    children: React.ReactNode
  }) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
          <h3 className="text-sm font-semibold">{title}</h3>
          <EditButton step={step} />
        </div>
        <div className="px-4 py-3 space-y-1.5">{children}</div>
      </div>
    )
  }

  function Row({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right max-w-[60%]">{value}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review & Confirm</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Check everything before creating the profile.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3 max-w-lg">
        {/* Network & Type */}
        <Section title="Network & Type" step={1}>
          <Row
            label="Network"
            value={formData.networkType}
          />
          <Row label="Profile Type" value={profileTypeConfig?.displayName} />
        </Section>

        {/* Identity */}
        <Section title="Identity" step={2}>
          <Row
            label="Name"
            value={
              formData.firstName && formData.lastName
                ? `${formData.firstName} ${formData.lastName}`
                : undefined
            }
          />
          <Row label="Email" value={formData.email} />
          <Row label="Phone" value={formData.phone} />
        </Section>

        {/* Hierarchy */}
        <Section title="Hierarchy" step={3}>
          {formData.parentId ? (
            <p className="text-sm">Parent ID: <span className="font-mono text-xs">{formData.parentId}</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">No supervisor assigned</p>
          )}
          {formData.teamIds && formData.teamIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {formData.teamIds.length} team(s) assigned
            </p>
          )}
        </Section>

        {/* Roles */}
        <Section title="Roles" step={4}>
          {formData.roleIds && formData.roleIds.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {formData.roleIds.length} role(s) assigned
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No roles assigned</p>
          )}
        </Section>

        {/* Compensation (external only) */}
        {formData.networkType === "EXTERNAL" && (
          <Section title="Compensation" step={5}>
            {formData.compensationPlanId ? (
              <p className="text-sm text-muted-foreground">Compensation plan selected</p>
            ) : (
              <p className="text-sm text-muted-foreground">No compensation plan selected</p>
            )}
          </Section>
        )}

        {/* Extended Attributes */}
        {fields.filter((f) => f.step === 6).length > 0 && (
          <Section title="Additional Information" step={6}>
            {fields
              .filter((f) => f.step === 6)
              .map((field) => {
                const val = attrs[field.key]
                if (val === undefined || val === "" || val === null) return null
                const displayVal = Array.isArray(val)
                  ? (val as string[]).join(", ")
                  : String(val)
                return <Row key={field.key} label={field.label} value={displayVal} />
              })}
          </Section>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating Profile..." : "Create Profile"}
        </button>
      </div>
    </div>
  )
}
