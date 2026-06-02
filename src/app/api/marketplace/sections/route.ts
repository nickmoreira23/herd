import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSectionSchema } from "@/lib/validators/marketplace";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  try {
    const result = await parseAndValidate(request, createSectionSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.marketplaceSection.findUnique({
      where: { slug: result.data.slug },
    });
    if (existing) return apiError("A section with this slug already exists", 409);

    const section = await prisma.$transaction(async (tx) => {
      const created = await tx.marketplaceSection.create({
        data: {
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
        await tx.marketplaceSectionScope.createMany({
          data: scopes.map((s, idx) => ({
            sectionId: created.id,
            blockName: s.blockName,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue ?? null,
            sortOrder: s.sortOrder ?? idx,
            allowedProfileTypeIds: s.allowedProfileTypeIds ?? [],
            allowedRoleIds: s.allowedRoleIds ?? [],
          })),
        });
      }
      return tx.marketplaceSection.findUniqueOrThrow({
        where: { id: created.id },
        include: { scopes: true },
      });
    });

    revalidatePath("/admin/marketplace");
    revalidatePath("/explore");
    return apiSuccess(section, 201);
  } catch (e) {
    console.error("POST /api/marketplace/sections error:", e);
    return apiError("Failed to create section", 500);
  }
}
