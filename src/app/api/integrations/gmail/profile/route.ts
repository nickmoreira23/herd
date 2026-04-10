import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GmailService } from "@/lib/services/gmail";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const svc = new GmailService(integration.id);
    const profile = await svc.getProfile();
    return apiSuccess(profile);
  } catch (e) {
    console.error("GET /api/integrations/gmail/profile error:", e);
    return apiError("Failed to fetch Gmail profile", 500);
  }
}
