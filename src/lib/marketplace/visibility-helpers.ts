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
  // roleIds + profileTypeId both empty post Sub-etapa 3.5/3.6 — NetworkProfileRole
  // + NetworkProfileType removed. Marketplace visibility temporarily passes
  // everything; gating returns with new RBAC/identity model.
  if (!profileId) return { profileId: null, profileTypeId: null, roleIds: [] };
  const profile = await prisma.networkProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!profile) return { profileId, profileTypeId: null, roleIds: [] };
  return {
    profileId: profile.id,
    profileTypeId: null,
    roleIds: [],
  };
}
