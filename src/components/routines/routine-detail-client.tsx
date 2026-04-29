"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, Play, Pause, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { InfoTip } from "@/components/tiers/info-tip";
import { ScheduleConfig } from "./wizard/schedule-config";
import { EventConfig } from "./wizard/event-config";
import { RoutineCanvas } from "./wizard/canvas/routine-canvas";
import { StepPropertiesSheet } from "./wizard/canvas/step-properties-sheet";
import type {
  CanvasStep,
  StepRunResult,
} from "./wizard/canvas/canvas-types";
import {
  STATUS_COLOR,
  STATUS_ORDER,
  RUN_STATUS_COLOR,
  humanCron,
  type RoutineDetail,
  type RoutineRunStatus,
  type RoutineStatus,
  type RoutineTriggerType,
} from "./types";
import {
  RoutineRunDetail,
  type RoutineRunFull,
} from "./routine-run-detail";
import {
  cronToPreset,
  presetToCron,
  type SchedulePreset,
} from "@/lib/routines/schedule-presets";

interface RoutineDetailClientProps {
  routine: RoutineDetail;
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function recordsToCanvasSteps(routine: RoutineDetail): CanvasStep[] {
  const recs = routine.steps ?? [];
  if (recs.length > 0) {
    return recs.map((r) => ({
      id: r.id,
      stepOrder: r.stepOrder,
      name: r.name,
      agentId: r.agentId,
      agentName: r.agent?.name ?? null,
      promptTemplate: r.promptTemplate,
      outputFormat: r.outputFormat,
      inputSource: r.inputSource,
      positionX: r.positionX,
      positionY: r.positionY,
    }));
  }
  // Legacy fallback: synthesize a single step from the Routine root fields
  return [
    {
      id: routine.id, // stable id for the legacy single-step
      stepOrder: 1,
      name: null,
      agentId: routine.agentId,
      agentName: routine.agent?.name ?? null,
      promptTemplate: routine.promptTemplate,
      outputFormat: routine.outputFormat,
      inputSource: "trigger",
    },
  ];
}

export function RoutineDetailClient({ routine }: RoutineDetailClientProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  // ─── identity / metadata ────────────────────────────────────────
  const [name, setName] = useState(routine.name);
  const [description, setDescription] = useState(routine.description ?? "");
  const [status, setStatus] = useState<RoutineStatus>(routine.status);
  const [tags, setTags] = useState(routine.tags);
  const [tagInput, setTagInput] = useState("");

  // ─── trigger ────────────────────────────────────────────────────
  const [triggerType, setTriggerType] = useState<RoutineTriggerType>(
    routine.triggerType
  );
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>(() =>
    routine.cronExpression
      ? cronToPreset(routine.cronExpression)
      : { kind: "daily", hour: 9, minute: 0 }
  );
  const [timezone, setTimezone] = useState(
    routine.timezone || "America/Sao_Paulo"
  );
  const [eventBlock, setEventBlock] = useState<string | null>(routine.eventBlock);
  const [eventType, setEventType] = useState<string | null>(routine.eventType);

  // ─── flow / steps ───────────────────────────────────────────────
  const [steps, setSteps] = useState<CanvasStep[]>(() =>
    recordsToCanvasSteps(routine)
  );
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // ─── runs / trace ───────────────────────────────────────────────
  const [runs, setRuns] = useState(routine.runs ?? []);
  const [running, setRunning] = useState(false);
  const [detailRun, setDetailRun] = useState<RoutineRunFull | null>(null);
  const [traceResults, setTraceResults] = useState<StepRunResult[] | null>(null);

  // ─── persistence helpers ────────────────────────────────────────
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchRoutine(payload: Record<string, unknown>) {
    const res = await fetch(`/api/routines/${routine.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSavedAt(new Date());
      setSavedError(null);
    } else {
      const json = await res.json().catch(() => ({}));
      setSavedError(json.error || "Save failed");
    }
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchRoutine(payload), 400);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ─── steps mutation handlers ────────────────────────────────────
  function persistSteps(updated: CanvasStep[]) {
    setSteps(updated);
    debouncedSave({
      steps: updated.map((s) => ({
        id: s.id.length === 36 ? s.id : undefined, // only pass real uuids
        stepOrder: s.stepOrder,
        name: s.name,
        agentId: s.agentId,
        promptTemplate: s.promptTemplate,
        outputFormat: s.outputFormat,
        inputSource: s.inputSource,
        positionX: s.positionX ?? null,
        positionY: s.positionY ?? null,
      })),
    });
  }

  function addStep(afterStepId: string | null) {
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const insertAfterIdx = afterStepId
      ? sorted.findIndex((s) => s.id === afterStepId)
      : sorted.length - 1;
    const insertAt = insertAfterIdx + 1;
    const created: CanvasStep = {
      id: uid(),
      stepOrder: insertAt + 1,
      name: null,
      agentId: null,
      promptTemplate: "",
      outputFormat: "text",
      inputSource: insertAt === 0 ? "trigger" : "step",
    };
    const before = sorted.slice(0, insertAt);
    const after = sorted.slice(insertAt).map((s) => ({
      ...s,
      stepOrder: s.stepOrder + 1,
    }));
    const next = [...before, created, ...after];
    setSelectedStepId(created.id);
    persistSteps(next);
  }

  function removeStep(id: string) {
    if (steps.length <= 1) return;
    const next = steps
      .filter((s) => s.id !== id)
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    if (selectedStepId === id) setSelectedStepId(null);
    persistSteps(next);
  }

  function updateStep(id: string, patch: Partial<CanvasStep>) {
    const next = steps.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persistSteps(next);
  }

  function updateStepPosition(id: string, x: number, y: number) {
    const next = steps.map((s) =>
      s.id === id ? { ...s, positionX: x, positionY: y } : s
    );
    setSteps(next);
    debouncedSave({
      steps: next.map((s) => ({
        id: s.id.length === 36 ? s.id : undefined,
        stepOrder: s.stepOrder,
        name: s.name,
        agentId: s.agentId,
        promptTemplate: s.promptTemplate,
        outputFormat: s.outputFormat,
        inputSource: s.inputSource,
        positionX: s.positionX ?? null,
        positionY: s.positionY ?? null,
      })),
    });
  }

  // ─── trigger handlers ───────────────────────────────────────────
  function changeTrigger(v: RoutineTriggerType) {
    setTriggerType(v);
    const payload: Record<string, unknown> = { triggerType: v };
    if (v === "SCHEDULE") {
      payload.cronExpression = presetToCron(schedulePreset);
      payload.timezone = timezone;
    }
    if (v === "EVENT") {
      payload.eventBlock = eventBlock;
      payload.eventType = eventType;
    }
    patchRoutine(payload);
  }

  function changeSchedulePreset(p: SchedulePreset) {
    setSchedulePreset(p);
    patchRoutine({ cronExpression: presetToCron(p) });
  }

  function changeTimezone(tz: string) {
    setTimezone(tz);
    patchRoutine({ timezone: tz });
  }

  function changeEvent(block: string | null, type: string | null) {
    setEventBlock(block);
    setEventType(type);
    patchRoutine({ eventBlock: block, eventType: type });
  }

  // ─── identity handlers ──────────────────────────────────────────
  function changeStatus(v: RoutineStatus) {
    setStatus(v);
    patchRoutine({ status: v });
  }
  function commitName() {
    if (name !== routine.name) patchRoutine({ name });
  }
  function commitDescription() {
    if (description !== (routine.description ?? "")) {
      patchRoutine({ description: description || null });
    }
  }
  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    const next = [...tags, tag];
    setTags(next);
    setTagInput("");
    patchRoutine({ tags: next });
  }
  function removeTag(tag: string) {
    const next = tags.filter((x) => x !== tag);
    setTags(next);
    patchRoutine({ tags: next });
  }

  // ─── run / pause / resume ───────────────────────────────────────
  async function runNow() {
    setRunning(true);
    setTraceResults(null);
    try {
      const res = await fetch(`/api/routines/${routine.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Run failed");
        return;
      }
      const finished = json.data as RoutineRunFull & {
        stepResults?: StepRunResult[];
      };
      setRuns((prev) => [
        {
          id: finished.id,
          status: finished.status as RoutineRunStatus,
          triggerSource: finished.triggerSource as
            | "MANUAL"
            | "SCHEDULE"
            | "EVENT"
            | "BACKFILL",
          scheduledFor: finished.scheduledFor,
          startedAt: finished.startedAt,
          completedAt: finished.completedAt,
          durationMs: finished.durationMs,
          error: finished.error,
          createdAt: finished.createdAt,
        },
        ...prev,
      ]);
      if (finished.stepResults) setTraceResults(finished.stepResults);
      setDetailRun(finished);
      toast.success(
        finished.status === "SUCCESS"
          ? t("routines.run.toastSuccess")
          : t("routines.run.toastFailed")
      );
    } finally {
      setRunning(false);
    }
  }

  async function pauseOrResume() {
    const endpoint = status === "ACTIVE" ? "pause" : "resume";
    const res = await fetch(`/api/routines/${routine.id}/${endpoint}`, {
      method: "POST",
    });
    if (res.ok) {
      const json = await res.json();
      setStatus(json.data.status);
    }
  }

  async function openRun(runId: string) {
    const res = await fetch(`/api/routines/${routine.id}/runs?limit=50`);
    if (!res.ok) return;
    const json = await res.json();
    const list = (json.data?.runs ?? []) as (RoutineRunFull & {
      stepResults?: StepRunResult[];
    })[];
    const target = list.find((r) => r.id === runId) ?? null;
    setDetailRun(target);
    if (target?.stepResults) setTraceResults(target.stepResults);
    else setTraceResults(null);
  }

  async function handleDelete() {
    if (!confirm(t("common.confirmDelete", { name }))) return;
    const res = await fetch(`/api/routines/${routine.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/routines");
      router.refresh();
    }
  }

  const triggerSummary =
    triggerType === "SCHEDULE"
      ? humanCron(presetToCron(schedulePreset), locale)
      : triggerType === "EVENT"
        ? eventBlock && eventType
          ? `${eventBlock}.${eventType}`
          : "—"
        : t("routines.trigger.MANUAL");

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedStepId) ?? null,
    [steps, selectedStepId]
  );
  const isFirstStep =
    selectedStep != null &&
    selectedStep.stepOrder ===
      Math.min(...steps.map((s) => s.stepOrder));

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/blocks/routines"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
          <div className="flex items-center gap-3">
            {savedError && (
              <span className="text-xs text-rose-500">{savedError}</span>
            )}
            {savedAt && !savedError && (
              <span className="text-xs text-muted-foreground">
                {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title + status */}
        <div className="flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            placeholder={t("routines.fields.name")}
            className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
          />
          <span
            className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_COLOR[status]}`}
          >
            {t(`routines.status.${status}`)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={runNow} disabled={running} className="gap-2">
            {running ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {t("routines.runNow")}
          </Button>
          {(status === "ACTIVE" || status === "PAUSED") && (
            <Button variant="ghost" onClick={pauseOrResume} className="gap-2">
              <Pause className="h-4 w-4" />
              {status === "ACTIVE"
                ? t("routines.pause")
                : t("routines.resume")}
            </Button>
          )}
          {traceResults && (
            <Button
              variant="ghost"
              onClick={() => setTraceResults(null)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t("routines.clearTrace")}
            </Button>
          )}
        </div>

        {/* Canvas — primary visualization */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center">
                {t("routines.detail.flow")}
                <InfoTip text={t("routines.tooltip.flow")} />
              </h2>
              <p className="text-xs text-muted-foreground">
                {traceResults
                  ? t("routines.detail.flowTraceHint")
                  : t("routines.detail.flowEditHint")}
              </p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <RoutineCanvas
              triggerSummary={triggerSummary}
              triggerType={triggerType}
              steps={steps}
              selectedStepId={selectedStepId}
              stepResults={traceResults ?? undefined}
              onSelectStep={setSelectedStepId}
              onAddStep={addStep}
              onDeleteStep={removeStep}
              onPositionChange={updateStepPosition}
            />
          </div>
        </div>

        {/* Trigger config */}
        <Section
          title={t("routines.fields.trigger")}
          tip={t("routines.tooltip.trigger")}
        >
          <Field label={t("routines.fields.trigger")}>
            <Select
              value={triggerType}
              onValueChange={(v) => changeTrigger(v as RoutineTriggerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">
                  👆 {t("routines.trigger.MANUAL")}
                </SelectItem>
                <SelectItem value="SCHEDULE">
                  ⏰ {t("routines.trigger.SCHEDULE")}
                </SelectItem>
                <SelectItem value="EVENT">
                  🔔 {t("routines.trigger.EVENT")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("routines.fields.status")}>
            <Select
              value={status}
              onValueChange={(v) => changeStatus(v as RoutineStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`routines.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {triggerType === "SCHEDULE" && (
            <div className="col-span-2">
              <ScheduleConfig
                preset={schedulePreset}
                timezone={timezone}
                onPresetChange={changeSchedulePreset}
                onTimezoneChange={changeTimezone}
              />
            </div>
          )}
          {triggerType === "EVENT" && (
            <div className="col-span-2">
              <EventConfig
                block={eventBlock}
                type={eventType}
                onChange={changeEvent}
              />
            </div>
          )}
        </Section>

        {/* Description + tags */}
        <Section title={t("routines.fields.description")}>
          <div className="col-span-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              rows={2}
            />
          </div>
        </Section>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("routines.fields.tags")}
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={t("common.tags.add")}
              className="h-7 w-40 text-xs"
            />
          </div>
        </div>

        {/* Run history */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("routines.run.history")} ({runs.length})
          </Label>
          {runs.length === 0 ? (
            <div className="text-xs text-muted-foreground border border-dashed rounded p-4 text-center">
              {t("routines.run.empty")}
            </div>
          ) : (
            <div className="rounded-md border divide-y">
              {runs.slice(0, 20).map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => openRun(run.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${RUN_STATUS_COLOR[run.status]}`}
                    >
                      {t(`routines.runStatus.${run.status}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {run.triggerSource}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {run.durationMs != null ? `${run.durationMs} ms` : "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <RoutineRunDetail
          run={detailRun}
          open={!!detailRun}
          onOpenChange={(o) => !o && setDetailRun(null)}
        />

        <StepPropertiesSheet
          step={selectedStep}
          isFirstStep={isFirstStep}
          open={!!selectedStep}
          onOpenChange={(o) => {
            if (!o) setSelectedStepId(null);
          }}
          onChange={(patch) => {
            if (selectedStep) updateStep(selectedStep.id, patch);
          }}
          onDelete={() => {
            if (selectedStep) removeStep(selectedStep.id);
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function Section({
  title,
  tip,
  children,
}: {
  title: string;
  tip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <h2 className="text-sm font-semibold flex items-center">
        {title}
        {tip && <InfoTip text={tip} />}
      </h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
