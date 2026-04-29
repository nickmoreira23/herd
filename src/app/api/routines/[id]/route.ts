import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateRoutineSchema } from "@/lib/validators/routines";
import { nextRunAt } from "@/lib/routines/cron";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, key: true, icon: true } },
        steps: {
          orderBy: { stepOrder: "asc" },
          include: {
            agent: { select: { id: true, name: true, key: true, icon: true } },
          },
        },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            triggerSource: true,
            scheduledFor: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            error: true,
            createdAt: true,
          },
        },
        _count: { select: { runs: true } },
      },
    });
    if (!routine) return apiError("Routine not found", 404);
    return apiSuccess(routine);
  } catch (e) {
    console.error("GET /api/routines/[id] error:", e);
    return apiError("Failed to fetch routine", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateRoutineSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.routine.findUnique({ where: { id } });
    if (!existing) return apiError("Routine not found", 404);

    const data: Prisma.RoutineUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.promptTemplate !== undefined) data.promptTemplate = body.promptTemplate;
    if (body.status !== undefined) data.status = body.status;
    if (body.agentId !== undefined)
      data.agent = { connect: { id: body.agentId } };
    if (body.triggerType !== undefined) data.triggerType = body.triggerType;
    if (body.cronExpression !== undefined) data.cronExpression = body.cronExpression ?? null;
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.eventBlock !== undefined) data.eventBlock = body.eventBlock ?? null;
    if (body.eventType !== undefined) data.eventType = body.eventType ?? null;
    if (body.eventFilter !== undefined)
      data.eventFilter = body.eventFilter as Prisma.InputJsonValue;
    if (body.inputSchema !== undefined)
      data.inputSchema = body.inputSchema as Prisma.InputJsonValue;
    if (body.defaultInputs !== undefined)
      data.defaultInputs = body.defaultInputs as Prisma.InputJsonValue;
    if (body.outputFormat !== undefined) data.outputFormat = body.outputFormat;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;

    // Recompute nextRunAt if cron-related fields changed
    const newTriggerType = body.triggerType ?? existing.triggerType;
    const newCron =
      body.cronExpression !== undefined
        ? body.cronExpression
        : existing.cronExpression;
    const newTz =
      body.timezone !== undefined ? body.timezone : existing.timezone;
    const newStatus = body.status ?? existing.status;

    if (newTriggerType === "SCHEDULE" && newCron && newStatus === "ACTIVE") {
      data.nextRunAt = nextRunAt(newCron, newTz);
    } else if (newTriggerType !== "SCHEDULE" || !newCron || newStatus !== "ACTIVE") {
      data.nextRunAt = null;
    }

    // Multi-step replacement: if `steps` was provided, diff against existing.
    // Rows with `id` are updated in place; rows without `id` are created;
    // existing rows whose id is not in the new array are deleted.
    if (body.steps !== undefined) {
      const incoming = body.steps;
      const existingSteps = await prisma.routineStep.findMany({
        where: { routineId: id },
        select: { id: true },
      });
      const incomingIds = new Set(incoming.map((s) => s.id).filter(Boolean));
      const toDelete = existingSteps
        .filter((s) => !incomingIds.has(s.id))
        .map((s) => s.id);

      // Mirror first step into the legacy fields for backward compatibility.
      const head = incoming[0];
      if (head) {
        data.agent = { connect: { id: head.agentId } };
        data.promptTemplate = head.promptTemplate;
        data.outputFormat = head.outputFormat ?? "text";
      }

      await prisma.$transaction([
        prisma.routine.update({ where: { id }, data }),
        ...(toDelete.length
          ? [prisma.routineStep.deleteMany({ where: { id: { in: toDelete } } })]
          : []),
        // Two-pass to avoid the @@unique([routineId, stepOrder]) collision when
        // re-numbering existing rows: first park them in the negative range,
        // then write the final stepOrder.
        prisma.routineStep.updateMany({
          where: { routineId: id, id: { in: existingSteps.map((s) => s.id) } },
          data: { stepOrder: { multiply: -1 } },
        }),
        ...incoming.map((s, i) => {
          const order = s.stepOrder ?? i + 1;
          if (s.id && !toDelete.includes(s.id)) {
            return prisma.routineStep.update({
              where: { id: s.id },
              data: {
                stepOrder: order,
                name: s.name ?? null,
                agentId: s.agentId,
                promptTemplate: s.promptTemplate,
                outputFormat: s.outputFormat ?? "text",
                inputSource: s.inputSource ?? "trigger",
                previousStepId: s.previousStepId ?? null,
                positionX: s.positionX ?? null,
                positionY: s.positionY ?? null,
              },
            });
          }
          return prisma.routineStep.create({
            data: {
              routineId: id,
              stepOrder: order,
              name: s.name ?? null,
              agentId: s.agentId,
              promptTemplate: s.promptTemplate,
              outputFormat: s.outputFormat ?? "text",
              inputSource: s.inputSource ?? "trigger",
              previousStepId: s.previousStepId ?? null,
              positionX: s.positionX ?? null,
              positionY: s.positionY ?? null,
            },
          });
        }),
      ]);

      const updated = await prisma.routine.findUnique({
        where: { id },
        include: {
          agent: { select: { id: true, name: true, key: true, icon: true } },
          steps: {
            orderBy: { stepOrder: "asc" },
            include: {
              agent: { select: { id: true, name: true, key: true, icon: true } },
            },
          },
        },
      });
      return apiSuccess(updated);
    }

    const routine = await prisma.routine.update({ where: { id }, data });
    return apiSuccess(routine);
  } catch (e) {
    console.error("PATCH /api/routines/[id] error:", e);
    return apiError("Failed to update routine", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.routine.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/routines/[id] error:", e);
    return apiError("Failed to delete routine", 500);
  }
}
