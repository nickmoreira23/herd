import { z } from "zod/v4";
import { isValidCron } from "@/lib/routines/cron";

export const ROUTINE_TRIGGER_TYPES = ["MANUAL", "SCHEDULE", "EVENT"] as const;
export const ROUTINE_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
] as const;
export const ROUTINE_RUN_STATUSES = [
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;
export const ROUTINE_OUTPUT_FORMATS = ["text", "json", "markdown"] as const;

export const routineStepSchema = z.object({
  id: z.string().uuid().optional(),
  stepOrder: z.coerce.number().int().min(1),
  name: z.string().nullable().optional(),
  agentId: z.string().uuid(),
  promptTemplate: z.string().min(1),
  outputFormat: z.enum(ROUTINE_OUTPUT_FORMATS).optional(),
  inputSource: z.enum(["trigger", "step"]).optional(),
  previousStepId: z.string().uuid().nullable().optional(),
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
});

export type RoutineStepInput = z.infer<typeof routineStepSchema>;

const cronExpression = z
  .string()
  .min(1)
  .refine(isValidCron, { message: "Invalid cron expression" });

export const createRoutineSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),

    // Legacy single-step shape — optional when `steps` is provided
    promptTemplate: z.string().optional(),
    agentId: z.string().uuid().optional(),
    outputFormat: z.enum(ROUTINE_OUTPUT_FORMATS).optional(),

    // New multi-step shape
    steps: z.array(routineStepSchema).optional(),

    status: z.enum(ROUTINE_STATUSES).optional(),

    triggerType: z.enum(ROUTINE_TRIGGER_TYPES),
    cronExpression: z.string().optional().nullable(),
    timezone: z.string().optional(),
    eventBlock: z.string().optional().nullable(),
    eventType: z.string().optional().nullable(),
    eventFilter: z.unknown().optional(),

    inputSchema: z.unknown().optional(),
    defaultInputs: z.unknown().optional(),

    ownerId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).optional(),
    contentJson: z.unknown().optional(),
    contentText: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // At least one shape must be provided
    if (!val.steps?.length && (!val.agentId || !val.promptTemplate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either steps[] or (agentId + promptTemplate) is required",
        path: ["steps"],
      });
    }
    if (val.triggerType === "SCHEDULE") {
      if (!val.cronExpression) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "cronExpression is required for SCHEDULE trigger",
          path: ["cronExpression"],
        });
      } else if (!isValidCron(val.cronExpression)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid cron expression",
          path: ["cronExpression"],
        });
      }
    }
    if (val.triggerType === "EVENT") {
      if (!val.eventBlock) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "eventBlock is required for EVENT trigger",
          path: ["eventBlock"],
        });
      }
      if (!val.eventType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "eventType is required for EVENT trigger",
          path: ["eventType"],
        });
      }
    }
  });

// Update schema is a partial version. Re-validation of cron happens in the API
// handler when cronExpression is touched.
export const updateRoutineSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  promptTemplate: z.string().min(1).optional(),
  status: z.enum(ROUTINE_STATUSES).optional(),
  agentId: z.string().uuid().optional(),

  triggerType: z.enum(ROUTINE_TRIGGER_TYPES).optional(),
  cronExpression: cronExpression.nullable().optional(),
  timezone: z.string().optional(),
  eventBlock: z.string().nullable().optional(),
  eventType: z.string().nullable().optional(),
  eventFilter: z.unknown().optional(),

  inputSchema: z.unknown().optional(),
  defaultInputs: z.unknown().optional(),
  outputFormat: z.enum(ROUTINE_OUTPUT_FORMATS).optional(),

  // Multi-step: full replacement of the steps[] array. Pass `id` on rows that
  // existed before to preserve them; new rows get a fresh id.
  steps: z.array(routineStepSchema).optional(),

  ownerId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
});

export const runRoutineSchema = z.object({
  input: z.unknown().optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
