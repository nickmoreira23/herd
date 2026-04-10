import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { saveSnapshotSchema } from "@/lib/validators/financial";

export async function GET() {
  try {
    const snapshots = await prisma.financialSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        scenarioName: true,
        color: true,
        notes: true,
        results: true,
        createdAt: true,
      },
    });
    return apiSuccess(snapshots);
  } catch (e) {
    console.error("GET /api/financials error:", e);
    return apiError("Failed to fetch snapshots", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, saveSnapshotSchema);
    if ("error" in result) return result.error;

    const snapshot = await prisma.financialSnapshot.create({
      data: {
        scenarioName: result.data.scenarioName,
        color: result.data.color,
        assumptions: result.data.assumptions as unknown as Record<string, never>,
        results: result.data.results as unknown as Record<string, never>,
        notes: result.data.notes,
      },
    });

    return apiSuccess(snapshot, 201);
  } catch (e) {
    console.error("POST /api/financials error:", e);
    return apiError("Failed to save snapshot", 500);
  }
}
