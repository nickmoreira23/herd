import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";

const reorderSchema = z.object({
  orders: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.coerce.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, reorderSchema);
    if ("error" in result) return result.error;

    await prisma.$transaction(
      result.data.orders.map((o) =>
        prisma.marketplaceSection.update({
          where: { id: o.id },
          data: { sortOrder: o.sortOrder },
        })
      )
    );

    revalidatePath("/admin/marketplace");
    revalidatePath("/explore");
    return apiSuccess({ updated: result.data.orders.length });
  } catch (e) {
    console.error("POST /api/marketplace/sections/reorder error:", e);
    return apiError("Failed to reorder sections", 500);
  }
}
