import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeItemSchema } from "@/lib/validators/agent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const result = await parseAndValidate(request, updateKnowledgeItemSchema);
    if ("error" in result) return result.error;

    const item = await prisma.agentKnowledgeItem.update({
      where: { id: itemId, agentId: id },
      data: result.data,
    });
    return apiSuccess(item);
  } catch (e) {
    console.error("PATCH /api/agents/[id]/knowledge/[itemId] error:", e);
    return apiError("Failed to update knowledge item", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    await prisma.agentKnowledgeItem.delete({
      where: { id: itemId, agentId: id },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/agents/[id]/knowledge/[itemId] error:", e);
    return apiError("Failed to delete knowledge item", 500);
  }
}
