import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { GorgiasService } from "@/lib/services/gorgias";

export async function GET(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gorgias" },
    });
    if (!integration) return apiError("Gorgias integration not found", 404);
    if (!integration.credentials) return apiError("Gorgias not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as {
      apiToken: string; domain: string; email: string;
    };
    const svc = new GorgiasService(creds.domain, creds.email, creds.apiToken);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return apiError("Both 'from' and 'to' date parameters are required (YYYY-MM-DD)", 400);
    }

    const statistics = await svc.getStatistics({ from, to });
    return apiSuccess(statistics);
  } catch (e) {
    console.error("GET /api/integrations/gorgias/statistics error:", e);
    return apiError("Failed to fetch Gorgias statistics", 500);
  }
}
