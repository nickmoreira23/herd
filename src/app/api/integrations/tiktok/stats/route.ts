import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { TikTokService } from "@/lib/services/tiktok";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "tiktok" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("TikTok is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new TikTokService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/tiktok/stats error:", e);
    return apiError("Failed to fetch stats", 500);
  }
}
