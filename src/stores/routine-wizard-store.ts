import { create } from "zustand";
import type { SchedulePreset } from "@/lib/routines/schedule-presets";
import type { CanvasStep } from "@/components/routines/wizard/canvas/canvas-types";

export type WizardStepNumber = 1 | 2 | 3 | 4;

export const WIZARD_STEPS: WizardStepNumber[] = [1, 2, 3, 4];
export const WIZARD_STEP_LABELS: Record<WizardStepNumber, string> = {
  1: "Identity",
  2: "Trigger",
  3: "Flow",
  4: "Review",
};

export type TriggerType = "MANUAL" | "SCHEDULE" | "EVENT";

interface RoutineWizardState {
  name: string;
  description: string;
  tags: string[];

  triggerType: TriggerType;
  schedulePreset: SchedulePreset;
  timezone: string;
  eventBlock: string | null;
  eventType: string | null;

  steps: CanvasStep[];
  selectedStepId: string | null;

  currentStep: WizardStepNumber;
  completedSteps: Set<number>;
  saving: boolean;
  saveError: string | null;

  setName: (v: string) => void;
  setDescription: (v: string) => void;
  setTags: (v: string[]) => void;

  setTriggerType: (v: TriggerType) => void;
  setSchedulePreset: (v: SchedulePreset) => void;
  setTimezone: (v: string) => void;
  setEvent: (block: string | null, type: string | null) => void;

  setSteps: (s: CanvasStep[]) => void;
  addStep: (afterStepId: string | null) => void;
  removeStep: (id: string) => void;
  updateStep: (id: string, patch: Partial<CanvasStep>) => void;
  selectStep: (id: string | null) => void;
  updateStepPosition: (id: string, x: number, y: number) => void;

  setStep: (n: WizardStepNumber) => void;
  markStepComplete: (n: WizardStepNumber) => void;
  goNext: () => void;
  goBack: () => void;

  setSaving: (v: boolean) => void;
  setSaveError: (v: string | null) => void;
  reset: () => void;
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newStep(stepOrder: number): CanvasStep {
  return {
    id: uid(),
    stepOrder,
    name: null,
    agentId: null,
    promptTemplate: "",
    outputFormat: "text",
    inputSource: stepOrder === 1 ? "trigger" : "step",
  };
}

const initialState = (): Omit<
  RoutineWizardState,
  | "setName"
  | "setDescription"
  | "setTags"
  | "setTriggerType"
  | "setSchedulePreset"
  | "setTimezone"
  | "setEvent"
  | "setSteps"
  | "addStep"
  | "removeStep"
  | "updateStep"
  | "selectStep"
  | "updateStepPosition"
  | "setStep"
  | "markStepComplete"
  | "goNext"
  | "goBack"
  | "setSaving"
  | "setSaveError"
  | "reset"
> => ({
  name: "",
  description: "",
  tags: [],
  triggerType: "MANUAL",
  schedulePreset: { kind: "daily", hour: 9, minute: 0 },
  timezone: "America/Sao_Paulo",
  eventBlock: null,
  eventType: null,
  steps: [newStep(1)],
  selectedStepId: null,
  currentStep: 1,
  completedSteps: new Set(),
  saving: false,
  saveError: null,
});

export const useRoutineWizardStore = create<RoutineWizardState>((set, get) => ({
  ...initialState(),

  setName: (v) => set({ name: v }),
  setDescription: (v) => set({ description: v }),
  setTags: (v) => set({ tags: v }),

  setTriggerType: (v) => set({ triggerType: v }),
  setSchedulePreset: (v) => set({ schedulePreset: v }),
  setTimezone: (v) => set({ timezone: v }),
  setEvent: (block, type) => set({ eventBlock: block, eventType: type }),

  setSteps: (s) => set({ steps: s }),

  addStep: (afterStepId) => {
    set((state) => {
      const sorted = [...state.steps].sort((a, b) => a.stepOrder - b.stepOrder);
      const insertAfterIdx = afterStepId
        ? sorted.findIndex((s) => s.id === afterStepId)
        : sorted.length - 1;
      const insertAt = insertAfterIdx + 1;
      const created = newStep(insertAt + 1);
      const before = sorted.slice(0, insertAt);
      const after = sorted.slice(insertAt).map((s) => ({
        ...s,
        stepOrder: s.stepOrder + 1,
      }));
      return {
        steps: [...before, created, ...after],
        selectedStepId: created.id,
      };
    });
  },

  removeStep: (id) => {
    set((state) => {
      if (state.steps.length <= 1) return state;
      const filtered = state.steps
        .filter((s) => s.id !== id)
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((s, i) => ({ ...s, stepOrder: i + 1 }));
      return {
        steps: filtered,
        selectedStepId:
          state.selectedStepId === id ? null : state.selectedStepId,
      };
    });
  },

  updateStep: (id, patch) => {
    set((state) => ({
      steps: state.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  },

  selectStep: (id) => set({ selectedStepId: id }),

  updateStepPosition: (id, x, y) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === id ? { ...s, positionX: x, positionY: y } : s
      ),
    }));
  },

  setStep: (n) =>
    set((state) => ({
      currentStep: n,
      completedSteps: new Set([...state.completedSteps, state.currentStep]),
    })),
  markStepComplete: (n) =>
    set((state) => ({
      completedSteps: new Set([...state.completedSteps, n]),
    })),
  goNext: () => {
    const { currentStep, markStepComplete } = get();
    markStepComplete(currentStep);
    if (currentStep < 4) {
      set({ currentStep: (currentStep + 1) as WizardStepNumber });
    }
  },
  goBack: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as WizardStepNumber });
    }
  },

  setSaving: (v) => set({ saving: v }),
  setSaveError: (v) => set({ saveError: v }),
  reset: () => set(initialState()),
}));

export function isStepValid(
  state: RoutineWizardState,
  step: WizardStepNumber
): boolean {
  switch (step) {
    case 1:
      return state.name.trim().length > 0;
    case 2:
      if (state.triggerType === "MANUAL") return true;
      if (state.triggerType === "SCHEDULE") return true;
      if (state.triggerType === "EVENT")
        return !!state.eventBlock && !!state.eventType;
      return false;
    case 3:
      return (
        state.steps.length > 0 &&
        state.steps.every(
          (s) => !!s.agentId && s.promptTemplate.trim().length > 0
        )
      );
    case 4:
      return (
        state.name.trim().length > 0 &&
        state.steps.length > 0 &&
        state.steps.every(
          (s) => !!s.agentId && s.promptTemplate.trim().length > 0
        )
      );
  }
}

export function invalidStepIds(state: RoutineWizardState): Set<string> {
  return new Set(
    state.steps
      .filter((s) => !s.agentId || s.promptTemplate.trim().length === 0)
      .map((s) => s.id)
  );
}
