"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WizardProgress } from "@/components/shared/wizard-progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/locale-context";
import {
  useRoutineWizardStore,
  isStepValid,
  WIZARD_STEPS,
  WIZARD_STEP_LABELS,
} from "@/stores/routine-wizard-store";
import { presetToCron } from "@/lib/routines/schedule-presets";

import { StepIdentity } from "./steps/step-identity";
import { StepTrigger } from "./steps/step-trigger";
import { StepFlow } from "./steps/step-flow";
import { StepReview } from "./steps/step-review";

export function RoutineWizardShell() {
  const t = useT();
  const router = useRouter();
  const state = useRoutineWizardStore();

  // Reset store on mount
  useEffect(() => {
    state.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepValid = isStepValid(state, state.currentStep);

  // Stepper labels go through i18n at render time so they follow ?locale=
  const localizedLabels: Record<number, string> = {
    1: t("routines.wizard.steps.identity"),
    2: t("routines.wizard.steps.trigger"),
    3: t("routines.wizard.steps.flow"),
    4: t("routines.wizard.steps.review"),
  };
  void WIZARD_STEP_LABELS; // kept as a static fallback elsewhere
  const progressSteps = WIZARD_STEPS.map((n) => ({
    number: n,
    label: localizedLabels[n],
  }));

  async function save(activate: boolean) {
    if (!isStepValid(state, 4)) return;
    state.setSaving(true);
    state.setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        name: state.name,
        description: state.description || null,
        triggerType: state.triggerType,
        tags: state.tags,
        status: activate ? "ACTIVE" : "DRAFT",
        steps: state.steps.map((s) => ({
          stepOrder: s.stepOrder,
          name: s.name,
          agentId: s.agentId,
          promptTemplate: s.promptTemplate,
          outputFormat: s.outputFormat,
          inputSource: s.inputSource,
          positionX: s.positionX ?? null,
          positionY: s.positionY ?? null,
        })),
      };
      if (state.triggerType === "SCHEDULE") {
        body.cronExpression = presetToCron(state.schedulePreset);
        body.timezone = state.timezone;
      }
      if (state.triggerType === "EVENT") {
        body.eventBlock = state.eventBlock;
        body.eventType = state.eventType;
      }

      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        state.setSaveError(json.error || "Failed to save routine");
        return;
      }
      state.reset();
      router.push(`/admin/blocks/routines/${json.data.id}`);
    } finally {
      state.setSaving(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/blocks/routines"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
          <h1 className="text-lg font-semibold">{t("routines.wizard.title")}</h1>
          <span className="text-xs text-muted-foreground">
            {state.currentStep} / {WIZARD_STEPS.length}
          </span>
        </div>

        <WizardProgress
          steps={progressSteps}
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
        />

        {state.currentStep === 1 && (
          <StepIdentity onNext={state.goNext} canProceed={stepValid} />
        )}
        {state.currentStep === 2 && (
          <StepTrigger
            onNext={state.goNext}
            onBack={state.goBack}
            canProceed={stepValid}
          />
        )}
        {state.currentStep === 3 && (
          <StepFlow
            onNext={state.goNext}
            onBack={state.goBack}
            canProceed={stepValid}
          />
        )}
        {state.currentStep === 4 && (
          <StepReview
            onBack={state.goBack}
            onSave={save}
            saving={state.saving}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
