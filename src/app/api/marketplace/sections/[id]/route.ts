import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateSectionSchema } from "@/lib/validators/marketplace";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const section = await prisma.marketplaceSection.findUnique({
      where: { id },
      include: { scopes: true },
    });
    if (!section) return apiError("Section not found", 404);
    return apiSuccess(section);
  } catch (e) {
    console.error("GET /api/marketplace/sections/[id] error:", e);
    return apiError("Failed to load section", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateSectionSchema);
    if ("error" in result) return result.error;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.marketplaceSection.update({
        where: { id },
        data: {
          ...(result.data.slug !== undefined && { slug: result.data.slug }),
          ...(result.data.name !== undefined && { name: result.data.name }),
          ...(result.data.description !== undefined && {
            description: result.data.description ?? null,
          }),
          ...(result.data.iconKey !== undefined && { iconKey: result.data.iconKey ?? null }),
          ...(result.data.imageUrl !== undefined && { imageUrl: result.data.imageUrl ?? null }),
          ...(result.data.status !== undefined && { status: result.data.status }),
          ...(result.data.creationPath !== undefined && {
            creationPath: result.data.creationPath,
          }),
          ...(result.data.blockNames !== undefined && { blockNames: result.data.blockNames }),
          ...(result.data.components !== undefined && {
            components: result.data.components as never,
          }),
          ...(result.data.layout !== undefined && {
            layout: (result.data.layout ?? undefined) as never,
          }),
        },
      });

      // If scopes provided, replace them all (simpler than diffing for MVP).
      if (result.data.scopes !== undefined) {
        await tx.marketplaceSectionScope.deleteMany({ where: { sectionId: id } });
        if (result.data.scopes.length > 0) {
          await tx.marketplaceSectionScope.createMany({
            data: result.data.scopes.map((s, idx) => ({
              sectionId: id,
              blockName: s.blockName,
              scopeType: s.scopeType,
              scopeValue: s.scopeValue ?? null,
              sortOrder: s.sortOrder ?? idx,
              allowedProfileTypeIds: s.allowedProfileTypeIds ?? [],
              allowedRoleIds: s.allowedRoleIds ?? [],
            })),
          });
        }
      }

      return tx.marketplaceSection.findUniqueOrThrow({
        where: { id },
        include: { scopes: true },
      });
    });

    revalidatePath("/admin/marketplace");
    revalidatePath("/explore");
    revalidatePath(`/explore/${updated.slug}`);
    return apiSuccess(updated);
  } catch (e) {
    console.error("PATCH /api/marketplace/sections/[id] error:", e);
    return apiError("Failed to update section", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const section = await prisma.marketplaceSection.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!section) return apiError("Section not found", 404);

    await prisma.marketplaceSection.delete({ where: { id } });
    revalidatePath("/admin/marketplace");
    revalidatePath("/explore");
    revalidatePath(`/explore/${section.slug}`);
    return apiSuccess({ id });
  } catch (e) {
    console.error("DELETE /api/marketplace/sections/[id] error:", e);
    return apiError("Failed to delete section", 500);
  }
}
