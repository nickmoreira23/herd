import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * PATCH /api/events/calendars/[id] — Toggle isActive for a calendar sync.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.calendarEventSync.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
    });

    return apiSuccess({
      ...updated,
      lastSyncAt: updated.lastSyncAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to update calendar";
    return apiError(msg, 500);
  }
}
