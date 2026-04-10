import { apiSuccess, apiError } from "@/lib/api-utils";
import { saveMeetingToKnowledge } from "@/lib/meetings/meeting-knowledge";

/**
 * POST — Save a processed meeting to the knowledge base.
 *
 * Creates a KnowledgeAudio record with the meeting's transcript,
 * summary, action items, and metadata. Uses sourceIntegration="meeting"
 * for deduplication — calling this multiple times is safe.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await saveMeetingToKnowledge(id);
    return apiSuccess(result);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to save to knowledge base";
    return apiError(msg, 500);
  }
}
