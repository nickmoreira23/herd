import { prisma } from "@/lib/prisma";

export interface ViewerContext {
  profileId: string | null;
  profileTypeId: string | null;
  roleIds: string[];
}

/**
 * Resolve the viewer's profile-type + roles from a NetworkProfile id.
 * Used by the public Explore surface to filter visible sections / scopes.
 */
export async function getViewerContext(
  profileId: string | null
): Promise<ViewerContext> {
  if (!profileId) return { profileId: null, profileTypeId: null, roleIds: [] };
  const profile = await prisma.networkProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      profileTypeId: true,
      profileRoles: { select: { roleId: true } },
    },
  });
  if (!profile) return { profileId, profileTypeId: null, roleIds: [] };
  return {
    profileId: profile.id,
    profileTypeId: profile.profileTypeId,
    roleIds: profile.profileRoles.map((r) => r.roleId),
  };
}
