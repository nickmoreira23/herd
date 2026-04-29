import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { nextRunAt } from "@/lib/routines/cron";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.routine.findUnique({ where: { id } });
    if (!existing) return apiError("Routine not found", 404);

    const next =
      existing.triggerType === "SCHEDULE" && existing.cronExpression
        ? nextRunAt(existing.cronExpression, existing.timezone)
        : null;

    const routine = await prisma.routine.update({
      where: { id },
      data: { status: "ACTIVE", nextRunAt: next },
    });
    return apiSuccess(routine);
  } catch (e) {
    console.error("POST /api/routines/[id]/resume error:", e);
    return apiError("Failed to resume routine", 500);
  }
}
