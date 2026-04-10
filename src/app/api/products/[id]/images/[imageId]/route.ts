import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const updateImageSchema = z.object({
  isPrimary: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const body = await request.json();
    const parsed = updateImageSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid body", 400);

    if (parsed.data.isPrimary) {
      // Unset all others, then set this one
      await prisma.$transaction([
        prisma.productImage.updateMany({
          where: { productId: id, NOT: { id: imageId } },
          data: { isPrimary: false },
        }),
        prisma.productImage.update({
          where: { id: imageId, productId: id },
          data: { isPrimary: true },
        }),
      ]);
    }

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    return apiSuccess(image);
  } catch (e) {
    console.error("PATCH /api/products/[id]/images/[imageId] error:", e);
    return apiError("Failed to update image", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    await prisma.productImage.delete({
      where: { id: imageId, productId: id },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/products/[id]/images/[imageId] error:", e);
    return apiError("Failed to delete image", 500);
  }
}
