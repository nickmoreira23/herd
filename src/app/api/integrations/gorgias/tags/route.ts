import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { GorgiasService } from "@/lib/services/gorgias";

export async function GET() {
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

    const tags = await svc.listTags();
    return apiSuccess(tags);
  } catch (e) {
    console.error("GET /api/integrations/gorgias/tags error:", e);
    return apiError("Failed to fetch Gorgias tags", 500);
  }
}
