import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateNoteSchema } from "@/lib/validators/notes";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return apiError("Note not found", 404);
    return apiSuccess(note);
  } catch (e) {
    console.error("GET /api/notes/[id] error:", e);
    return apiError("Failed to fetch note", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateNoteSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) return apiError("Note not found", 404);

    const data: Prisma.NoteUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.pinned !== undefined) data.pinned = body.pinned;
    if (body.archived !== undefined) data.archived = body.archived;
    if (body.entityType !== undefined) data.entityType = body.entityType ?? null;
    if (body.entityId !== undefined) data.entityId = body.entityId ?? null;

    const note = await prisma.note.update({ where: { id }, data });
    return apiSuccess(note);
  } catch (e) {
    console.error("PATCH /api/notes/[id] error:", e);
    return apiError("Failed to update note", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.note.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/notes/[id] error:", e);
    return apiError("Failed to delete note", 500);
  }
}
