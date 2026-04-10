import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { profileId, title } = body;

    if (!profileId) return apiError("profileId is required");

    const member = await prisma.departmentMember.create({
      data: {
        departmentId: id,
        profileId,
        title: title || null,
      },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return apiSuccess(member, 201);
  } catch {
    return apiError("Failed to add member", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { profileId } = body;

    if (!profileId) return apiError("profileId is required");

    await prisma.departmentMember.delete({
      where: {
        departmentId_profileId: { departmentId: id, profileId },
      },
    });

    return apiSuccess({ removed: true });
  } catch {
    return apiError("Failed to remove member", 500);
  }
}
