import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createMeetingSchema } from "@/lib/validators/meeting";

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
    include: { participants: true },
  });

  const stats = {
    total: meetings.length,
    scheduled: meetings.filter((m) => m.status === "SCHEDULED").length,
    recording: meetings.filter((m) => m.status === "RECORDING").length,
    processing: meetings.filter((m) => m.status === "PROCESSING").length,
    ready: meetings.filter((m) => m.status === "READY").length,
    error: meetings.filter((m) => m.status === "ERROR").length,
  };

  return apiSuccess({ meetings, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createMeetingSchema);
  if ("error" in result) return result.error;

  const { participants, ...meetingData } = result.data;

  const meeting = await prisma.meeting.create({
    data: {
      ...meetingData,
      participantCount: participants?.length ?? 0,
      participants: participants
        ? { create: participants }
        : undefined,
    },
    include: { participants: true },
  });

  return apiSuccess(meeting, 201);
}
