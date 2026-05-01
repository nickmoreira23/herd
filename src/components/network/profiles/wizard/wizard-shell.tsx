"use client"

import * as React from "react"
import { WizardProgress } from "./wizard-progress"
import { StepNetworkType } from "./step-1-network-type"
import { StepIdentity } from "./step-2-identity"
import { StepHierarchy } from "./step-3-hierarchy"
import { StepRoles } from "./step-4-roles"
import { StepCompensation } from "./step-5-compensation"
import { StepAttributes } from "./step-6-attributes"
import { StepReview } from "./step-7-review"
import { useWizardStore } from "@/stores/wizard-store"
import { useT } from "@/lib/i18n/locale-context"
import type { MessageKey } from "@/lib/i18n/messages/pt-BR"

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEP_LABEL_KEYS = {
  1: "network.wizard.label.network",
  2: "network.wizard.label.identity",
  3: "network.wizard.label.hierarchy",
  4: "network.wizard.label.roles",
  5: "network.wizard.label.comp_plan",
  6: "network.wizard.label.details",
  7: "network.wizard.label.review",
} as const satisfies Record<StepNumber, MessageKey>

export function WizardShell() {
  const t = useT()
  const { formData, currentStep, completedSteps, setStep, markStepComplete, effectiveSteps } =
    useWizardStore()

  const steps = effectiveSteps(formData.networkType)

  const progressSteps = steps.map((n, i) => ({
    number: i + 1,      // display as 1, 2, 3...
    real: n,            // actual step number for component routing
    label:
      n in STEP_LABEL_KEYS
        ? t(STEP_LABEL_KEYS[n as StepNumber])
        : t("network.wizard.label.step_n", { n }),
  }))

  // Current display position (1-indexed within visible steps)
  const currentDisplayIdx = steps.indexOf(currentStep)
  const currentDisplayStep = currentDisplayIdx + 1

  // Completed display steps
  const completedDisplay = new Set<number>()
  for (const [i, n] of steps.entries()) {
    if (completedSteps.has(n)) completedDisplay.add(i + 1)
  }

  function goToRealStep(realStepNum: number) {
    setStep(realStepNum)
  }

  function handleNext() {
    markStepComplete(currentStep)
    const nextIdx = currentDisplayIdx + 1
    if (nextIdx < steps.length) {
      setStep(steps[nextIdx])
    }
  }

  function handleBack() {
    const prevIdx = currentDisplayIdx - 1
    if (prevIdx >= 0) {
      setStep(steps[prevIdx])
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <WizardProgress
          steps={progressSteps.map((s) => ({ number: s.number, label: s.label }))}
          currentStep={currentDisplayStep}
          completedSteps={completedDisplay}
        />
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {currentStep === 1 && <StepNetworkType onNext={handleNext} />}
        {currentStep === 2 && <StepIdentity onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <StepHierarchy onNext={handleNext} onBack={handleBack} />}
        {currentStep === 4 && <StepRoles onNext={handleNext} onBack={handleBack} />}
        {currentStep === 5 && <StepCompensation onNext={handleNext} onBack={handleBack} />}
        {currentStep === 6 && <StepAttributes onNext={handleNext} onBack={handleBack} />}
        {currentStep === 7 && (
          <StepReview
            onBack={handleBack}
            goToStep={(displayStep) => {
              const realStep = progressSteps[displayStep - 1]?.real
              if (realStep) goToRealStep(realStep)
            }}
          />
        )}
      </div>
    </div>
  )
}
