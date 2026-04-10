import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateAgentSchema } from "@/lib/validators/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        tierAccess: {
          include: { tier: { select: { id: true, name: true } } },
        },
        knowledgeItems: { orderBy: { sortOrder: "asc" } },
        skills: { orderBy: { sortOrder: "asc" } },
        tools: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!agent) return apiError("Agent not found", 404);
    return apiSuccess(agent);
  } catch (e) {
    console.error("GET /api/agents/[id] error:", e);
    return apiError("Failed to fetch agent", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateAgentSchema);
    if ("error" in result) return result.error;

    const agent = await prisma.agent.update({
      where: { id },
      data: result.data,
    });

    return apiSuccess(agent);
  } catch (e) {
    console.error("PATCH /api/agents/[id] error:", e);
    return apiError("Failed to update agent", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.agent.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/agents/[id] error:", e);
    return apiError("Failed to delete agent", 500);
  }
}
