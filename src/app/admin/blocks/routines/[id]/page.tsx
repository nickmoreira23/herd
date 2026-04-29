import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoutineDetailClient } from "@/components/routines/routine-detail-client";
import type { RoutineDetail } from "@/components/routines/types";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    },
  });
  if (!routine) notFound();

  const serialized: RoutineDetail = {
    ...routine,
    contentJson: routine.contentJson,
    inputSchema: routine.inputSchema,
    defaultInputs: routine.defaultInputs,
    eventFilter: routine.eventFilter,
    nextRunAt: routine.nextRunAt?.toISOString() ?? null,
    lastRunAt: routine.lastRunAt?.toISOString() ?? null,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    steps: routine.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      name: s.name,
      agentId: s.agentId,
      agent: s.agent,
      promptTemplate: s.promptTemplate,
      outputFormat: s.outputFormat as "text" | "json" | "markdown",
      inputSource: (s.inputSource as "trigger" | "step") ?? "trigger",
      positionX: s.positionX,
      positionY: s.positionY,
    })),
    runs: routine.runs.map((run) => ({
      ...run,
      scheduledFor: run.scheduledFor.toISOString(),
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
    })),
  } as RoutineDetail;

  return <RoutineDetailClient routine={serialized} />;
}
