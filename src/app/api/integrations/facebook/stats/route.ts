import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { FacebookService } from "@/lib/services/facebook";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "facebook" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Facebook is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new FacebookService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/facebook/stats error:", e);
    return apiError("Failed to fetch stats", 500);
  }
}
