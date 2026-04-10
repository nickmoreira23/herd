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
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const service = new SlackService(integration.id);
    const users = await service.listUsers(limit);
    return apiSuccess({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch users";
    return apiError(msg, 500);
  }
}
