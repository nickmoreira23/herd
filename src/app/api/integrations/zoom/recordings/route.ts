import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { ZoomService } from "@/lib/services/zoom";

export async function GET(req: NextRequest) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "zoom" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Zoom is not connected", 400);
    }

    const { searchParams } = new URL(req.url);
    const service = new ZoomService(integration.id);

    const recordings = await service.listRecordings({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 30,
      nextPageToken: searchParams.get("nextPageToken") || undefined,
    });

    return apiSuccess({ recordings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch recordings";
    return apiError(msg, 500);
  }
}
