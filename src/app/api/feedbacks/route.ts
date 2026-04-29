import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createFeedbackSchema } from "@/lib/validators/feedbacks";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.FeedbackWhereInput = {};
    if (type) where.type = type as Prisma.FeedbackWhereInput["type"];
    if (status) where.status = status as Prisma.FeedbackWhereInput["status"];
    if (priority)
      where.priority = priority as Prisma.FeedbackWhereInput["priority"];
    if (source) where.source = source;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
        { submitterName: { contains: search, mode: "insensitive" } },
        { submitterEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.feedback.count({ where }),
    ]);

    return apiSuccess({ feedbacks, total });
  } catch (e) {
    console.error("GET /api/feedbacks error:", e);
    return apiError("Failed to fetch feedbacks", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createFeedbackSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const status = body.status ?? "NEW";
    const resolvedAt =
      status === "DONE" || status === "DECLINED" ? new Date() : null;

    const feedback = await prisma.feedback.create({
      data: {
        title: body.title,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        type: body.type ?? "SUGGESTION",
        status,
        priority: body.priority ?? "MEDIUM",
        source: body.source ?? null,
        submitterName: body.submitterName ?? null,
        submitterEmail: body.submitterEmail ?? null,
        tags: body.tags ?? [],
        entityType: body.entityType ?? null,
        entityId: body.entityId ?? null,
        resolvedAt,
      },
    });
    return apiSuccess(feedback, 201);
  } catch (e) {
    console.error("POST /api/feedbacks error:", e);
    return apiError("Failed to create feedback", 500);
  }
}
