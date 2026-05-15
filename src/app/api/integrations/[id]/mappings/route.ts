import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { tierMappingSchema, deleteTierMappingSchema } from "@/lib/validators/integration";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const { id } = await params;
      const mappings = await prisma.integrationTierMapping.findMany({
        where: { integrationId: id },
        include: { subscriptionTier: true },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(mappings);
    } catch (e) {
      console.error("GET /api/integrations/[id]/mappings error:", e);
      return apiError("Failed to fetch mappings", 500);
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const { id } = await params;
      const result = await parseAndValidate(request, tierMappingSchema);
      if ("error" in result) return result.error;

      const mapping = await prisma.integrationTierMapping.create({
        data: {
          tenantId: session.user.activeOrgId ?? "",
          integrationId: id,
          ...result.data,
        },
        include: { subscriptionTier: true },
      });
      return apiSuccess(mapping, 201);
    } catch (e) {
      console.error("POST /api/integrations/[id]/mappings error:", e);
      return apiError("Failed to create mapping", 500);
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      await params; // consume params
      const result = await parseAndValidate(request, deleteTierMappingSchema);
      if ("error" in result) return result.error;

      await prisma.integrationTierMapping.delete({
        where: { id: result.data.mappingId },
      });
      return apiSuccess({ deleted: true });
    } catch (e) {
      console.error("DELETE /api/integrations/[id]/mappings error:", e);
      return apiError("Failed to delete mapping", 500);
    }
  });
}
