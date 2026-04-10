import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateProfileSchema } from "@/lib/validators/profile";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  const user = await prisma.networkProfile.findUnique({
    where: { id: userId },
    include: {
      profileType: { select: { id: true, displayName: true, slug: true, color: true } },
      profileRoles: {
        include: { role: { select: { id: true, displayName: true, slug: true } } },
      },
    },
  });
  if (!user) return apiError("User not found", 404);

  // Return a flat shape that profile-client.tsx expects
  return apiSuccess({
    ...user,
    name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
    role: user.profileRoles?.[0]?.role?.displayName ?? user.profileType.displayName,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  const result = await parseAndValidate(request, updateProfileSchema);
  if ("error" in result) return result.error;

  // Map 'name' field to firstName/lastName if provided
  const data: Record<string, unknown> = {};
  if (result.data.name) {
    const parts = result.data.name.trim().split(/\s+/);
    data.firstName = parts[0];
    data.lastName = parts.slice(1).join(" ");
  }
  if (result.data.email) data.email = result.data.email;
  if (result.data.phone !== undefined) data.phone = result.data.phone;
  if (result.data.avatarUrl !== undefined) data.avatarUrl = result.data.avatarUrl;

  const user = await prisma.networkProfile.update({
    where: { id: userId },
    data,
    include: {
      profileType: { select: { id: true, displayName: true, slug: true, color: true } },
      profileRoles: {
        include: { role: { select: { id: true, displayName: true, slug: true } } },
      },
    },
  });

  return apiSuccess({
    ...user,
    name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
    role: user.profileRoles?.[0]?.role?.displayName ?? user.profileType.displayName,
  });
}
