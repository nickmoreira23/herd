import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { StabilityAIService } from "@/lib/services/stability-ai";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "stability-ai" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Stability AI is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new StabilityAIService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/stability-ai/stats error:", e);
    return apiError("Failed to fetch Stability AI stats", 500);
  }
}
