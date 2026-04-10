import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { TrelloService } from "@/lib/services/trello";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapTrelloStatus(listName: string): TaskStatus {
  const lower = listName.toLowerCase();
  if (lower.includes("done") || lower.includes("complete")) return "DONE";
  if (
    lower.includes("in progress") ||
    lower.includes("doing") ||
    lower.includes("in review")
  )
    return "IN_PROGRESS";
  if (lower.includes("backlog")) return "BACKLOG";
  if (lower.includes("cancel")) return "CANCELLED";
  return "TODO";
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "trello" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Trello is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new TrelloService(creds.apiKey, creds.apiToken);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const boards = await service.listBoards();

    for (const board of boards) {
      const [cards, lists] = await Promise.all([
        service.listCards(board.id),
        service.listLists(board.id),
      ]);

      const listMap = new Map(lists.map((l) => [l.id, l.name]));

      for (const card of cards) {
        try {
          const listName = listMap.get(card.idList) ?? "Unknown";
          const status: TaskStatus = mapTrelloStatus(listName);
          const priority: TaskPriority = "NONE";

          const existing = await prisma.task.findUnique({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "trello",
                sourceId: card.id,
              },
            },
          });

          await prisma.task.upsert({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "trello",
                sourceId: card.id,
              },
            },
            update: {
              title: card.name,
              description: card.desc || null,
              status,
              priority,
              dueDate: card.due ? new Date(card.due) : null,
              assignee: card.members[0]?.fullName ?? null,
              projectName: board.name,
              labels: card.labels.map((l) => l.name).filter(Boolean),
              sourceUrl: card.shortUrl,
              sourceStatus: listName,
              sourcePriority: null,
              completedAt: card.dueComplete && card.due ? new Date(card.due) : null,
              updatedAt: new Date(),
            },
            create: {
              title: card.name,
              description: card.desc || null,
              status,
              priority,
              dueDate: card.due ? new Date(card.due) : null,
              assignee: card.members[0]?.fullName ?? null,
              projectName: board.name,
              labels: card.labels.map((l) => l.name).filter(Boolean),
              sourceIntegration: "trello",
              sourceId: card.id,
              sourceUrl: card.shortUrl,
              sourceStatus: listName,
              sourcePriority: null,
              completedAt: card.dueComplete && card.due ? new Date(card.due) : null,
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
      where: { slug: "trello" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
