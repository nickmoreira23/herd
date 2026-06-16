import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateIntegrationSchema } from "@/lib/validators/integration";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getOrgIdFromRequest();
    const integration = await prisma.integration.findUnique({
      where: { id },
      include: {
        // L1b.2a — dropped the nested subscriptionTier include (joins the soon-
        // RLS-strict tier without the GUC; Integration parent is unscoped). Tier
        // joined in memory below. tierMappings (IntegrationTierMapping) is itself
        // tenant-scoped + empty in PROD — its own wiring is out of L1b scope.
        tierMappings: {
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

    // L1b.2a — join tier into each mapping under the host org (tier traversal).
    const mappingTierIds = [...new Set(integration.tierMappings.map((m) => m.subscriptionTierId))];
    const mappingTiers = orgId
      ? await withTenant(orgId, () =>
          prisma.subscriptionTier.findMany({ where: { id: { in: mappingTierIds } } })
        )
      : [];
    const mappingTierById = new Map(mappingTiers.map((t) => [t.id, t]));
    const integrationWithTiers = {
      ...integration,
      tierMappings: integration.tierMappings.flatMap((m) => {
        const subscriptionTier = mappingTierById.get(m.subscriptionTierId);
        if (!subscriptionTier) return [];
        return [{ ...m, subscriptionTier }];
      }),
    };
    return apiSuccess(integrationWithTiers);
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
