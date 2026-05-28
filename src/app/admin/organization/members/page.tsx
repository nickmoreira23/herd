import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  await connection();

  const session = await auth();
  const orgId = (session?.user as { activeOrgId?: string } | undefined)?.activeOrgId;
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
