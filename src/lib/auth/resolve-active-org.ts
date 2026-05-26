import { prisma } from "@/lib/prisma";

/**
 * Resolve activeOrgId for a NetworkProfile.
 *
 * Sub-etapa 20.1: primary-only via OrganizationMember.
 * (Dual-read fallback via Organization.ownerId removed post-validation.)
 */
export async function resolveActiveOrgIdForProfile(
  profileId: string
): Promise<string | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      networkProfileId: profileId,
      status: "ACTIVE",
    },
    select: {
      organizationId: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return membership?.organizationId ?? null;
}
