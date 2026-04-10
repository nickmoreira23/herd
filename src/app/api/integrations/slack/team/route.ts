import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { SlackService } from "@/lib/services/slack";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "slack" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Slack is not connected", 400);
    }

    const service = new SlackService(integration.id);
    const team = await service.getTeamInfo();
    return apiSuccess({ team });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch team info";
    return apiError(msg, 500);
  }
}
