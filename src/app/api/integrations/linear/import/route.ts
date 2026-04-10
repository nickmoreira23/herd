import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { LinearService } from "@/lib/services/linear";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapLinearStatus(stateType: string): TaskStatus {
  switch (stateType) {
    case "backlog":
      return "BACKLOG";
    case "unstarted":
      return "TODO";
    case "started":
      return "IN_PROGRESS";
    case "completed":
      return "DONE";
    case "cancelled":
      return "CANCELLED";
    default:
      return "TODO";
  }
}

function mapLinearPriority(priority: number): TaskPriority {
  switch (priority) {
    case 0:
      return "NONE";
    case 1:
      return "URGENT";
    case 2:
      return "HIGH";
    case 3:
      return "MEDIUM";
    case 4:
      return "LOW";
    default:
      return "NONE";
  }
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "linear" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Linear is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new LinearService(creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const teams = await service.listTeams();

    for (const team of teams) {
      const result = await service.listIssues(team.id);

      for (const issue of result.nodes) {
        try {
          const status: TaskStatus = mapLinearStatus(issue.state.type);
          const priority: TaskPriority = mapLinearPriority(issue.priority);

          const existing = await prisma.task.findUnique({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "linear",
                sourceId: issue.id,
              },
            },
          });

          await prisma.task.upsert({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "linear",
                sourceId: issue.id,
              },
            },
            update: {
              title: issue.title,
              description: issue.description,
              status,
              priority,
              dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
              assignee: issue.assignee?.name ?? null,
              assigneeEmail: issue.assignee?.email ?? null,
              projectName: issue.project?.name ?? team.name,
              labels: issue.labels.nodes.map((l) => l.name),
              sourceUrl: issue.url,
              sourceStatus: issue.state.name,
              sourcePriority: issue.priorityLabel,
              completedAt: status === "DONE" ? new Date() : null,
              updatedAt: new Date(),
            },
            create: {
              title: issue.title,
              description: issue.description,
              status,
              priority,
              dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
              assignee: issue.assignee?.name ?? null,
              assigneeEmail: issue.assignee?.email ?? null,
              projectName: issue.project?.name ?? team.name,
              labels: issue.labels.nodes.map((l) => l.name),
              sourceIntegration: "linear",
              sourceId: issue.id,
              sourceUrl: issue.url,
              sourceStatus: issue.state.name,
              sourcePriority: issue.priorityLabel,
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

    await prisma.integration.update({
      where: { slug: "linear" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
