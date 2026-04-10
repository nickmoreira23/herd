import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { SalesforceService } from "@/lib/services/salesforce";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "salesforce" },
    });

    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("Salesforce is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new SalesforceService(creds.apiToken, creds.domain);
    const stats = await svc.getStats();

    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/salesforce/stats error:", e);
    return apiError("Failed to fetch Salesforce stats", 500);
  }
}
