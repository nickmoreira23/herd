import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { ReplicateService } from "@/lib/services/replicate";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "replicate" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Replicate is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new ReplicateService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/replicate/stats error:", e);
    return apiError("Failed to fetch Replicate stats", 500);
  }
}
