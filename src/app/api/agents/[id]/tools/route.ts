import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createAgentToolSchema } from "@/lib/validators/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tools = await prisma.agentTool.findMany({
      where: { agentId: id },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(tools);
  } catch (e) {
    console.error("GET /api/agents/[id]/tools error:", e);
    return apiError("Failed to fetch tools", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, createAgentToolSchema);
    if ("error" in result) return result.error;

    const tool = await prisma.agentTool.create({
      data: { ...result.data, agentId: id },
    });
    return apiSuccess(tool, 201);
  } catch (e) {
    console.error("POST /api/agents/[id]/tools error:", e);
    return apiError("Failed to create tool", 500);
  }
}
