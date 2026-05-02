import { z } from "zod/v4";

export const FEEDBACK_TYPES = [
  "SUGGESTION",
  "BUG",
  "COMPLAINT",
  "PRAISE",
  "QUESTION",
  "IDEA",
] as const;

export const FEEDBACK_STATUSES = [
  "NEW",
  "TRIAGED",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "DECLINED",
] as const;

export const FEEDBACK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

const entityPair = z
  .object({
    entityType: z.string().min(1).optional(),
    entityId: z.string().uuid().optional(),
  })
  .refine(
    (v) => (v.entityType && v.entityId) || (!v.entityType && !v.entityId),
    {
      message: "entityType and entityId must be provided together",
      path: ["entityId"],
    }
  );

export const createFeedbackSchema = z
  .object({
    title: z.string().min(1),
    contentJson: z.unknown().optional(),
    contentText: z.string().optional(),
    type: z.enum(FEEDBACK_TYPES).optional(),
    status: z.enum(FEEDBACK_STATUSES).optional(),
    priority: z.enum(FEEDBACK_PRIORITIES).optional(),
    source: z.string().nullable().optional(),
    submitterName: z.string().nullable().optional(),
    submitterEmail: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .and(entityPair);

export const updateFeedbackSchema = z
  .object({
    title: z.string().min(1).optional(),
    contentJson: z.unknown().optional(),
    contentText: z.string().optional(),
    type: z.enum(FEEDBACK_TYPES).optional(),
    status: z.enum(FEEDBACK_STATUSES).optional(),
    priority: z.enum(FEEDBACK_PRIORITIES).optional(),
    source: z.string().nullable().optional(),
    submitterName: z.string().nullable().optional(),
    submitterEmail: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .and(entityPair);

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
