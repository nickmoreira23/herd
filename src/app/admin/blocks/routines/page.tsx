import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RoutinesClient } from "@/components/routines/routines-client";
import type { RoutineRow } from "@/components/routines/types";
import RoutinesLoading from "./loading";
import { connection } from "next/server";

async function RoutinesContent() {
  await connection();
  const routines = await prisma.routine.findMany({
    include: {
      agent: { select: { id: true, name: true, key: true, icon: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const serialized: RoutineRow[] = routines.map((r) => ({
    ...r,
    contentJson: r.contentJson,
    inputSchema: r.inputSchema,
    defaultInputs: r.defaultInputs,
    eventFilter: r.eventFilter,
    nextRunAt: r.nextRunAt?.toISOString() ?? null,
    lastRunAt: r.lastRunAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })) as RoutineRow[];

  return <RoutinesClient initialRoutines={serialized} />;
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={<RoutinesLoading />}>
      <RoutinesContent />
    </Suspense>
  );
}
