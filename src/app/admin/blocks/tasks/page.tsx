import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { TaskRow } from "@/components/tasks/types";
import TasksLoading from "./loading";
import { connection } from "next/server";

async function TasksContent() {
  await connection();
  const [tasks, integrations] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.integration.findMany({
      where: { category: "PROJECT_MANAGEMENT" },
    }),
  ]);

  const serialized: TaskRow[] = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
  }));

  return <TasksClient initialTasks={serialized} integrations={integrations} />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksContent />
    </Suspense>
  );
}
