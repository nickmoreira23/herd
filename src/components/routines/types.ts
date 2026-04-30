import cronstrue from "cronstrue/i18n";
import type { Locale } from "@/lib/i18n/locales";

export type RoutineTriggerType = "MANUAL" | "SCHEDULE" | "EVENT";
export type RoutineStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type RoutineRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";
export type RoutineTriggerSource = "MANUAL" | "SCHEDULE" | "EVENT" | "BACKFILL";
export type RoutineOutputFormat = "text" | "json" | "markdown";

export const STATUS_ORDER: RoutineStatus[] = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
];
export const TRIGGER_ORDER: RoutineTriggerType[] = [
  "MANUAL",
  "SCHEDULE",
  "EVENT",
];

export const STATUS_COLOR: Record<RoutineStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  ACTIVE: "bg-emerald-200 text-emerald-800",
  PAUSED: "bg-amber-200 text-amber-800",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
};

export const RUN_STATUS_COLOR: Record<RoutineRunStatus, string> = {
  QUEUED: "bg-slate-200 text-slate-800",
  RUNNING: "bg-blue-200 text-blue-800",
  SUCCESS: "bg-emerald-200 text-emerald-800",
  FAILED: "bg-rose-200 text-rose-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

export const TRIGGER_EMOJI: Record<RoutineTriggerType, string> = {
  MANUAL: "👆",
  SCHEDULE: "⏰",
  EVENT: "🔔",
};

export interface RoutineAgentRef {
  id: string;
  name: string;
  key: string;
  icon?: string | null;
}

export interface RoutineRunSummary {
  id: string;
  status: RoutineRunStatus;
  triggerSource: RoutineTriggerSource;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

export interface RoutineRow {
  id: string;
  name: string;
  description: string | null;
  promptTemplate: string;
  status: RoutineStatus;
  agentId: string;
  agent: RoutineAgentRef | null;
  triggerType: RoutineTriggerType;
  cronExpression: string | null;
  timezone: string;
  eventBlock: string | null;
  eventType: string | null;
  eventFilter: unknown;
  inputSchema: unknown;
  defaultInputs: unknown;
  outputFormat: RoutineOutputFormat;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: RoutineRunStatus | null;
  runCount: number;
  successCount: number;
  failureCount: number;
  ownerId: string | null;
  tags: string[];
  contentJson: unknown;
  contentText: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineStepRecord {
  id: string;
  stepOrder: number;
  name: string | null;
  agentId: string;
  agent?: RoutineAgentRef | null;
  promptTemplate: string;
  outputFormat: "text" | "json" | "markdown";
  inputSource: "trigger" | "step";
  positionX: number | null;
  positionY: number | null;
}

export interface RoutineDetail extends RoutineRow {
  runs?: RoutineRunSummary[];
  steps?: RoutineStepRecord[];
}

const CRONSTRUE_LOCALE: Record<Locale, string> = {
  "pt-BR": "pt_BR",
  "en-US": "en",
};

/** Human-readable cron description in the active locale. Falls back to the raw expression. */
export function humanCron(expr: string | null, locale: Locale): string {
  if (!expr) return "—";
  try {
    return cronstrue.toString(expr, { locale: CRONSTRUE_LOCALE[locale] });
  } catch {
    return expr;
  }
}
