import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import {
  bulkActionSchema,
  bulkImportRowSchema,
} from "@/lib/validators/product";
import { z } from "zod";

// POST: Bulk CSV import
export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(
      request,
      z.object({ rows: z.array(bulkImportRowSchema) })
    );
    if ("error" in result) return result.error;

    const { rows } = result.data;

    // Find all existing SKUs in one query
    const skus = rows.map((r) => r.sku);
    const existing = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
    const existingSkus = new Set(existing.map((e) => e.sku));

    const toCreate = rows.filter((r) => !existingSkus.has(r.sku));
    const skippedSkus = rows.filter((r) => existingSkus.has(r.sku)).map((r) => r.sku);

    // Batch create using createMany for performance
    if (toCreate.length > 0) {
      await prisma.product.createMany({
        data: toCreate.map((row) => ({
          ...row,
          memberPrice: row.memberPrice ?? row.retailPrice,
          tags: [],
        })),
        skipDuplicates: true,
      });
    }

    return apiSuccess(
      { created: toCreate.length, skipped: skippedSkus.length, skippedSkus },
      201
    );
  } catch (e) {
    console.error("POST /api/products/bulk error:", e);
    return apiError("Failed to import products", 500);
  }
}

// PATCH: Bulk actions (activate, deactivate, price adjust)
export async function PATCH(request: Request) {
  try {
    const result = await parseAndValidate(request, bulkActionSchema);
    if ("error" in result) return result.error;

    const { ids, action, adjustmentType, adjustmentValue, adjustmentField } = result.data;

    if (action === "activate") {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true },
      });
    } else if (action === "deactivate") {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      });
    } else if (action === "delete") {
      await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      return apiSuccess({ deleted: ids.length });
    } else if (action === "adjustPrice" && adjustmentType && adjustmentValue != null && adjustmentField) {
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, retailPrice: true, memberPrice: true },
      });

      for (const product of products) {
        const currentPrice = Number(product[adjustmentField]);
        const newPrice =
          adjustmentType === "percent"
            ? currentPrice * (1 + adjustmentValue / 100)
            : currentPrice + adjustmentValue;

        await prisma.product.update({
          where: { id: product.id },
          data: { [adjustmentField]: Math.max(0, Math.round(newPrice * 100) / 100) },
        });
      }
    }

    return apiSuccess({ updated: ids.length });
  } catch (e) {
    console.error("PATCH /api/products/bulk error:", e);
    return apiError("Failed to perform bulk action", 500);
  }
}
