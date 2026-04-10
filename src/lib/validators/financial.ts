import { z } from "zod";

export const saveSnapshotSchema = z.object({
  scenarioName: z.string().min(1, "Model name is required"),
  color: z.string().optional(),
  assumptions: z.record(z.unknown()),
  results: z.record(z.unknown()),
  notes: z.string().optional(),
});

export type SaveSnapshotInput = z.infer<typeof saveSnapshotSchema>;
