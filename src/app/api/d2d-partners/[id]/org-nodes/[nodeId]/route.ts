import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateOrgNodeSchema } from "@/lib/validators/org-node";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const { nodeId } = await params;
    const result = await parseAndValidate(request, updateOrgNodeSchema);
    if ("error" in result) return result.error;

    const node = await prisma.orgNode.update({ where: { id: nodeId }, data: result.data });
    return apiSuccess(node);
  } catch (e) {
    console.error("PATCH /api/d2d-partners/[id]/org-nodes/[nodeId] error:", e);
    return apiError("Failed to update org node", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const { nodeId } = await params;
    await prisma.orgNode.delete({ where: { id: nodeId } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/d2d-partners/[id]/org-nodes/[nodeId] error:", e);
    return apiError("Failed to delete org node", 500);
  }
}
