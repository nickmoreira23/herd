import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const departments = await prisma.department.findMany({
    include: {
      head: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { members: true, children: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Build tree structure
  interface DeptNode {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    color: string | null;
    icon: string | null;
    head: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
    _count: { members: number; children: number };
    children: DeptNode[];
  }

  const map = new Map<string, DeptNode>();
  const roots: DeptNode[] = [];

  for (const d of departments) {
    map.set(d.id, { ...d, children: [] });
  }

  for (const d of departments) {
    const node = map.get(d.id)!;
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return apiSuccess(roots);
}
