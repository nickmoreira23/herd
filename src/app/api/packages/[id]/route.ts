import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updatePackageSchema } from "@/lib/validators/package";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // L1a.4 — Product is tenant-scoped; resolve host org for the catalog read.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  try {
    const { id } = await params;
    const pkg = await prisma.package.findUnique({
      where: { id },
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
              },
            },
            products: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { subscriptionTier: { sortOrder: "asc" } },
        },
      },
    });

    if (!pkg) return apiError("Package not found", 404);

    // Nested product include through the unscoped Package family would run
    // without the tenant GUC and be denied by RLS — read the catalog directly
    // under the tenant and join in memory.
    const productIds = pkg.variants.flatMap((v) => v.products.map((p) => p.productId));
    const catalogProducts = await withTenant(orgId, () =>
      prisma.product.findMany({
        where: { id: { in: productIds } },
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
      })
    );
    const productById = new Map(catalogProducts.map((p) => [p.id, p]));

    const joined = {
      ...pkg,
      variants: pkg.variants.map((v) => ({
        ...v,
        products: v.products.flatMap((p) => {
          const product = productById.get(p.productId);
          return product ? [{ ...p, product }] : [];
        }),
      })),
    };

    return apiSuccess(joined);
  } catch (e) {
    console.error("GET /api/packages/[id] error:", e);
    return apiError("Failed to fetch package", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updatePackageSchema);
    if ("error" in result) return result.error;

    // Check slug uniqueness if changing
    if (result.data.slug) {
      const existing = await prisma.package.findFirst({
        where: { slug: result.data.slug, NOT: { id } },
      });
      if (existing) return apiError("A package with this slug already exists", 409);
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: result.data,
    });
    return apiSuccess(pkg);
  } catch (e) {
    console.error("PATCH /api/packages/[id] error:", e);
    return apiError("Failed to update package", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.package.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/packages/[id] error:", e);
    return apiError("Failed to delete package", 500);
  }
}
