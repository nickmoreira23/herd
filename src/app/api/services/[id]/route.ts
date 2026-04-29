import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateServiceSchema } from "@/lib/validators/services";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return apiError("Service not found", 404);
    return apiSuccess(service);
  } catch (e) {
    console.error("GET /api/services/[id] error:", e);
    return apiError("Failed to fetch service", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateServiceSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return apiError("Service not found", 404);

    if (body.key && body.key !== existing.key) {
      const collision = await prisma.service.findUnique({
        where: { key: body.key },
      });
      if (collision) return apiError("Key already exists", 409);
    }

    const data: Prisma.ServiceUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.key !== undefined) data.key = body.key;
    if (body.description !== undefined)
      data.description = body.description ?? null;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.category !== undefined) data.category = body.category ?? null;
    if (body.duration !== undefined) data.duration = body.duration ?? null;
    if (body.price !== undefined) data.price = body.price ?? null;
    if (body.pricingType !== undefined) data.pricingType = body.pricingType;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl ?? null;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.status !== undefined) data.status = body.status;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.tags !== undefined) data.tags = body.tags;

    const service = await prisma.service.update({ where: { id }, data });
    return apiSuccess(service);
  } catch (e) {
    console.error("PATCH /api/services/[id] error:", e);
    return apiError("Failed to update service", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.service.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/services/[id] error:", e);
    return apiError("Failed to delete service", 500);
  }
}
