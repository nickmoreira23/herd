"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  useRoutineWizardStore,
  invalidStepIds,
} from "@/stores/routine-wizard-store";
import { presetToCron } from "@/lib/routines/schedule-presets";
import { humanCron } from "@/components/routines/types";
import { RoutineCanvas } from "../canvas/routine-canvas";
import { StepPropertiesSheet } from "../canvas/step-properties-sheet";
import { InfoTip } from "@/components/tiers/info-tip";

interface StepFlowProps {
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function StepFlow({ onNext, onBack, canProceed }: StepFlowProps) {
  const t = useT();
  const locale = useLocale();
  const state = useRoutineWizardStore();
  const invalid = useMemo(() => invalidStepIds(state), [state]);

  const triggerSummary =
    state.triggerType === "SCHEDULE"
      ? humanCron(presetToCron(state.schedulePreset), locale)
      : state.triggerType === "EVENT"
        ? state.eventBlock && state.eventType
          ? `${state.eventBlock}.${state.eventType}`
          : "—"
        : t("routines.trigger.MANUAL");

  const selectedStep =
    state.steps.find((s) => s.id === state.selectedStepId) ?? null;
  const sortedSteps = [...state.steps].sort(
    (a, b) => a.stepOrder - b.stepOrder
  );
  const isFirstStep =
    selectedStep != null && selectedStep.stepOrder === sortedSteps[0]?.stepOrder;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center">
            {t("routines.wizard.steps.flow")}
            <InfoTip text={t("routines.tooltip.flow")} />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("routines.wizard.flow.subtitle")}
          </p>
        </div>

        <RoutineCanvas
          triggerSummary={triggerSummary}
          triggerType={state.triggerType}
          steps={state.steps}
          selectedStepId={state.selectedStepId}
          invalidStepIds={invalid}
          onSelectStep={state.selectStep}
          onAddStep={state.addStep}
          onDeleteStep={state.removeStep}
          onPositionChange={state.updateStepPosition}
        />

        {invalid.size > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {t("routines.wizard.flow.invalidWarning", { count: invalid.size })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("routines.wizard.back")}
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          {t("routines.wizard.next")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <StepPropertiesSheet
        step={selectedStep}
        isFirstStep={isFirstStep}
        open={!!selectedStep}
        onOpenChange={(o) => {
          if (!o) state.selectStep(null);
        }}
        onChange={(patch) => {
          if (selectedStep) state.updateStep(selectedStep.id, patch);
        }}
        onDelete={() => {
          if (selectedStep) state.removeStep(selectedStep.id);
        }}
      />
    </div>
  );
}
