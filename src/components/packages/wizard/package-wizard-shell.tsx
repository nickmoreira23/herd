"use client";

import { useEffect } from "react";
import { WizardProgress } from "@/components/network/profiles/wizard/wizard-progress";
import { StepMode } from "./step-mode";
import { StepGoal } from "./step-goal";
import { StepPreferences } from "./step-preferences";
import { StepAnalysis } from "./step-analysis";
import { StepBuild } from "./step-build";
import { StepIdentity } from "./step-identity";
import { StepReview } from "./step-review";
import {
  usePackageWizardStore,
  type TierInfo,
} from "@/stores/package-wizard-store";
import type { RedemptionRule } from "@/lib/credit-cost";

interface PackageWizardShellProps {
  tiers: TierInfo[];
  redemptionRulesByTier: Record<string, RedemptionRule[]>;
}

const STEP_LABELS: Record<number, string> = {
  1: "Mode",
  2: "Goal",
  3: "Preferences",
  4: "Analysis",
  5: "Package",
  6: "Identity",
  7: "Review",
};

const STEPS = [1, 2, 3, 4, 5, 6, 7];

export function PackageWizardShell({
  tiers,
  redemptionRulesByTier,
}: PackageWizardShellProps) {
  const { currentStep, completedSteps, setStep, markStepComplete, reset } =
    usePackageWizardStore();

  // Reset store when mounting the wizard
  useEffect(() => {
    reset();
  }, [reset]);

  const progressSteps = STEPS.map((n) => ({
    number: n,
    label: STEP_LABELS[n],
  }));

  function handleNext() {
    markStepComplete(currentStep);
    const nextIdx = STEPS.indexOf(currentStep) + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx]);
    }
  }

  function handleBack() {
    const prevIdx = STEPS.indexOf(currentStep) - 1;
    if (prevIdx >= 0) {
      setStep(STEPS[prevIdx]);
    }
  }

  function goToStep(step: number) {
    setStep(step);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <WizardProgress
          steps={progressSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* Step content */}
      {currentStep === 1 && <StepMode onNext={handleNext} />}
      {currentStep === 2 && (
        <StepGoal onNext={handleNext} onBack={handleBack} tiers={tiers} />
      )}
      {currentStep === 3 && (
        <StepPreferences onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 4 && (
        <StepAnalysis onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 5 && (
        <StepBuild
          onNext={handleNext}
          onBack={handleBack}
          tiers={tiers}
          redemptionRulesByTier={redemptionRulesByTier}
        />
      )}
      {currentStep === 6 && (
        <StepIdentity onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 7 && (
        <StepReview onBack={handleBack} goToStep={goToStep} />
      )}
    </div>
  );
}
