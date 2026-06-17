import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { createSectionSchema } from "@/lib/validators/marketplace";
import { seedBlocksTaxonomy } from "@/lib/marketplace/seed-taxonomy";

export async function GET() {
  const orgId = await getOrgIdFromRequest();
  // No org context (apex / unresolved host) → no storefront to list.
  if (!orgId) return apiSuccess([]);

  return withTenant(orgId, async () => {
    try {
      const sections = await prisma.marketplaceSection.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { scopes: true },
      });
      return apiSuccess(sections);
    } catch (e) {
      console.error("GET /api/marketplace/sections error:", e);
      return apiError("Failed to list sections", 500);
    }
  });
}

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const result = await parseAndValidate(request, createSectionSchema);
  if ("error" in result) return result.error;

  return withTenant(orgId, async () => {
    try {
      // slug is unique per tenant; under withTenant the read is tenant-scoped.
      const existing = await prisma.marketplaceSection.findFirst({
        where: { slug: result.data.slug },
      });
      if (existing) return apiError("A section with this slug already exists", 409);

      // Sequential (not prisma.$transaction): each op is tenant-scoped, so the
      // tenancy Extension wraps it in its own SET-LOCAL transaction — an outer
      // interactive transaction would nest and break. tenantId set explicitly
      // (Extension also injects it; explicit mirrors the locations route molde).
      const created = await prisma.marketplaceSection.create({
        data: {
          tenantId: orgId,
          slug: result.data.slug,
          name: result.data.name,
          description: result.data.description ?? null,
          iconKey: result.data.iconKey ?? null,
          imageUrl: result.data.imageUrl ?? null,
          status: result.data.status,
          creationPath: result.data.creationPath,
          blockNames: result.data.blockNames,
          components: result.data.components as never,
          layout: (result.data.layout ?? undefined) as never,
        },
      });

      const scopes = result.data.scopes ?? [];
      if (scopes.length > 0) {
        await prisma.marketplaceSectionScope.createMany({
          data: scopes.map((s, idx) => ({
            tenantId: orgId,
            sectionId: created.id,
            blockName: s.blockName,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue ?? null,
            sortOrder: s.sortOrder ?? idx,
            allowedRoles: s.allowedRoles ?? [],
          })),
        });
      }

      // L2b.2 — curated Listings of the section (replaces ITEM-scopes).
      const listings = result.data.listings ?? [];
      if (listings.length > 0) {
        await prisma.listing.createMany({
          data: listings.map((l, idx) => ({
            tenantId: orgId,
            sectionId: created.id,
            blockName: l.blockName,
            sourceId: l.sourceId,
            titleOverride: l.titleOverride ?? null,
            descriptionOverride: l.descriptionOverride ?? null,
            imageUrlOverride: l.imageUrlOverride || null,
            priceOverrideCents:
              l.priceOverrideCents !== undefined ? BigInt(l.priceOverrideCents) : null,
            priceOverrideCurrency: l.priceOverrideCurrency ?? null,
            featured: l.featured ?? false,
            sortOrder: l.sortOrder ?? idx,
          })),
        });
      }

      // L2a.2b — materialize the taxonomy of each bound block (idempotent;
      // flat blocks no-op). Runs under withTenant so rows land in this org.
      await seedBlocksTaxonomy(orgId, result.data.blockNames);

      const section = await prisma.marketplaceSection.findUniqueOrThrow({
        where: { id: created.id },
        include: { scopes: true, listings: true },
      });

      revalidatePath("/admin/marketplace");
      revalidatePath("/explore");
      return apiSuccess(section, 201);
    } catch (e) {
      console.error("POST /api/marketplace/sections error:", e);
      return apiError("Failed to create section", 500);
    }
  });
}
