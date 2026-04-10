import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { AttioService } from "@/lib/services/attio";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "attio" },
    });

    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Attio is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new AttioService(creds.apiToken);
    const stats = await svc.getStats();

    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/attio/stats error:", e);
    return apiError("Failed to fetch Attio stats", 500);
  }
}
