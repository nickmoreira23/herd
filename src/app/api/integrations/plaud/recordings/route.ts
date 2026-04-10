import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { PlaudService } from "@/lib/services/plaud";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "plaud" },
    });
    if (!integration) return apiError("Plaud integration not found", 404);
    if (!integration.credentials) return apiError("Plaud not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as {
      apiToken: string;
      region: "us" | "eu";
    };
    const svc = new PlaudService(creds.apiToken, creds.region);
    const recordings = await svc.listRecordings();
    return apiSuccess(recordings);
  } catch (e) {
    console.error("GET /api/integrations/plaud/recordings error:", e);
    return apiError("Failed to fetch recordings", 500);
  }
}
