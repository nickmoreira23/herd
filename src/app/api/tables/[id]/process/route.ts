import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { processTable } from "@/lib/tables/table-processor";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const table = await prisma.knowledgeTable.findUnique({ where: { id } });
  if (!table) return apiError("Not found", 404);

  if (table.status === "PROCESSING") {
    return apiError("Table is already being processed", 409);
  }

  try {
    await processTable(id);

    const updated = await prisma.knowledgeTable.findUnique({ where: { id } });
    return apiSuccess(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Processing failed";
    return apiError(message, 500);
  }
}
