import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateAgentToolSchema } from "@/lib/validators/agent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; toolId: string }> }
) {
  try {
    const { id, toolId } = await params;
    const result = await parseAndValidate(request, updateAgentToolSchema);
    if ("error" in result) return result.error;

    const tool = await prisma.agentTool.update({
      where: { id: toolId, agentId: id },
      data: result.data,
    });
    return apiSuccess(tool);
  } catch (e) {
    console.error("PATCH /api/agents/[id]/tools/[toolId] error:", e);
    return apiError("Failed to update tool", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; toolId: string }> }
) {
  try {
    const { id, toolId } = await params;
    await prisma.agentTool.delete({
      where: { id: toolId, agentId: id },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/agents/[id]/tools/[toolId] error:", e);
    return apiError("Failed to delete tool", 500);
  }
}
