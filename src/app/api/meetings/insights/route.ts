import { apiSuccess, apiError } from "@/lib/api-utils";
import { getCrossMeetingInsights } from "@/lib/meetings/meeting-knowledge";

/**
 * GET — Cross-meeting intelligence.
 *
 * Returns:
 * - Recurring topics across meetings (topics that appear in 2+ meetings)
 * - Unresolved action items from all meetings
 * - Meeting frequency stats (total, last 7d, last 30d, avg duration)
 * - Top participants by meeting count
 */
export async function GET() {
  try {
    const insights = await getCrossMeetingInsights();
    return apiSuccess(insights);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate insights";
    return apiError(msg, 500);
  }
}
