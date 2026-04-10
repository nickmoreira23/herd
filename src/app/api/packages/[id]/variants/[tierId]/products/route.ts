import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import {
  upsertVariantProductsSchema,
  addVariantProductSchema,
} from "@/lib/validators/package";
import { computeCreditCost, type RedemptionRule } from "@/lib/credit-cost";

async function getTierRules(tierId: string): Promise<RedemptionRule[]> {
  const rules = await prisma.subscriptionRedemptionRule.findMany({
    where: { subscriptionTierId: tierId },
  });
  return rules.map((r) => ({
    redemptionType: r.redemptionType,
    scopeType: r.scopeType,
    scopeValue: r.scopeValue,
    discountPercent: r.discountPercent,
  }));
}

async function getVariant(packageId: string, tierId: string) {
  return prisma.packageTierVariant.findUnique({
    where: {
      packageId_subscriptionTierId: {
        packageId,
        subscriptionTierId: tierId,
      },
    },
  });
}

async function recalcTotalCredits(variantId: string) {
  const products = await prisma.packageTierProduct.findMany({
    where: { variantId },
  });
  const total = products.reduce(
    (sum, p) => sum + Number(p.creditCost) * p.quantity,
    0
  );
  await prisma.packageTierVariant.update({
    where: { id: variantId },
    data: { totalCreditsUsed: total },
  });
  return total;
}

// PUT — Replace all products for a variant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; tierId: string }> }
) {
  try {
    const { id, tierId } = await params;
    const result = await parseAndValidate(request, upsertVariantProductsSchema);
    if ("error" in result) return result.error;

    const variant = await getVariant(id, tierId);
    if (!variant) return apiError("Package variant not found", 404);

    // Fetch product details and tier rules for server-side cost computation
    const productIds = result.data.products.map((p) => p.productId);
    const [dbProducts, rules] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sku: true, category: true, subCategory: true, memberPrice: true },
      }),
      getTierRules(tierId),
    ]);
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Transaction: delete all existing products, insert new ones with server-computed costs
    await prisma.$transaction(async (tx) => {
      await tx.packageTierProduct.deleteMany({
        where: { variantId: variant.id },
      });

      if (result.data.products.length > 0) {
        await tx.packageTierProduct.createMany({
          data: result.data.products.map((p, i) => {
            const dbProduct = productMap.get(p.productId);
            const serverCost = dbProduct
              ? computeCreditCost(
                  {
                    sku: dbProduct.sku,
                    category: dbProduct.category,
                    subCategory: dbProduct.subCategory,
                    memberPrice: Number(dbProduct.memberPrice),
                  },
                  rules
                )
              : (p.creditCost ?? 0);
            return {
              variantId: variant.id,
              productId: p.productId,
              quantity: p.quantity,
              creditCost: serverCost,
              sortOrder: i,
            };
          }),
        });
      }

      // Update notes if provided
      if (result.data.notes !== undefined) {
        await tx.packageTierVariant.update({
          where: { id: variant.id },
          data: { notes: result.data.notes },
        });
      }
    });

    const total = await recalcTotalCredits(variant.id);

    const updated = await prisma.packageTierVariant.findUnique({
      where: { id: variant.id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                subCategory: true,
                retailPrice: true,
                memberPrice: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return apiSuccess({ variant: updated, totalCreditsUsed: total });
  } catch (e) {
    console.error("PUT /api/packages/[id]/variants/[tierId]/products error:", e);
    return apiError("Failed to update variant products", 500);
  }
}

// POST — Add a single product to the variant
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; tierId: string }> }
) {
  try {
    const { id, tierId } = await params;
    const result = await parseAndValidate(request, addVariantProductSchema);
    if ("error" in result) return result.error;

    const variant = await getVariant(id, tierId);
    if (!variant) return apiError("Package variant not found", 404);

    // Check for duplicate
    const existing = await prisma.packageTierProduct.findUnique({
      where: {
        variantId_productId: {
          variantId: variant.id,
          productId: result.data.productId,
        },
      },
    });
    if (existing) return apiError("Product already in this variant", 409);

    // Fetch product details and tier rules for server-side cost computation
    const [product, rules] = await Promise.all([
      prisma.product.findUnique({
        where: { id: result.data.productId },
        select: { sku: true, category: true, subCategory: true, memberPrice: true },
      }),
      getTierRules(tierId),
    ]);

    const serverCost = product
      ? computeCreditCost(
          {
            sku: product.sku,
            category: product.category,
            subCategory: product.subCategory,
            memberPrice: Number(product.memberPrice),
          },
          rules
        )
      : (result.data.creditCost ?? 0);

    // Get next sort order
    const maxSort = await prisma.packageTierProduct.findFirst({
      where: { variantId: variant.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.packageTierProduct.create({
      data: {
        variantId: variant.id,
        productId: result.data.productId,
        quantity: result.data.quantity,
        creditCost: serverCost,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    const total = await recalcTotalCredits(variant.id);
    return apiSuccess({ totalCreditsUsed: total, creditCost: serverCost }, 201);
  } catch (e) {
    console.error("POST /api/packages/[id]/variants/[tierId]/products error:", e);
    return apiError("Failed to add product", 500);
  }
}

// DELETE — Remove a product from the variant (productId in query param)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tierId: string }> }
) {
  try {
    const { id, tierId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return apiError("productId query param is required", 400);

    const variant = await getVariant(id, tierId);
    if (!variant) return apiError("Package variant not found", 404);

    await prisma.packageTierProduct.deleteMany({
      where: { variantId: variant.id, productId },
    });

    const total = await recalcTotalCredits(variant.id);
    return apiSuccess({ totalCreditsUsed: total });
  } catch (e) {
    console.error("DELETE /api/packages/[id]/variants/[tierId]/products error:", e);
    return apiError("Failed to remove product", 500);
  }
}
