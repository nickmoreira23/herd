"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useWizardStore } from "@/stores/wizard-store"
import { Skeleton } from "@/components/ui/skeleton"

interface CompPlanOption {
  id: string
  slug: string
  name: string
  description?: string | null
  commissionRules: unknown
}

interface StepCompensationProps {
  onNext: () => void
  onBack: () => void
}

export function StepCompensation({ onNext, onBack }: StepCompensationProps) {
  const { formData, updateFormData } = useWizardStore()
  const [plans, setPlans] = React.useState<CompPlanOption[]>([])
  const [loading, setLoading] = React.useState(true)

  const selectedPlanId = formData.compensationPlanId

  React.useEffect(() => {
    fetch("/api/network/compensation-plans")
      .then((r) => r.json())
      .then((json) => json.data && setPlans(json.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Compensation Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select the compensation plan for this external network member.
        </p>
      </div>

      <div className="space-y-3 max-w-lg">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No compensation plans configured yet. You can assign one later.
          </p>
        ) : (
          plans.map((plan) => {
            const rules = plan.commissionRules as Record<string, unknown> | null
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => updateFormData({ compensationPlanId: plan.id })}
                className={cn(
                  "w-full flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 text-left transition-all",
                  selectedPlanId === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <span className="text-sm font-medium">{plan.name}</span>
                {plan.description && (
                  <span className="text-xs text-muted-foreground">{plan.description}</span>
                )}
                {typeof rules?.type === "string" && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                    {rules.type} commission
                  </span>
                )}
              </button>
            )
          })
        )}
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
          className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
