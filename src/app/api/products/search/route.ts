import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

// GET /api/products/search?q=&category=&subCategory=
// Returns lightweight product results for the SKU picker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || undefined;
    const subCategory = searchParams.get("subCategory") || undefined;

    const where = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category }),
      ...(subCategory && { subCategory }),
    };

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        subCategory: true,
        retailPrice: true,
        costOfGoods: true,
        memberPrice: true,
        redemptionType: true,
        imageUrl: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    // Serialize Decimals
    const serialized = products.map((p) => ({
      ...p,
      retailPrice: Number(p.retailPrice),
      costOfGoods: Number(p.costOfGoods),
      memberPrice: Number(p.memberPrice),
    }));

    return apiSuccess(serialized);
  } catch (e) {
    console.error("GET /api/products/search error:", e);
    return apiError("Failed to search products", 500);
  }
}
