import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

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
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return apiError("Task not found", 404);

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.assignee !== undefined) data.assignee = body.assignee;
    if (body.assigneeEmail !== undefined) data.assigneeEmail = body.assigneeEmail;
    if (body.labels !== undefined) data.labels = body.labels;
    if (body.completedAt !== undefined) data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body.projectName !== undefined) data.projectName = body.projectName;

    const task = await prisma.task.update({
      where: { id },
      data,
    });

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
