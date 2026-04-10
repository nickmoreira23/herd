import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { ZoomService } from "@/lib/services/zoom";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "zoom" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Zoom is not connected", 400);
    }

    const service = new ZoomService(integration.id);
    const profile = await service.getUserProfile();
    return apiSuccess({ profile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch user";
    return apiError(msg, 500);
  }
}
