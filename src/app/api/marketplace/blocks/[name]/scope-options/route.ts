import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { isEligibleBlock } from "@/lib/marketplace/registry";
import { getBlockTaxonomy } from "@/lib/blocks/taxonomy";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

interface ScopeOptions {
  /** Taxonomy categories from the block manifest. `key` is the stable slug
   *  the wizard stores as scopeValue; `label` is display only. */
  categories: Array<{ key: string; label: string }>;
  /** Subcategories flattened, each carrying its parent `categoryKey`. */
  subCategories: Array<{ key: string; label: string; categoryKey: string }>;
  /** Block items for the ITEM-scope picker (per-block sourced). */
  items: Array<{ id: string; name: string; imageUrl: string | null; category: string | null; subCategory: string | null }>;
}

/**
 * L2a.2b — categories/subCategories now come from the block MANIFEST taxonomy
 * (getBlockTaxonomy), not from a distinct() over the block's rows. The wizard
 * stores the category `key` (slug) as scopeValue, which the resolver matches by
 * slug-normalizing the item's raw category. Blocks without a manifest taxonomy
 * return empty categories (only ALL/ITEM apply). Items are still per-block.
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

    const taxonomy = getBlockTaxonomy(name);
    const categories = taxonomy
      ? taxonomy.categories.map((c) => ({ key: c.key, label: c.label }))
      : [];
    const subCategories = taxonomy
      ? taxonomy.categories.flatMap((c) =>
          (c.subcategories ?? []).map((s) => ({ key: s.key, label: s.label, categoryKey: c.key }))
        )
      : [];

    let items: ScopeOptions["items"] = [];
    if (name === "products") {
      // Product is tenant-scoped; items come from the host org's catalog.
      const orgId = await getOrgIdFromRequest();
      const products = orgId
        ? await withTenant(orgId, () =>
            prisma.product.findMany({
              where: { isActive: true },
              orderBy: { name: "asc" },
              select: { id: true, name: true, imageUrl: true, category: true, subCategory: true },
            })
          )
        : [];
      items = products.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        category: p.category,
        subCategory: p.subCategory,
      }));
    } else if (name === "agents") {
      const agents = await prisma.agent.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, iconUrl: true, category: true },
      });
      items = agents.map((a) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.iconUrl,
        category: a.category,
        subCategory: null,
      }));
    }

    const payload: ScopeOptions = { categories, subCategories, items };
    return apiSuccess(payload);
  } catch (e) {
    console.error("GET /api/marketplace/blocks/[name]/scope-options error:", e);
    return apiError("Failed to load scope options", 500);
  }
}
