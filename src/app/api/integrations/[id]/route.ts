import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateIntegrationSchema } from "@/lib/validators/integration";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({
      where: { id },
      include: {
        tierMappings: {
          include: { subscriptionTier: true },
          orderBy: { createdAt: "desc" },
        },
        syncLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        webhookEvents: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!integration) return apiError("Integration not found", 404);
    return apiSuccess(integration);
  } catch (e) {
    console.error("GET /api/integrations/[id] error:", e);
    return apiError("Failed to fetch integration", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updateIntegrationSchema);
    if ("error" in result) return result.error;

    const integration = await prisma.integration.update({
      where: { id },
      data: result.data,
    });
    return apiSuccess(integration);
  } catch (e) {
    console.error("PATCH /api/integrations/[id] error:", e);
    return apiError("Failed to update integration", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.integration.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/integrations/[id] error:", e);
    return apiError("Failed to delete integration", 500);
  }
}
