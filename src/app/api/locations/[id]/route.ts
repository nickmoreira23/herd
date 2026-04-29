import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateLocationSchema } from "@/lib/validators/locations";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) return apiError("Location not found", 404);
    return apiSuccess(location);
  } catch (e) {
    console.error("GET /api/locations/[id] error:", e);
    return apiError("Failed to fetch location", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateLocationSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) return apiError("Location not found", 404);

    if (body.isHeadquarters) {
      await prisma.location.updateMany({
        where: { isHeadquarters: true, id: { not: id } },
        data: { isHeadquarters: false },
      });
    }

    const data: Prisma.LocationUpdateInput = { ...body };
    const location = await prisma.location.update({ where: { id }, data });
    return apiSuccess(location);
  } catch (e) {
    console.error("PATCH /api/locations/[id] error:", e);
    return apiError("Failed to update location", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.location.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/locations/[id] error:", e);
    return apiError("Failed to delete location", 500);
  }
}
