import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { RunwayService } from "@/lib/services/runway";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "runway" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Runway is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new RunwayService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/runway/stats error:", e);
    return apiError("Failed to fetch Runway stats", 500);
  }
}
