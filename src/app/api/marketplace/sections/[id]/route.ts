import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { updateSectionSchema } from "@/lib/validators/marketplace";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("Section not found", 404);

  return withTenant(orgId, async () => {
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
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const { id } = await params;
  const result = await parseAndValidate(request, updateSectionSchema);
  if ("error" in result) return result.error;

  return withTenant(orgId, async () => {
    try {
      // Sequential ops (no interactive prisma.$transaction): each tenant-scoped
      // op is wrapped by the tenancy Extension in its own SET-LOCAL transaction;
      // nesting an outer interactive tx would break. RLS scopes every op to the
      // host org — a cross-tenant id simply resolves to nothing.
      await prisma.marketplaceSection.update({
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

      // Reconcile scopes with a diff instead of a full wipe+recreate. Scope
      // identity is (blockName, scopeType, scopeValue) — the payload carries no
      // id. Create the new, update the changed, delete the absent, and leave
      // unchanged scopes untouched (no PK churn, no destructive replace). Only
      // runs when the caller actually sent `scopes`.
      if (result.data.scopes !== undefined) {
        const keyOf = (s: {
          blockName: string;
          scopeType: string;
          scopeValue: string | null;
        }) => JSON.stringify([s.blockName, s.scopeType, s.scopeValue ?? null]);
        const sameSet = (a: string[], b: string[]) =>
          a.length === b.length &&
          [...a].sort().join(",") === [...b].sort().join(",");

        const existing = await prisma.marketplaceSectionScope.findMany({
          where: { sectionId: id },
        });
        const existingByKey = new Map(existing.map((s) => [keyOf(s), s]));
        const desiredKeys = new Set<string>();

        for (const [idx, s] of result.data.scopes.entries()) {
          const desired = {
            blockName: s.blockName,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue ?? null,
            sortOrder: s.sortOrder ?? idx,
            allowedRoles: s.allowedRoles ?? [],
          };
          const key = keyOf(desired);
          desiredKeys.add(key);
          const match = existingByKey.get(key);

          if (!match) {
            await prisma.marketplaceSectionScope.create({
              data: { tenantId: orgId, sectionId: id, ...desired },
            });
            continue;
          }

          const unchanged =
            match.sortOrder === desired.sortOrder &&
            sameSet(match.allowedRoles, desired.allowedRoles);
          if (!unchanged) {
            await prisma.marketplaceSectionScope.update({
              where: { id: match.id },
              data: {
                sortOrder: desired.sortOrder,
                allowedRoles: desired.allowedRoles,
              },
            });
          }
        }

        const removedIds = existing
          .filter((s) => !desiredKeys.has(keyOf(s)))
          .map((s) => s.id);
        if (removedIds.length > 0) {
          await prisma.marketplaceSectionScope.deleteMany({
            where: { id: { in: removedIds } },
          });
        }
      }

      const updated = await prisma.marketplaceSection.findUniqueOrThrow({
        where: { id },
        include: { scopes: true },
      });

      revalidatePath("/admin/marketplace");
      revalidatePath("/explore");
      revalidatePath(`/explore/${updated.slug}`);
      return apiSuccess(updated);
    } catch (e) {
      console.error("PATCH /api/marketplace/sections/[id] error:", e);
      return apiError("Failed to update section", 500);
    }
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  return withTenant(orgId, async () => {
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
  });
}
