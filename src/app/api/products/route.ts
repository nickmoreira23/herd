import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createProductSchema } from "@/lib/validators/product";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const sort = searchParams.get("sort") || "name";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category }),
      ...(activeOnly && { isActive: true }),
    };

    const products = await prisma.product.findMany({
      where,
      orderBy: { [sort]: order },
    });

    return apiSuccess(products);
  } catch (e) {
    console.error("GET /api/products error:", e);
    return apiError("Failed to fetch products", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createProductSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.product.findUnique({
      where: { sku: result.data.sku },
    });
    if (existing) {
      return apiError("A product with this SKU already exists", 409);
    }

    const product = await prisma.product.create({
      data: {
        ...result.data,
        memberPrice: result.data.memberPrice ?? result.data.retailPrice,
        imageUrl: result.data.imageUrl || null,
        tags: result.data.tags || [],
      },
    });

    revalidatePath("/admin/blocks/products");

    return apiSuccess(product, 201);
  } catch (e) {
    console.error("POST /api/products error:", e);
    return apiError("Failed to create product", 500);
  }
}
