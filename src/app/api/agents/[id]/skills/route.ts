import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createAgentSkillSchema } from "@/lib/validators/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skills = await prisma.agentSkill.findMany({
      where: { agentId: id },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(skills);
  } catch (e) {
    console.error("GET /api/agents/[id]/skills error:", e);
    return apiError("Failed to fetch skills", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, createAgentSkillSchema);
    if ("error" in result) return result.error;

    const skill = await prisma.agentSkill.create({
      data: { ...result.data, agentId: id },
    });
    return apiSuccess(skill, 201);
  } catch (e) {
    console.error("POST /api/agents/[id]/skills error:", e);
    return apiError("Failed to create skill", 500);
  }
}
