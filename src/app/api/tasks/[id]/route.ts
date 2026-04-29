import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateTaskSchema } from "@/lib/validators/tasks";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return apiError("Task not found", 404);
    return apiSuccess(task);
  } catch (e) {
    console.error("GET /api/tasks/[id] error:", e);
    return apiError("Failed to fetch task", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateTaskSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return apiError("Task not found", 404);

    const data: Prisma.TaskUpdateInput = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ?? null;
    if (body.assignee !== undefined) data.assignee = body.assignee ?? null;
    if (body.assigneeEmail !== undefined) data.assigneeEmail = body.assigneeEmail ?? null;
    if (body.labels !== undefined) data.labels = body.labels;
    if (body.completedAt !== undefined) data.completedAt = body.completedAt ?? null;
    if (body.projectName !== undefined) data.projectName = body.projectName ?? null;

    const task = await prisma.task.update({ where: { id }, data });
    return apiSuccess(task);
  } catch (e) {
    console.error("PATCH /api/tasks/[id] error:", e);
    return apiError("Failed to update task", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/tasks/[id] error:", e);
    return apiError("Failed to delete task", 500);
  }
}
