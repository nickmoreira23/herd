import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { RechargeService } from "@/lib/services/recharge";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return apiError("Integration not found", 404);
    if (!integration.credentials) return apiError("Integration not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };

    let result: { shop?: string; email?: string } = {};
    let error: string | null = null;

    if (integration.slug === "recharge") {
      const svc = new RechargeService(creds.apiToken);
      try {
        result = await svc.testConnection();
      } catch (err) {
        error = err instanceof Error ? err.message : "Test failed";
      }
    }

    // Log
    await prisma.integrationSyncLog.create({
      data: {
        integrationId: id,
        action: "test_connection",
        status: error ? "error" : "success",
        details: error || "Connection test passed",
      },
    });

    if (error) {
      await prisma.integration.update({
        where: { id },
        data: { status: "ERROR", lastSyncError: error },
      });
      return apiError(error, 400);
    }

    return apiSuccess({ connected: true, ...result });
  } catch (e) {
    console.error("POST /api/integrations/[id]/test error:", e);
    return apiError("Failed to test connection", 500);
  }
}
