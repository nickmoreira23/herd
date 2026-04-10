import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { GomaService } from "@/lib/services/goma";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "goma" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Goma is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new GomaService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/goma/stats error:", e);
    return apiError("Failed to fetch Goma stats", 500);
  }
}
