import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { SlackService } from "@/lib/services/slack";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "slack" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Slack is not connected", 400);
    }

    const searchParams = request.nextUrl.searchParams;
    const types = searchParams.get("types") || "public_channel,private_channel";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const service = new SlackService(integration.id);
    const channels = await service.listChannels(types, limit);
    return apiSuccess({ channels });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch channels";
    return apiError(msg, 500);
  }
}
