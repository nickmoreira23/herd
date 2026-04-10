import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { PinterestService } from "@/lib/services/pinterest";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "pinterest" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Pinterest is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new PinterestService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/pinterest/stats error:", e);
    return apiError("Failed to fetch stats", 500);
  }
}
