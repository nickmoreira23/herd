import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { summarizeMeeting } from "@/lib/meetings/meeting-summarizer";

// Allow up to 5 minutes for AI summarization
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return apiError("Meeting not found", 404);
  if (!meeting.transcript) {
    return apiError("Meeting has no transcript to summarize", 400);
  }

  try {
    const result = await summarizeMeeting(meeting.transcript, meeting.title);

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        summary: result.summary,
        actionItems: result.actionItems,
        keyTopics: result.keyTopics,
      },
      include: { participants: true },
    });

    return apiSuccess(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(
      `[Meetings] Summarization failed for "${meeting.title}" (${meeting.id}):`,
      e
    );
    return apiError(`Failed to summarize meeting: ${message}`, 500);
  }
}
