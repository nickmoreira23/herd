import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { TerraService } from "@/lib/services/terra";

/**
 * POST — Generate a Terra widget session URL for Apple Health connection.
 * The frontend opens this URL for the user to authorize Apple Health access.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const app = await prisma.knowledgeApp.findUnique({ where: { id } });
    if (!app) return apiError("App not found", 404);
    if (app.slug !== "apple-health") {
      return apiError("This route is only for Apple Health", 400);
    }

    const devId = process.env.TERRA_DEV_ID;
    const apiKey = process.env.TERRA_API_KEY;
    if (!devId || !apiKey) {
      return apiError("Terra credentials not configured (TERRA_DEV_ID, TERRA_API_KEY)", 500);
    }

    const terra = new TerraService(devId, apiKey);
    const { url, sessionId } = await terra.generateWidgetSession(app.id);

    await prisma.knowledgeAppSyncLog.create({
      data: {
        appId: id,
        action: "widget_session",
        status: "success",
        details: `Widget session created: ${sessionId}`,
      },
    });

    return apiSuccess({ widgetUrl: url, sessionId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate widget session";
    console.error("POST /api/knowledge/apps/[id]/terra/widget error:", e);
    return apiError(message, 500);
  }
}
