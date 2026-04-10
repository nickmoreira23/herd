import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { ZoomService } from "@/lib/services/zoom";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "zoom" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Zoom is not connected", 400);
    }

    const service = new ZoomService(integration.id);
    const meeting = await service.getMeeting(meetingId);
    return apiSuccess({ meeting });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch meeting";
    return apiError(msg, 500);
  }
}
