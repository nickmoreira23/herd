import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET() {
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiSuccess({ categories: [], subCategories: {} });

  return withTenant(orgId, async () => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { category: true, subCategory: true },
      });

      const categorySet = new Set<string>();
      const subCategoryMap: Record<string, Set<string>> = {};

      for (const p of products) {
        categorySet.add(p.category);
        if (p.subCategory) {
          if (!subCategoryMap[p.category]) {
            subCategoryMap[p.category] = new Set();
          }
          subCategoryMap[p.category].add(p.subCategory);
        }
      }

      const categories = Array.from(categorySet).sort();
      const subCategories: Record<string, string[]> = {};
      for (const [cat, subs] of Object.entries(subCategoryMap)) {
        subCategories[cat] = Array.from(subs).sort();
      }

      return apiSuccess({ categories, subCategories });
    } catch (e) {
      console.error("GET /api/products/categories error:", e);
      return apiError("Failed to fetch categories", 500);
    }
  });
}
