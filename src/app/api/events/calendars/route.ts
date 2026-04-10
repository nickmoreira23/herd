import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/events/calendars — List all synced calendars with metadata.
 */
export async function GET() {
  try {
    const calendars = await prisma.calendarEventSync.findMany({
      orderBy: { calendarName: "asc" },
      include: {
        _count: { select: { events: true } },
      },
    });

    const serialized = calendars.map((c) => ({
      ...c,
      eventCount: c._count.events,
      _count: undefined,
      lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return apiSuccess(serialized);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch calendars";
    return apiError(msg, 500);
  }
}
