import { prisma } from "@/lib/prisma";
import type {
  MembershipRole,
  OrganizationMember,
} from "@prisma/client";

export type OrgMemberWithRoles = OrganizationMember & {
  roles: MembershipRole[];
};

/**
 * Manual org-isolation guard. `OrganizationMember` / `MembershipRole` are NOT
 * tenant-scoped (scoped by `organization_id` FK, RLS permissive), so the Prisma
 * tenancy Extension does not filter them — callers must verify ownership here.
 *
 * Returns the member (with its roles eagerly loaded) when it belongs to `orgId`,
 * or `null` on mismatch/not-found. Returning `null` for a cross-org id is
 * deliberate: the route maps it to 404 so existence does not leak across orgs.
 */
export async function assertMemberBelongsToOrg(
  memberId: string,
  orgId: string
): Promise<OrgMemberWithRoles | null> {
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { roles: true },
  });
  if (!member || member.organizationId !== orgId) return null;
  return member;
}

/** The single ORG-scoped role row of a member (V1 invariant: at most one). */
export function getOrgRole(
  member: OrgMemberWithRoles
): MembershipRole | undefined {
  return member.roles.find((r) => r.scopeType === "ORG");
}

/** Active members of `orgId` holding an ORG-scoped OWNER role. */
export async function countActiveOwners(orgId: string): Promise<number> {
  return prisma.organizationMember.count({
    where: {
      organizationId: orgId,
      status: "ACTIVE",
      roles: { some: { role: "OWNER", scopeType: "ORG" } },
    },
  });
}
