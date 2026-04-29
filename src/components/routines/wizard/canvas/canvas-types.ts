/** Step record as it lives in the wizard / detail state. */
export interface CanvasStep {
  /** Local id — uuid for new steps, persisted id once saved */
  id: string;
  stepOrder: number;
  name: string | null;
  agentId: string | null;
  agentName?: string | null;
  promptTemplate: string;
  outputFormat: "text" | "json" | "markdown";
  inputSource: "trigger" | "step";
  positionX?: number | null;
  positionY?: number | null;
}

/** Per-step status painted onto the canvas in "trace" mode. */
export interface StepRunResult {
  stepId: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  durationMs?: number;
  error?: string;
}

export type NodeKind = "trigger" | "step" | "output";

export interface TriggerNodeData {
  triggerType: "MANUAL" | "SCHEDULE" | "EVENT";
  summary: string;
  [key: string]: unknown;
}

export interface StepNodeData {
  step: CanvasStep;
  isSelected: boolean;
  isInvalid: boolean;
  runStatus?: StepRunResult["status"] | null;
  onClick: () => void;
  onAddAfter: () => void;
  onDelete: () => void;
  [key: string]: unknown;
}

export interface OutputNodeData {
  totalSteps: number;
  [key: string]: unknown;
}
