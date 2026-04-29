import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routine = await prisma.routine.update({
      where: { id },
      data: { status: "PAUSED", nextRunAt: null },
    });
    return apiSuccess(routine);
  } catch (e) {
    console.error("POST /api/routines/[id]/pause error:", e);
    return apiError("Failed to pause routine", 500);
  }
}
