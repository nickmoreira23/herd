import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import type { Actor } from "./types";

/**
 * Builds an Actor with fresh memberships + roles from DB.
 * V1 cravado: per-request lookup (no JWT cache).
 */
export async function getActor(session: Session): Promise<Actor | null> {
  const profileId = session?.user?.id;
  if (!profileId) return null;

  const profile = await prisma.networkProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      isSuperAdmin: true,
      organizationMemberships: {
        where: { status: "ACTIVE" },
        select: {
          organizationId: true,
          status: true,
          roles: {
            select: {
              role: true,
              scopeType: true,
              scopeId: true,
            },
          },
        },
      },
    },
  });

  if (!profile) return null;

  return {
    profileId: profile.id,
    isSuperAdmin: profile.isSuperAdmin,
    memberships: profile.organizationMemberships.map((m) => ({
      organizationId: m.organizationId,
      status: m.status,
      roles: m.roles,
    })),
  };
}
