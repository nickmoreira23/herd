import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { HeyGenService } from "@/lib/services/heygen";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "heygen" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("HeyGen is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new HeyGenService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/heygen/stats error:", e);
    return apiError("Failed to fetch HeyGen stats", 500);
  }
}
