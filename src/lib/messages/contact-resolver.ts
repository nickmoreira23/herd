import { prisma } from "@/lib/prisma";

interface ResolveParams {
  email?: string | null;
  externalUserId?: string | null;
  integrationId?: string | null;
}

/**
 * Attempts to resolve a contact (NetworkProfile) from message sender information.
 * Returns the profile ID if found, null otherwise.
 */
export async function resolveContact(
  params: ResolveParams
): Promise<string | null> {
  // 1. Match by email
  if (params.email) {
    const profile = await prisma.networkProfile.findFirst({
      where: { email: params.email },
      select: { id: true },
    });
    if (profile) return profile.id;
  }

  // 2. Match by external user ID via MemberConnection
  if (params.externalUserId && params.integrationId) {
    const connection = await prisma.memberConnection.findFirst({
      where: {
        externalUserId: params.externalUserId,
        integrationId: params.integrationId,
      },
      select: { profileId: true },
    });
    if (connection) return connection.profileId;
  }

  // No match found — contactId will remain null (can be manually linked later)
  return null;
}
