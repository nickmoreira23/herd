import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { saveSnapshotSchema } from "@/lib/validators/financial";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snapshot = await prisma.financialSnapshot.findUnique({
      where: { id },
    });
    if (!snapshot) return apiError("Snapshot not found", 404);
    return apiSuccess(snapshot);
  } catch (e) {
    console.error("GET /api/financials/[id] error:", e);
    return apiError("Failed to fetch snapshot", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, saveSnapshotSchema);
    if ("error" in result) return result.error;

    const snapshot = await prisma.financialSnapshot.update({
      where: { id },
      data: {
        scenarioName: result.data.scenarioName,
        color: result.data.color,
        assumptions: result.data.assumptions as unknown as Record<string, never>,
        results: result.data.results as unknown as Record<string, never>,
        notes: result.data.notes,
      },
    });

    return apiSuccess(snapshot);
  } catch (e) {
    console.error("PATCH /api/financials/[id] error:", e);
    return apiError("Failed to update snapshot", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.financialSnapshot.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/financials/[id] error:", e);
    return apiError("Failed to delete snapshot", 500);
  }
}
