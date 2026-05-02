import { z } from "zod/v4";

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

export const createNoteSchema = z
  .object({
    title: z.string().min(1),
    contentJson: z.unknown().optional(),
    contentText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
  })
  .and(entityPair);

export const updateNoteSchema = z
  .object({
    title: z.string().min(1).optional(),
    contentJson: z.unknown().optional(),
    contentText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .and(entityPair);

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
