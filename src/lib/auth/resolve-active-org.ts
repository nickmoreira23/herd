import { prisma } from "@/lib/prisma";

export async function resolveActiveOrgIdForProfile(profileId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { ownerId: profileId },
    select: { id: true },
  });
  return org?.id ?? null;
}
