import { prisma } from "@/lib/prisma";

export async function resolveActiveOrgIdForProfile(profileId: string): Promise<string | null> {
  console.log("[resolve-active-org] called with profileId:", profileId);

  // Primary: Membership table (Sub-etapa 20+)
  const membership = await prisma.organizationMember.findFirst({
    where: { networkProfileId: profileId, status: "ACTIVE" },
    select: { organizationId: true },
    orderBy: { joinedAt: "asc" },
  });
  console.log("[resolve-active-org] Membership lookup result:", membership);

  if (membership) return membership.organizationId;

  // Fallback: ownerId (drop in Sub-etapa 20.1 once all owners have Membership rows)
  console.log("[resolve-active-org] hitting ownerId fallback");
  const org = await prisma.organization.findFirst({
    where: { ownerId: profileId },
    select: { id: true },
  });
  return org?.id ?? null;
}
