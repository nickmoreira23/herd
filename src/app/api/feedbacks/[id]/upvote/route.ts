import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedback = await prisma.feedback.update({
      where: { id },
      data: { voteCount: { increment: 1 } },
      select: { id: true, voteCount: true },
    });
    return apiSuccess(feedback);
  } catch (e) {
    console.error("POST /api/feedbacks/[id]/upvote error:", e);
    return apiError("Failed to upvote feedback", 500);
  }
}
