import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { RecallAiService } from "@/lib/services/recall-ai";

const PLATFORM_MAP: Record<string, string> = {
  "meet.google.com": "GOOGLE_MEET",
  "zoom.us": "ZOOM",
  "teams.microsoft.com": "MICROSOFT_TEAMS",
  "teams.live.com": "MICROSOFT_TEAMS",
};

/**
 * POST — Manually deploy a Recall.ai bot for a meeting URL.
 *
 * Body: { meetingUrl: string, title?: string, scheduledAt?: string }
 *
 * Creates a Meeting record and sends a recording bot to the URL.
 */
export async function POST(req: NextRequest) {
  const { meetingUrl, title, scheduledAt } = await req.json();

  if (!meetingUrl || typeof meetingUrl !== "string") {
    return apiError("Meeting URL is required", 400);
  }

  const service = await RecallAiService.fromIntegration();
  if (!service) {
    return apiError(
      "Recall.ai is not connected. Please connect it in Integrations.",
      400
    );
  }

  // Detect platform from URL
  let platform = "OTHER";
  for (const [domain, p] of Object.entries(PLATFORM_MAP)) {
    if (meetingUrl.includes(domain)) {
      platform = p;
      break;
    }
  }

  // Create meeting record
  const meeting = await prisma.meeting.create({
    data: {
      title:
        title || `Virtual Meeting ${new Date().toLocaleDateString()}`,
      meetingType: "VIRTUAL",
      platform: platform as
        | "GOOGLE_MEET"
        | "ZOOM"
        | "MICROSOFT_TEAMS"
        | "OTHER",
      status: "SCHEDULED",
      meetingUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    },
  });

  // Deploy bot
  try {
    const bot = await service.createBot({
      meeting_url: meetingUrl,
      bot_name: "HERD Notetaker",
      recording_mode: "audio_only",
      automatic_leave: {
        waiting_room_timeout: 600,
        noone_joined_timeout: 300,
        everyone_left_timeout: 30,
      },
    });

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { externalBotId: bot.id },
    });

    return apiSuccess({ meeting: { ...meeting, externalBotId: bot.id } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to deploy bot";
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { errorMessage: message },
    });
    return apiError(message, 500);
  }
}
