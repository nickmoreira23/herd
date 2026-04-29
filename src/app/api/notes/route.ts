import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createNoteSchema } from "@/lib/validators/notes";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const pinned = searchParams.get("pinned");
    const archived = searchParams.get("archived");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.NoteWhereInput = {};

    if (tag) where.tags = { has: tag };
    if (pinned === "true") where.pinned = true;
    if (pinned === "false") where.pinned = false;
    if (archived === "true") where.archived = true;
    else if (archived !== "all") where.archived = false;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.note.count({ where }),
    ]);

    return apiSuccess({ notes, total });
  } catch (e) {
    console.error("GET /api/notes error:", e);
    return apiError("Failed to fetch notes", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createNoteSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const note = await prisma.note.create({
      data: {
        title: body.title,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        tags: body.tags ?? [],
        pinned: body.pinned ?? false,
        entityType: body.entityType ?? null,
        entityId: body.entityId ?? null,
      },
    });
    return apiSuccess(note, 201);
  } catch (e) {
    console.error("POST /api/notes error:", e);
    return apiError("Failed to create note", 500);
  }
}
