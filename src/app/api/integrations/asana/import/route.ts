import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { AsanaService } from "@/lib/services/asana";
import type { AsanaTask } from "@/lib/services/asana";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapAsanaStatus(task: AsanaTask): TaskStatus {
  return task.completed ? "DONE" : "TODO";
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "asana" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Asana is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new AsanaService(creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const workspaces = await service.listWorkspaces();

    for (const workspace of workspaces) {
      const projects = await service.listProjects(workspace.gid);

      for (const project of projects) {
        const tasks = await service.listTasks(project.gid);

        for (const task of tasks) {
          try {
            const status: TaskStatus = mapAsanaStatus(task);
            const priority: TaskPriority = "NONE";

            const existing = await prisma.task.findUnique({
              where: {
                sourceIntegration_sourceId: {
                  sourceIntegration: "asana",
                  sourceId: task.gid,
                },
              },
            });

            await prisma.task.upsert({
              where: {
                sourceIntegration_sourceId: {
                  sourceIntegration: "asana",
                  sourceId: task.gid,
                },
              },
              update: {
                title: task.name,
                description: task.notes || null,
                status,
                priority,
                dueDate: task.due_on ? new Date(task.due_on) : null,
                assignee: task.assignee?.name ?? null,
                assigneeEmail: task.assignee?.email ?? null,
                projectName: project.name,
                labels: task.tags.map((t) => t.name),
                sourceUrl: task.permalink_url,
                sourceStatus: task.completed ? "completed" : "incomplete",
                sourcePriority: null,
                completedAt: task.completed_at
                  ? new Date(task.completed_at)
                  : null,
                updatedAt: new Date(),
              },
              create: {
                title: task.name,
                description: task.notes || null,
                status,
                priority,
                dueDate: task.due_on ? new Date(task.due_on) : null,
                assignee: task.assignee?.name ?? null,
                assigneeEmail: task.assignee?.email ?? null,
                projectName: project.name,
                labels: task.tags.map((t) => t.name),
                sourceIntegration: "asana",
                sourceId: task.gid,
                sourceUrl: task.permalink_url,
                sourceStatus: task.completed ? "completed" : "incomplete",
                sourcePriority: null,
                completedAt: task.completed_at
                  ? new Date(task.completed_at)
                  : null,
              },
            });

            if (existing) {
              updated++;
            } else {
              imported++;
            }
          } catch {
            errors++;
          }
        }
      }
    }

    await prisma.integration.update({
      where: { slug: "asana" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
