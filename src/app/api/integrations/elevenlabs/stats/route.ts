import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { ElevenLabsService } from "@/lib/services/elevenlabs";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "elevenlabs" },
    });
    if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
      return apiError("ElevenLabs is not connected", 400);
    }
    const creds = JSON.parse(decrypt(integration.credentials));
    const svc = new ElevenLabsService(creds.apiToken);
    const stats = await svc.getStats();
    return apiSuccess(stats);
  } catch (e) {
    console.error("GET /api/integrations/elevenlabs/stats error:", e);
    return apiError("Failed to fetch ElevenLabs stats", 500);
  }
}
