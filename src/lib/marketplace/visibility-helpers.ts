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
  // roleIds always empty post Sub-etapa 3.5 — NetworkProfileRole removed.
  // Marketplace visibility still gates on profileTypeId; role-based gating
  // returns post-Fase 3 with new RBAC.
  if (!profileId) return { profileId: null, profileTypeId: null, roleIds: [] };
  const profile = await prisma.networkProfile.findUnique({
    where: { id: profileId },
    select: { id: true, profileTypeId: true },
  });
  if (!profile) return { profileId, profileTypeId: null, roleIds: [] };
  return {
    profileId: profile.id,
    profileTypeId: profile.profileTypeId,
    roleIds: [],
  };
}
