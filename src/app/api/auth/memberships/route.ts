import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/auth/memberships
 *
 * Returns the list of ACTIVE organization memberships for the current user.
 * Used by the sidebar org-switcher dropdown and the /orgs apex selector.
 *
 * Cravado Sub-etapa 22.2.
 */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  const memberships = await prisma.organizationMember.findMany({
    where: {
      networkProfileId: userId,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
          subdomain: true,
          status: true,
        },
      },
      roles: {
        select: {
          role: true,
          scopeType: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const activeMemberships = memberships
    .filter((m) => m.organization.status === "ACTIVE")
    .map((m) => ({
      orgId: m.organization.id,
      slug: m.organization.slug,
      name: m.organization.name,
      subdomain: m.organization.subdomain,
      roles: m.roles.map((r) => r.role),
    }));

  return apiSuccess(activeMemberships);
}
