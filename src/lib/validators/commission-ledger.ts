import { z } from "zod";

export const ledgerQuerySchema = z.object({
  partnerId: z.string().uuid().optional(),
  orgNodeId: z.string().uuid().optional(),
  agreementId: z.string().uuid().optional(),
  entryType: z.enum(["EARNED", "HELD", "RELEASED", "CLAWED_BACK", "ADJUSTED"]).optional(),
  source: z.enum(["UPFRONT_BONUS", "RESIDUAL", "OVERRIDE", "ACCELERATOR_BONUS", "CLAWBACK", "MANUAL_ADJUSTMENT"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const manualEntrySchema = z.object({
  orgNodeId: z.string().uuid(),
  agreementId: z.string().uuid().optional(),
  entryType: z.enum(["EARNED", "HELD", "RELEASED", "CLAWED_BACK", "ADJUSTED"]),
  source: z.enum(["UPFRONT_BONUS", "RESIDUAL", "OVERRIDE", "ACCELERATOR_BONUS", "CLAWBACK", "MANUAL_ADJUSTMENT"]),
  amount: z.coerce.number(),
  subscriptionTierId: z.string().uuid().optional(),
  relatedEntryId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
});

export type LedgerQueryInput = z.infer<typeof ledgerQuerySchema>;
export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
