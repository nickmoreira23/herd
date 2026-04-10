import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { GammaService } from "@/lib/services/gamma";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gamma" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Gamma is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new GammaService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/gamma/stats error:", e);
    return apiError("Failed to fetch Gamma stats", 500);
  }
}
