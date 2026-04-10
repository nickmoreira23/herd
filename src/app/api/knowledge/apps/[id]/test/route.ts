import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getValidAccessToken } from "@/lib/knowledge/token-refresh";
import { OuraService } from "@/lib/services/oura";
import { WhoopService } from "@/lib/services/whoop";

/**
 * POST — Test the connection to the app's API.
 * Verifies that stored credentials are valid by making a lightweight API call.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const app = await prisma.knowledgeApp.findUnique({ where: { id } });
    if (!app) return apiError("App not found", 404);
    if (!app.credentials) return apiError("App not connected", 400);

    const accessToken = await getValidAccessToken(id);
    let details = "";

    if (app.slug === "oura") {
      const svc = new OuraService(accessToken);
      const result = await svc.testConnection();
      details = `Connected to Oura — email: ${result.email ?? "unknown"}`;
    } else if (app.slug === "whoop") {
      const svc = new WhoopService(accessToken);
      const result = await svc.testConnection();
      details = `Connected to WHOOP — user: ${result.userId}, email: ${result.email}`;
    } else {
      return apiError(`Test not implemented for: ${app.slug}`, 400);
    }

    await prisma.knowledgeAppSyncLog.create({
      data: {
        appId: id,
        action: "test",
        status: "success",
        details,
      },
    });

    return apiSuccess({ status: "ok", details });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection test failed";
    console.error("POST /api/knowledge/apps/[id]/test error:", e);

    // Try to log the failure (best effort)
    try {
      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: id,
          action: "test",
          status: "error",
          details: message.slice(0, 500),
        },
      });
    } catch {}

    return apiError(`Connection test failed: ${message}`, 500);
  }
}
