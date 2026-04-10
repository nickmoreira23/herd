import { syncCalendarEvents } from "@/lib/events/event-sync";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/events/sync — Manually trigger a calendar sync.
 */
export async function POST() {
  try {
    const result = await syncCalendarEvents();
    return apiSuccess(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return apiError(msg, 500);
  }
}
