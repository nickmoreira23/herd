import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { MondayService } from "@/lib/services/monday";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapMondayStatus(statusValue: string | null): TaskStatus {
  if (!statusValue) return "TODO";
  const lower = statusValue.toLowerCase();
  if (lower.includes("done") || lower.includes("complete")) return "DONE";
  if (
    lower.includes("working") ||
    lower.includes("in progress") ||
    lower.includes("doing")
  )
    return "IN_PROGRESS";
  if (lower.includes("review")) return "IN_REVIEW";
  if (lower.includes("backlog")) return "BACKLOG";
  if (lower.includes("stuck") || lower.includes("cancel")) return "CANCELLED";
  return "TODO";
}

function mapMondayPriority(priorityValue: string | null): TaskPriority {
  if (!priorityValue) return "NONE";
  const lower = priorityValue.toLowerCase();
  if (lower.includes("critical") || lower.includes("urgent")) return "URGENT";
  if (lower.includes("high")) return "HIGH";
  if (lower.includes("medium")) return "MEDIUM";
  if (lower.includes("low")) return "LOW";
  return "NONE";
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "monday" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Monday is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new MondayService(creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const boards = await service.listBoards();

    for (const board of boards) {
      const result = await service.listItems(board.id);

      for (const item of result.items) {
        try {
          const rawStatus = service.extractStatus(item.column_values);
          const rawPriority = service.extractPriority(item.column_values);
          const rawDueDate = service.extractDueDate(item.column_values);
          const rawAssignee = service.extractAssignee(item.column_values);

          const status: TaskStatus = mapMondayStatus(rawStatus);
          const priority: TaskPriority = mapMondayPriority(rawPriority);
          const sourceUrl = `https://view.monday.com/board/${board.id}/pulses/${item.id}`;

          const existing = await prisma.task.findUnique({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "monday",
                sourceId: item.id,
              },
            },
          });

          await prisma.task.upsert({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "monday",
                sourceId: item.id,
              },
            },
            update: {
              title: item.name,
              status,
              priority,
              dueDate: rawDueDate ? new Date(rawDueDate) : null,
              assignee: rawAssignee,
              projectName: board.name,
              sourceUrl,
              sourceStatus: rawStatus,
              sourcePriority: rawPriority,
              completedAt: status === "DONE" ? new Date() : null,
              updatedAt: new Date(),
            },
            create: {
              title: item.name,
              status,
              priority,
              dueDate: rawDueDate ? new Date(rawDueDate) : null,
              assignee: rawAssignee,
              projectName: board.name,
              sourceIntegration: "monday",
              sourceId: item.id,
              sourceUrl,
              sourceStatus: rawStatus,
              sourcePriority: rawPriority,
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
      where: { slug: "monday" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
