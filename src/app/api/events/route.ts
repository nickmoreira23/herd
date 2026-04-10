import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/events — List calendar events with optional filters.
 *
 * Query params:
 *   startDate  — ISO string, defaults to today
 *   endDate    — ISO string, defaults to +90 days
 *   calendarId — UUID of CalendarEventSync to filter by
 *   search     — keyword filter on title/description/location
 *   limit      — max results (default 200)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const calendarId = searchParams.get("calendarId");
    const search = searchParams.get("search");
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      startAt: {
        gte: startDate ? new Date(startDate) : now,
      },
      endAt: {
        lte: endDate ? new Date(endDate) : defaultEnd,
      },
      status: { not: "CANCELLED" },
    };

    if (calendarId) {
      where.calendarSyncId = calendarId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        attendees: true,
        calendarSync: {
          select: {
            id: true,
            calendarName: true,
            calendarColor: true,
            source: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
      take: limit,
    });

    const serialized = events.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      lastSyncedAt: e.lastSyncedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      attendees: e.attendees.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    }));

    return apiSuccess(serialized);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch events";
    return apiError(msg, 500);
  }
}
