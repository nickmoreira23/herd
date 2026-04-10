import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { XTwitterService } from "@/lib/services/x-twitter";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "x-twitter" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("X/Twitter is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new XTwitterService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/x-twitter/stats error:", e);
    return apiError("Failed to fetch stats", 500);
  }
}
