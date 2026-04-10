import { apiSuccess, apiError } from "@/lib/api-utils";
import { getPreMeetingBriefing } from "@/lib/meetings/meeting-knowledge";

/**
 * GET — Generate a pre-meeting briefing for an upcoming meeting.
 *
 * Looks at past meetings with overlapping attendees and uses Claude
 * to generate a concise briefing with context, open items, and
 * expected discussion topics.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getPreMeetingBriefing(id);
    return apiSuccess(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate briefing";
    return apiError(msg, 500);
  }
}
