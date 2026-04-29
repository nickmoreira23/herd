import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateFeedbackSchema } from "@/lib/validators/feedbacks";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) return apiError("Feedback not found", 404);
    return apiSuccess(feedback);
  } catch (e) {
    console.error("GET /api/feedbacks/[id] error:", e);
    return apiError("Failed to fetch feedback", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateFeedbackSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) return apiError("Feedback not found", 404);

    const data: Prisma.FeedbackUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.type !== undefined) data.type = body.type;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.source !== undefined) data.source = body.source ?? null;
    if (body.submitterName !== undefined)
      data.submitterName = body.submitterName ?? null;
    if (body.submitterEmail !== undefined)
      data.submitterEmail = body.submitterEmail ?? null;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.entityType !== undefined)
      data.entityType = body.entityType ?? null;
    if (body.entityId !== undefined) data.entityId = body.entityId ?? null;

    if (body.status !== undefined) {
      data.status = body.status;
      const wasResolved =
        existing.status === "DONE" || existing.status === "DECLINED";
      const willBeResolved =
        body.status === "DONE" || body.status === "DECLINED";
      if (willBeResolved && !existing.resolvedAt) {
        data.resolvedAt = new Date();
      } else if (!willBeResolved && wasResolved) {
        data.resolvedAt = null;
      }
    }

    const feedback = await prisma.feedback.update({ where: { id }, data });
    return apiSuccess(feedback);
  } catch (e) {
    console.error("PATCH /api/feedbacks/[id] error:", e);
    return apiError("Failed to update feedback", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.feedback.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/feedbacks/[id] error:", e);
    return apiError("Failed to delete feedback", 500);
  }
}
