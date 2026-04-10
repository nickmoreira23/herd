import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      head: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      children: {
        include: {
          head: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      members: {
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              status: true,
              profileType: { select: { displayName: true, color: true } },
              profileRoles: { include: { role: { select: { displayName: true } } } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!department) return apiError("Department not found", 404);
  return apiSuccess(department);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, parentId, headId, color, icon, sortOrder } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (description !== undefined) updates.description = description || null;
    if (parentId !== undefined) updates.parentId = parentId || null;
    if (headId !== undefined) updates.headId = headId || null;
    if (color !== undefined) updates.color = color || null;
    if (icon !== undefined) updates.icon = icon || null;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const department = await prisma.department.update({
      where: { id },
      data: updates,
      include: {
        parent: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return apiSuccess(department);
  } catch {
    return apiError("Failed to update department", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.department.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch {
    return apiError("Failed to delete department", 500);
  }
}
