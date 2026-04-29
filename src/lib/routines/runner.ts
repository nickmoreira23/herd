import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { resolveAnthropicKey } from "@/lib/integrations";
import { nextRunAt } from "./cron";
import { dispatchBlockEvent } from "./dispatcher";
import type { Prisma } from "@prisma/client";

/**
 * Render a prompt template by replacing `{{key}}` and `{{a.b.c}}` with values
 * from `input`. Missing keys render as empty string. Exported so the wizard
 * can show the same rendered output as a "Test render" preview.
 */
export function renderTemplate(
  template: string,
  input: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const v = key.split(".").reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[k]
          : undefined,
      input
    );
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  });
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const WORKER_ID =
  typeof process !== "undefined" ? `worker:${process.pid}` : "worker";

export interface StepResult {
  stepId: string;
  stepOrder: number;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  output?: string;
  outputJson?: unknown;
  error?: string;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  startedAt: string;
  completedAt: string;
}

/**
 * Execute a single RoutineRun. Walks the routine's steps in order, threading
 * each step's output into the next via the `previousOutput` variable. Atomic
 * QUEUED → RUNNING claim makes this safe to call concurrently from multiple
 * workers.
 */
export async function runRoutine(runId: string): Promise<void> {
  // 1. Atomic claim
  const claim = await prisma.routineRun.updateMany({
    where: { id: runId, status: "QUEUED" },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      lockedBy: WORKER_ID,
      lockedAt: new Date(),
    },
  });
  if (claim.count === 0) return;

  const start = Date.now();
  let routineId: string | null = null;

  try {
    const run = await prisma.routineRun.findUnique({
      where: { id: runId },
      include: {
        routine: {
          include: {
            steps: { orderBy: { stepOrder: "asc" }, include: { agent: true } },
            agent: true, // legacy fallback
          },
        },
      },
    });
    if (!run) throw new Error("Run not found after claim");
    routineId = run.routineId;

    type ExecStep = {
      stepId: string;
      stepOrder: number;
      agentSystemPrompt: string | null;
      agentModelId: string | null;
      agentTemperature: number | null;
      agentMaxTokens: number | null;
      promptTemplate: string;
      outputFormat: string;
      inputSource: "trigger" | "step";
    };

    let execSteps: ExecStep[] = [];
    if (run.routine.steps.length > 0) {
      execSteps = run.routine.steps.map((s) => ({
        stepId: s.id,
        stepOrder: s.stepOrder,
        agentSystemPrompt: s.agent.systemPrompt ?? null,
        agentModelId: s.agent.modelId ?? null,
        agentTemperature:
          s.agent.temperature == null ? null : Number(s.agent.temperature),
        agentMaxTokens: s.agent.maxTokens ?? null,
        promptTemplate: s.promptTemplate,
        outputFormat: s.outputFormat ?? "text",
        inputSource: (s.inputSource as "trigger" | "step") ?? "trigger",
      }));
    } else if (run.routine.promptTemplate) {
      execSteps = [
        {
          stepId: "legacy",
          stepOrder: 1,
          agentSystemPrompt: run.routine.agent?.systemPrompt ?? null,
          agentModelId: run.routine.agent?.modelId ?? null,
          agentTemperature:
            run.routine.agent?.temperature == null
              ? null
              : Number(run.routine.agent.temperature),
          agentMaxTokens: run.routine.agent?.maxTokens ?? null,
          promptTemplate: run.routine.promptTemplate,
          outputFormat: run.routine.outputFormat ?? "text",
          inputSource: "trigger",
        },
      ];
    } else {
      throw new Error("Routine has no steps and no legacy prompt");
    }

    const defaults = (run.routine.defaultInputs ?? {}) as Record<string, unknown>;
    const provided = (run.input ?? {}) as Record<string, unknown>;
    const triggerInput = { ...defaults, ...provided };

    const apiKey = await resolveAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const stepResults: StepResult[] = [];
    let lastOutput = "";

    for (const step of execSteps) {
      const stepStart = Date.now();
      const stepStartedAt = new Date().toISOString();

      const stepInput =
        step.inputSource === "step"
          ? { ...triggerInput, previousOutput: lastOutput }
          : triggerInput;

      const userMessage = renderTemplate(step.promptTemplate, stepInput);

      const model = step.agentModelId || DEFAULT_MODEL;
      const maxTokens = step.agentMaxTokens ?? 2048;

      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        ...(step.agentTemperature != null
          ? { temperature: step.agentTemperature }
          : {}),
        ...(step.agentSystemPrompt ? { system: step.agentSystemPrompt } : {}),
        messages: [{ role: "user", content: userMessage }],
      });

      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      let outputJson: unknown = null;
      if (step.outputFormat === "json") {
        try {
          outputJson = JSON.parse(text);
        } catch {
          /* leave null */
        }
      }

      stepResults.push({
        stepId: step.stepId,
        stepOrder: step.stepOrder,
        status: "SUCCESS",
        output: text,
        outputJson: outputJson ?? undefined,
        durationMs: Date.now() - stepStart,
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        startedAt: stepStartedAt,
        completedAt: new Date().toISOString(),
      });

      lastOutput = text;
    }

    const totalPromptTokens = stepResults.reduce(
      (sum, s) => sum + (s.promptTokens ?? 0),
      0
    );
    const totalCompletionTokens = stepResults.reduce(
      (sum, s) => sum + (s.completionTokens ?? 0),
      0
    );

    const completedAt = new Date();
    await prisma.$transaction([
      prisma.routineRun.update({
        where: { id: runId },
        data: {
          status: "SUCCESS",
          completedAt,
          durationMs: Date.now() - start,
          input: triggerInput as Prisma.InputJsonValue,
          output: lastOutput,
          stepResults: stepResults as unknown as Prisma.InputJsonValue,
          promptTokens: totalPromptTokens || null,
          completionTokens: totalCompletionTokens || null,
        },
      }),
      prisma.routine.update({
        where: { id: routineId! },
        data: {
          lastRunAt: completedAt,
          lastRunStatus: "SUCCESS",
          runCount: { increment: 1 },
          successCount: { increment: 1 },
        },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const completedAt = new Date();

    let rid = routineId;
    let routineName = "";
    if (!rid) {
      const failingRun = await prisma.routineRun.findUnique({
        where: { id: runId },
        select: { routineId: true, routine: { select: { name: true } } },
      });
      rid = failingRun?.routineId ?? null;
      routineName = failingRun?.routine?.name ?? "";
    }

    await prisma.$transaction([
      prisma.routineRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt,
          durationMs: Date.now() - start,
          error: message.slice(0, 8000),
        },
      }),
      ...(rid
        ? [
            prisma.routine.update({
              where: { id: rid },
              data: {
                lastRunAt: completedAt,
                lastRunStatus: "FAILED",
                runCount: { increment: 1 },
                failureCount: { increment: 1 },
              },
            }),
          ]
        : []),
    ]);

    if (rid) {
      void dispatchBlockEvent("routines", "run_failed", {
        routineId: rid,
        name: routineName,
        runId,
        error: message.slice(0, 500),
      });
    }
  }
}

/** Recompute and persist the next firing time for a SCHEDULE routine. */
export async function refreshNextRunAt(routineId: string): Promise<void> {
  const r = await prisma.routine.findUnique({ where: { id: routineId } });
  if (!r) return;
  if (r.triggerType !== "SCHEDULE" || !r.cronExpression) {
    if (r.nextRunAt !== null) {
      await prisma.routine.update({
        where: { id: routineId },
        data: { nextRunAt: null },
      });
    }
    return;
  }
  const next = nextRunAt(r.cronExpression, r.timezone);
  await prisma.routine.update({
    where: { id: routineId },
    data: { nextRunAt: next },
  });
}
