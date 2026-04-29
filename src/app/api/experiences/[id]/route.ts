import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateExperienceSchema } from "@/lib/validators/experiences";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exp = await prisma.experience.findUnique({ where: { id } });
    if (!exp) return apiError("Experience not found", 404);
    return apiSuccess(exp);
  } catch (e) {
    console.error("GET /api/experiences/[id] error:", e);
    return apiError("Failed to fetch experience", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateExperienceSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.experience.findUnique({ where: { id } });
    if (!existing) return apiError("Experience not found", 404);

    const data: Prisma.ExperienceUpdateInput = {};
    const stringFields = [
      "name",
      "headline",
      "description",
      "currency",
      "locationName",
      "locationUrl",
      "coverImageUrl",
    ] as const;
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any)[f] = body[f] ?? null;
      }
    }
    if (body.format !== undefined && body.format !== null) data.format = body.format;
    if (body.status !== undefined && body.status !== null) data.status = body.status;
    if (body.startDate !== undefined) data.startDate = body.startDate ?? null;
    if (body.endDate !== undefined) data.endDate = body.endDate ?? null;
    if (body.durationMin !== undefined) data.durationMin = body.durationMin ?? null;
    if (body.capacity !== undefined) data.capacity = body.capacity ?? null;
    if (body.price !== undefined) data.price = body.price ?? null;
    if (body.hostId !== undefined) data.hostId = body.hostId ?? null;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;

    const exp = await prisma.experience.update({ where: { id }, data });

    // Lifecycle events on status transitions
    if (body.status && body.status !== existing.status) {
      const lifecycle: Record<string, string | null> = {
        OPEN: "status_changed_to_open",
        SOLD_OUT: "status_changed_to_sold_out",
        COMPLETED: "status_changed_to_completed",
        CANCELLED: "status_changed_to_cancelled",
      };
      const eventType = lifecycle[body.status] ?? null;
      if (eventType) {
        void dispatchBlockEvent("experiences", eventType, {
          experienceId: exp.id,
          name: exp.name,
          previousStatus: existing.status,
          status: exp.status,
        });
      }
    }
    return apiSuccess(exp);
  } catch (e) {
    console.error("PATCH /api/experiences/[id] error:", e);
    return apiError("Failed to update experience", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.experience.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/experiences/[id] error:", e);
    return apiError("Failed to delete experience", 500);
  }
}
