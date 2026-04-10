import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/events/[id] — Get a single calendar event with full details.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        attendees: true,
        calendarSync: {
          select: {
            id: true,
            calendarName: true,
            calendarColor: true,
            source: true,
            timeZone: true,
          },
        },
      },
    });

    if (!event) {
      return apiError("Event not found", 404);
    }

    const serialized = {
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      lastSyncedAt: event.lastSyncedAt.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      attendees: event.attendees.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return apiSuccess(serialized);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch event";
    return apiError(msg, 500);
  }
}
