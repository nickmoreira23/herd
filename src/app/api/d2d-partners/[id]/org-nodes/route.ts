import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createOrgNodeSchema } from "@/lib/validators/org-node";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const nodes = await prisma.orgNode.findMany({
      where: { d2dPartnerId: id },
      orderBy: { createdAt: "asc" },
    });
    return apiSuccess(nodes);
  } catch (e) {
    console.error("GET /api/d2d-partners/[id]/org-nodes error:", e);
    return apiError("Failed to fetch org nodes", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, createOrgNodeSchema);
    if ("error" in result) return result.error;

    const node = await prisma.orgNode.create({
      data: { ...result.data, d2dPartnerId: id },
    });
    return apiSuccess(node, 201);
  } catch (e) {
    console.error("POST /api/d2d-partners/[id]/org-nodes error:", e);
    return apiError("Failed to create org node", 500);
  }
}
