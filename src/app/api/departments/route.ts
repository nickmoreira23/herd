import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const departments = await prisma.department.findMany({
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      head: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { members: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return apiSuccess(departments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, parentId, headId, networkType, color, icon, sortOrder } = body;

    if (!name) return apiError("Name is required");

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await prisma.department.findUnique({ where: { slug } });
    if (existing) return apiError("A department with this name already exists");

    const department = await prisma.department.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        headId: headId || null,
        networkType: networkType || "INTERNAL",
        color: color || null,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        parent: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return apiSuccess(department, 201);
  } catch (e) {
    return apiError("Failed to create department", 500, e instanceof Error ? e.message : undefined);
  }
}
