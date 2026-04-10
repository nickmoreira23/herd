import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { toNumber } from "@/lib/utils";
import { z } from "zod";

// GET /api/shared/:token — resolve share link and return package data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.packageShareLink.findUnique({
      where: { token },
    });

    if (!link || !link.isActive) {
      return apiError("Share link not found or has been revoked", 404);
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return apiError("Share link has expired", 410);
    }

    const pkg = await prisma.package.findUnique({
      where: { id: link.packageId },
      include: {
        variants: {
          include: {
            subscriptionTier: {
              select: {
                id: true,
                name: true,
                slug: true,
                monthlyCredits: true,
                monthlyPrice: true,
                colorAccent: true,
                sortOrder: true,
                iconUrl: true,
              },
            },
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
          orderBy: { subscriptionTier: { sortOrder: "asc" } },
        },
      },
    });

    if (!pkg) return apiError("Package not found", 404);

    // Serialize Decimals
    const serialized = {
      ...pkg,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
      variants: pkg.variants.map((v) => ({
        ...v,
        totalCreditsUsed: toNumber(v.totalCreditsUsed),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        subscriptionTier: {
          ...v.subscriptionTier,
          monthlyCredits: toNumber(v.subscriptionTier.monthlyCredits),
          monthlyPrice: toNumber(v.subscriptionTier.monthlyPrice),
        },
        products: v.products.map((p) => ({
          ...p,
          creditCost: toNumber(p.creditCost),
          createdAt: p.createdAt.toISOString(),
          product: {
            ...p.product,
            retailPrice: toNumber(p.product.retailPrice),
            memberPrice: toNumber(p.product.memberPrice),
          },
        })),
      })),
    };

    return apiSuccess({
      permission: link.permission,
      package: serialized,
    });
  } catch (e) {
    console.error("GET /api/shared/:token error:", e);
    return apiError("Failed to load shared package", 500);
  }
}

// PATCH /api/shared/:token — update package products (edit permission only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.packageShareLink.findUnique({
      where: { token },
    });

    if (!link || !link.isActive) {
      return apiError("Share link not found or has been revoked", 404);
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return apiError("Share link has expired", 410);
    }

    if (link.permission !== "edit") {
      return apiError("This link only grants view access", 403);
    }

    const body = await request.json();
    const variantUpdates = z
      .object({
        variantId: z.string().uuid(),
        products: z.array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.coerce.number().int().positive().default(1),
            creditCost: z.coerce.number().nonnegative(),
          })
        ),
      })
      .safeParse(body);

    if (!variantUpdates.success) {
      return apiError("Validation failed", 400, variantUpdates.error.issues);
    }

    const { variantId, products } = variantUpdates.data;

    // Verify variant belongs to this package
    const variant = await prisma.packageTierVariant.findFirst({
      where: { id: variantId, packageId: link.packageId },
    });
    if (!variant) return apiError("Variant not found", 404);

    // Replace products
    await prisma.$transaction(async (tx) => {
      await tx.packageTierProduct.deleteMany({ where: { variantId } });

      if (products.length > 0) {
        await tx.packageTierProduct.createMany({
          data: products.map((p, i) => ({
            variantId,
            productId: p.productId,
            quantity: p.quantity,
            creditCost: p.creditCost,
            sortOrder: i,
          })),
        });
      }

      const totalCreditsUsed = products.reduce(
        (sum, p) => sum + p.creditCost * p.quantity,
        0
      );
      await tx.packageTierVariant.update({
        where: { id: variantId },
        data: { totalCreditsUsed },
      });
    });

    return apiSuccess({ updated: true });
  } catch (e) {
    console.error("PATCH /api/shared/:token error:", e);
    return apiError("Failed to update package", 500);
  }
}
