import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { ClickUpService } from "@/lib/services/clickup";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapClickUpStatus(statusType: string): TaskStatus {
  switch (statusType) {
    case "open":
      return "TODO";
    case "active":
    case "custom":
      return "IN_PROGRESS";
    case "done":
    case "closed":
      return "DONE";
    default:
      return "TODO";
  }
}

function mapClickUpPriority(priorityId: string | undefined): TaskPriority {
  switch (priorityId) {
    case "1":
      return "URGENT";
    case "2":
      return "HIGH";
    case "3":
      return "MEDIUM";
    case "4":
      return "LOW";
    default:
      return "NONE";
  }
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "clickup" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("ClickUp is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new ClickUpService(creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const workspaces = await service.listWorkspaces();

    for (const workspace of workspaces) {
      const spaces = await service.listSpaces(workspace.id);

      for (const space of spaces) {
        // Collect all lists: folderless lists + lists inside folders
        const allLists = await service.listFolderlessLists(space.id);

        const folders = await service.listFolders(space.id);
        for (const folder of folders) {
          const folderLists = await service.listLists(folder.id);
          allLists.push(...folderLists);
        }

        for (const list of allLists) {
          const tasks = await service.listTasks(list.id);

          for (const task of tasks) {
            try {
              const status: TaskStatus = mapClickUpStatus(task.status.type);
              const priority: TaskPriority = mapClickUpPriority(
                task.priority?.id
              );

              const existing = await prisma.task.findUnique({
                where: {
                  sourceIntegration_sourceId: {
                    sourceIntegration: "clickup",
                    sourceId: task.id,
                  },
                },
              });

              await prisma.task.upsert({
                where: {
                  sourceIntegration_sourceId: {
                    sourceIntegration: "clickup",
                    sourceId: task.id,
                  },
                },
                update: {
                  title: task.name,
                  description: task.description,
                  status,
                  priority,
                  dueDate: task.due_date
                    ? new Date(parseInt(task.due_date))
                    : null,
                  assignee: task.assignees[0]?.username ?? null,
                  projectName: task.list.name,
                  labels: task.tags.map((t) => t.name),
                  sourceUrl: task.url,
                  sourceStatus: task.status.status,
                  sourcePriority: task.priority?.priority ?? null,
                  completedAt: status === "DONE" ? new Date() : null,
                  updatedAt: new Date(),
                },
                create: {
                  title: task.name,
                  description: task.description,
                  status,
                  priority,
                  dueDate: task.due_date
                    ? new Date(parseInt(task.due_date))
                    : null,
                  assignee: task.assignees[0]?.username ?? null,
                  projectName: task.list.name,
                  labels: task.tags.map((t) => t.name),
                  sourceIntegration: "clickup",
                  sourceId: task.id,
                  sourceUrl: task.url,
                  sourceStatus: task.status.status,
                  sourcePriority: task.priority?.priority ?? null,
                  completedAt: status === "DONE" ? new Date() : null,
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
    }

    await prisma.integration.update({
      where: { slug: "clickup" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
