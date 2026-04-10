import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const reorderSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid body", 400);

    await Promise.all(
      parsed.data.images.map((img) =>
        prisma.productImage.update({
          where: { id: img.id, productId: id },
          data: { sortOrder: img.sortOrder },
        })
      )
    );

    return apiSuccess({ reordered: true });
  } catch (e) {
    console.error("PUT /api/products/[id]/images/reorder error:", e);
    return apiError("Failed to reorder images", 500);
  }
}
