import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateAgentSkillSchema } from "@/lib/validators/agent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const { id, skillId } = await params;
    const result = await parseAndValidate(request, updateAgentSkillSchema);
    if ("error" in result) return result.error;

    const skill = await prisma.agentSkill.update({
      where: { id: skillId, agentId: id },
      data: result.data,
    });
    return apiSuccess(skill);
  } catch (e) {
    console.error("PATCH /api/agents/[id]/skills/[skillId] error:", e);
    return apiError("Failed to update skill", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const { id, skillId } = await params;
    await prisma.agentSkill.delete({
      where: { id: skillId, agentId: id },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/agents/[id]/skills/[skillId] error:", e);
    return apiError("Failed to delete skill", 500);
  }
}
