import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createRoutineSchema } from "@/lib/validators/routines";
import { nextRunAt } from "@/lib/routines/cron";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const triggerType = searchParams.get("triggerType");
    const agentId = searchParams.get("agentId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.RoutineWhereInput = {};
    if (status) where.status = status as Prisma.RoutineWhereInput["status"];
    if (triggerType)
      where.triggerType = triggerType as Prisma.RoutineWhereInput["triggerType"];
    if (agentId) where.agentId = agentId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { promptTemplate: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [routines, total] = await Promise.all([
      prisma.routine.findMany({
        where,
        include: {
          _count: { select: { runs: true } },
          agent: { select: { id: true, name: true, key: true, icon: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.routine.count({ where }),
    ]);

    return apiSuccess({ routines, total });
  } catch (e) {
    console.error("GET /api/routines error:", e);
    return apiError("Failed to fetch routines", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createRoutineSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const tz = body.timezone ?? "America/Sao_Paulo";

    const computedNext =
      body.triggerType === "SCHEDULE" && body.cronExpression
        ? nextRunAt(body.cronExpression, tz)
        : null;

    // Resolve steps. Either we got `steps[]` directly, or we wrap the legacy
    // single-step shape (agentId + promptTemplate) into one step.
    const stepsToCreate =
      body.steps && body.steps.length > 0
        ? body.steps.map((s, i) => ({
            stepOrder: s.stepOrder ?? i + 1,
            name: s.name ?? null,
            agentId: s.agentId,
            promptTemplate: s.promptTemplate,
            outputFormat: s.outputFormat ?? "text",
            inputSource: s.inputSource ?? "trigger",
            previousStepId: s.previousStepId ?? null,
            positionX: s.positionX ?? null,
            positionY: s.positionY ?? null,
          }))
        : body.agentId && body.promptTemplate
          ? [
              {
                stepOrder: 1,
                name: null,
                agentId: body.agentId,
                promptTemplate: body.promptTemplate,
                outputFormat: body.outputFormat ?? "text",
                inputSource: "trigger" as const,
                previousStepId: null,
                positionX: null,
                positionY: null,
              },
            ]
          : [];

    if (stepsToCreate.length === 0) {
      return apiError("Routine needs at least one step or a legacy prompt", 400);
    }

    // The Routine.agentId / Routine.promptTemplate fields are kept for
    // backward compatibility; mirror the first step into them.
    const head = stepsToCreate[0];

    const routine = await prisma.routine.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        promptTemplate: head.promptTemplate,
        status: body.status ?? "DRAFT",
        agentId: head.agentId,
        triggerType: body.triggerType,
        cronExpression: body.cronExpression ?? null,
        timezone: tz,
        eventBlock: body.eventBlock ?? null,
        eventType: body.eventType ?? null,
        eventFilter: (body.eventFilter ?? {}) as Prisma.InputJsonValue,
        inputSchema: (body.inputSchema ?? {}) as Prisma.InputJsonValue,
        defaultInputs: (body.defaultInputs ?? {}) as Prisma.InputJsonValue,
        outputFormat: head.outputFormat,
        ownerId: body.ownerId ?? null,
        tags: body.tags ?? [],
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        nextRunAt: computedNext,
        steps: { create: stepsToCreate },
      },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        agent: { select: { id: true, name: true, key: true, icon: true } },
      },
    });
    return apiSuccess(routine, 201);
  } catch (e) {
    console.error("POST /api/routines error:", e);
    return apiError("Failed to create routine", 500);
  }
}
