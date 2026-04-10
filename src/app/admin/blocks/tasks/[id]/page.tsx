import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";
import type { TaskRow } from "@/components/tasks/types";
import TaskDetailLoading from "./loading";
import { connection } from "next/server";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

async function TaskContent({ id }: { id: string }) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!task) notFound();

  const serialized: TaskRow & { children: TaskRow[] } = {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    children: task.children.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      dueDate: c.dueDate?.toISOString() ?? null,
      completedAt: c.completedAt?.toISOString() ?? null,
    })),
  };

  return <TaskDetailClient initialTask={serialized} />;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  await connection();
  const { id } = await params;

  return (
    <Suspense fallback={<TaskDetailLoading />}>
      <TaskContent id={id} />
    </Suspense>
  );
}
