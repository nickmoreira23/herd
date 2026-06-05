import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { createSectionSchema } from "@/lib/validators/marketplace";

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

      const section = await prisma.marketplaceSection.findUniqueOrThrow({
        where: { id: created.id },
        include: { scopes: true },
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
