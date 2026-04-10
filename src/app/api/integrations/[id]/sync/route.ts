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

    let recordsProcessed = 0;
    let details = "";

    if (integration.slug === "recharge") {
      const svc = new RechargeService(creds.apiToken);
      try {
        const plans = await svc.listPlans({ limit: 250 });
        recordsProcessed = plans.length;
        details = `Synced ${plans.length} plans from Recharge`;

        // Update lastSyncAt
        await prisma.integration.update({
          where: { id },
          data: { lastSyncAt: new Date(), lastSyncError: null },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        await prisma.integration.update({
          where: { id },
          data: { lastSyncError: message },
        });
        await prisma.integrationSyncLog.create({
          data: {
            integrationId: id,
            action: "sync_plans",
            status: "error",
            details: message,
          },
        });
        return apiError(message, 500);
      }
    }

    await prisma.integrationSyncLog.create({
      data: {
        integrationId: id,
        action: "sync_plans",
        status: "success",
        details,
        recordsProcessed,
      },
    });

    return apiSuccess({ recordsProcessed, details });
  } catch (e) {
    console.error("POST /api/integrations/[id]/sync error:", e);
    return apiError("Failed to sync", 500);
  }
}
