import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateMeetingSchema } from "@/lib/validators/meeting";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!meeting) return apiError("Meeting not found", 404);
  return apiSuccess(meeting);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return apiError("Meeting not found", 404);

  const result = await parseAndValidate(request, updateMeetingSchema);
  if ("error" in result) return result.error;

  const { participants, ...data } = result.data;

  const meeting = await prisma.meeting.update({
    where: { id },
    data,
    include: { participants: true },
  });

  return apiSuccess(meeting);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return apiError("Meeting not found", 404);

  await prisma.meeting.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
