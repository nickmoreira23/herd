import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const reorderRecordsSchema = z.object({
  recordIds: z.array(z.string().uuid()),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;

  const table = await prisma.knowledgeTable.findUnique({ where: { id: tableId } });
  if (!table) return apiError("Table not found", 404);

  const body = await request.json();
  const parsed = reorderRecordsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 400, parsed.error.issues);
  }

  const { recordIds } = parsed.data;

  try {
    await prisma.$transaction(
      recordIds.map((recordId, index) =>
        prisma.knowledgeTableRecord.update({
          where: { id: recordId },
          data: { sortOrder: index },
        })
      )
    );

    return apiSuccess({ reordered: recordIds.length });
  } catch (e) {
    console.error("Record reorder error:", e);
    return apiError("Failed to reorder records", 500);
  }
}
