import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

// POST: Trigger sync for all connected task integrations
// Returns { synced: string[], errors: string[] }
export async function POST() {
  try {
    const integrations = await prisma.integration.findMany({
      where: {
        category: "PROJECT_MANAGEMENT",
        status: "CONNECTED",
      },
      select: { slug: true },
    });

    const synced = integrations.map((i) => i.slug);
    const errors: string[] = [];

    // TODO: Implement actual sync logic per integration
    // For each connected integration, call the corresponding import service
    // e.g. syncAsanaTasks(), syncLinearTasks(), etc.

    return apiSuccess({ synced, errors });
  } catch (e) {
    console.error("POST /api/tasks/sync error:", e);
    return apiError("Failed to sync tasks", 500);
  }
}
