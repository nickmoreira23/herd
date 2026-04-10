import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { NotionTasksService } from "@/lib/services/notion-tasks";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapNotionStatus(statusValue: string | null): TaskStatus {
  if (!statusValue) return "TODO";
  const lower = statusValue.toLowerCase();
  if (lower.includes("done") || lower.includes("complete")) return "DONE";
  if (
    lower.includes("in progress") ||
    lower.includes("doing") ||
    lower.includes("active")
  )
    return "IN_PROGRESS";
  if (lower.includes("in review") || lower.includes("review"))
    return "IN_REVIEW";
  if (lower.includes("backlog")) return "BACKLOG";
  if (lower.includes("cancel")) return "CANCELLED";
  return "TODO";
}

function mapNotionPriority(priorityValue: string | null): TaskPriority {
  if (!priorityValue) return "NONE";
  const lower = priorityValue.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return "URGENT";
  if (lower.includes("high")) return "HIGH";
  if (lower.includes("medium")) return "MEDIUM";
  if (lower.includes("low")) return "LOW";
  return "NONE";
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "notion" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Notion is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new NotionTasksService(creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const databases = await service.searchDatabases();

    for (const database of databases) {
      let cursor: string | undefined;
      do {
        const result = await service.queryDatabase(database.id, cursor);

        for (const page of result.results) {
          try {
            const properties = page.properties as Record<string, unknown>;
            const title = service.extractTitle(properties);
            if (!title) {
              skipped++;
              continue;
            }

            const rawStatus = service.extractStatus(properties);
            const rawPriority = service.extractPriority(properties);
            const dueDate = service.extractDate(properties);
            const assignee = service.extractAssignee(properties);

            const status: TaskStatus = mapNotionStatus(rawStatus);
            const priority: TaskPriority = mapNotionPriority(rawPriority);

            const dbTitle = database.title
              .map((t) => t.plain_text)
              .join("");

            const existing = await prisma.task.findUnique({
              where: {
                sourceIntegration_sourceId: {
                  sourceIntegration: "notion",
                  sourceId: page.id,
                },
              },
            });

            await prisma.task.upsert({
              where: {
                sourceIntegration_sourceId: {
                  sourceIntegration: "notion",
                  sourceId: page.id,
                },
              },
              update: {
                title,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignee,
                projectName: dbTitle,
                sourceUrl: page.url,
                sourceStatus: rawStatus,
                sourcePriority: rawPriority,
                completedAt: status === "DONE" ? new Date() : null,
                updatedAt: new Date(),
              },
              create: {
                title,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignee,
                projectName: dbTitle,
                sourceIntegration: "notion",
                sourceId: page.id,
                sourceUrl: page.url,
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

        cursor = result.next_cursor ?? undefined;
      } while (cursor);
    }

    await prisma.integration.update({
      where: { slug: "notion" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
