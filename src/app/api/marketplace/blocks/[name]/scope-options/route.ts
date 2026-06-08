import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { isEligibleBlock } from "@/lib/marketplace/registry";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

interface ScopeOptions {
  categories: string[];
  subCategories: string[];
  items: Array<{ id: string; name: string; imageUrl: string | null; category: string | null; subCategory: string | null }>;
}

/**
 * Returns the categories / sub-categories / items available for a given block,
 * so the wizard's Items step can offer a picker mirroring redemption-rules-panel.
 *
 * Phase 1b ships only the "products" block; other blocks resolve to an empty
 * but well-shaped payload until per-block providers are wired in 1c.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    if (!isEligibleBlock(name)) {
      return apiError(`Block '${name}' is not eligible`, 400);
    }

    const empty: ScopeOptions = { categories: [], subCategories: [], items: [] };

    if (name === "products") {
      // L1a.2 — Product is tenant-scoped; scope options come from host org's catalog.
      const orgId = await getOrgIdFromRequest();
      const products = orgId
        ? await withTenant(orgId, () =>
            prisma.product.findMany({
              where: { isActive: true },
              orderBy: { name: "asc" },
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: true,
                subCategory: true,
              },
            })
          )
        : [];
      const categories = Array.from(
        new Set(products.map((p) => p.category).filter(Boolean) as string[])
      ).sort();
      const subCategories = Array.from(
        new Set(products.map((p) => p.subCategory).filter(Boolean) as string[])
      ).sort();
      const payload: ScopeOptions = {
        categories,
        subCategories,
        items: products.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          category: p.category,
          subCategory: p.subCategory,
        })),
      };
      return apiSuccess(payload);
    }

    if (name === "agents") {
      const agents = await prisma.agent.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, iconUrl: true, category: true },
      });
      const categories = Array.from(new Set(agents.map((a) => a.category))).sort();
      return apiSuccess({
        categories,
        subCategories: [],
        items: agents.map((a) => ({
          id: a.id,
          name: a.name,
          imageUrl: a.iconUrl,
          category: a.category,
          subCategory: null,
        })),
      });
    }

    return apiSuccess(empty);
  } catch (e) {
    console.error("GET /api/marketplace/blocks/[name]/scope-options error:", e);
    return apiError("Failed to load scope options", 500);
  }
}
