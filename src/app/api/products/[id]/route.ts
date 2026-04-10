import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateProductSchema } from "@/lib/validators/product";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    });
    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
  } catch (e) {
    console.error("GET /api/products/[id] error:", e);
    return apiError("Failed to fetch product", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateProductSchema);
    if ("error" in result) return result.error;

    const data: Record<string, unknown> = { ...result.data };

    // Compute nextRescrapeAt when rescrapeInterval changes
    if ("rescrapeInterval" in data) {
      if (data.rescrapeInterval) {
        const now = new Date();
        switch (data.rescrapeInterval) {
          case "DAILY":
            data.nextRescrapeAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "WEEKLY":
            data.nextRescrapeAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "MONTHLY":
            data.nextRescrapeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      } else {
        data.nextRescrapeAt = null;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return apiSuccess(product);
  } catch (e) {
    console.error("PATCH /api/products/[id] error:", e);
    return apiError("Failed to update product", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/products/[id] error:", e);
    return apiError("Failed to delete product", 500);
  }
}
