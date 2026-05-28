import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireOrgRole } from "@/lib/permissions";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  await connection();

  // Host-aware org resolution (Sub-etapa 22 V2 + cross-tenant fix):
  // requireOrgRole reads x-org-id (injected by proxy.ts from the request host)
  // as PRIMARY, JWT activeOrgId only as apex fallback. It also validates the
  // viewer has ACTIVE membership in the effective org (super_admin bypasses).
  // Reading session.user.activeOrgId directly (host-blind) leaked another
  // org's members when a user's primary org differed from the host.
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) redirect("/login");
  const orgId = sessionOrResponse.user.activeOrgId;
  if (!orgId) redirect("/login");

  const [members, pendingInvitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: {
        networkProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        roles: {
          select: { role: true, scopeType: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.organizationInvitation.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <MembersClient
      members={members}
      pendingInvitations={pendingInvitations}
      organizationId={orgId}
    />
  );
}
