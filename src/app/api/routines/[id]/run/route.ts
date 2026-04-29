import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { runRoutineSchema } from "@/lib/validators/routines";
import { runRoutine } from "@/lib/routines/runner";
import type { Prisma } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, runRoutineSchema);
  if ("error" in result) return result.error;

  try {
    const routine = await prisma.routine.findUnique({ where: { id } });
    if (!routine) return apiError("Routine not found", 404);

    const run = await prisma.routineRun.create({
      data: {
        routineId: id,
        triggerSource: "MANUAL",
        input: (result.data.input ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Synchronous execution for snappy UX. The runner is concurrency-safe so a
    // duplicate POST while a previous one is still running won't double-fire.
    await runRoutine(run.id);

    const finalRun = await prisma.routineRun.findUnique({
      where: { id: run.id },
    });
    return apiSuccess(finalRun);
  } catch (e) {
    console.error("POST /api/routines/[id]/run error:", e);
    return apiError("Failed to run routine", 500);
  }
}
