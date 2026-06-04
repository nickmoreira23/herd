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

  const viewer = sessionOrResponse.user as {
    id?: string;
    isSuperAdmin?: boolean;
  };

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
          // Members directory shows SYSTEM roles only; custom-role rows (role NULL,
          // R&P Fase 5 SOMA) are managed in the roles UI, not here.
          where: { role: { not: null } },
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

  // Permission gate (defense-in-depth; backend already enforces via
  // requireOrgRole(["OWNER","ADMIN"]) on the invite + revoke routes).
  // Role is read from the EFFECTIVE (host-resolved) org — the members list is
  // already scoped to orgId, so the viewer's row carries their ORG-scoped role.
  // super_admin can always manage (matches requireOrgRole's bypass).
  const viewerOrgRole = members
    .find((m) => m.networkProfile.id === viewer.id)
    ?.roles.find((r) => r.scopeType === "ORG")?.role;
  const canManage =
    viewer.isSuperAdmin === true ||
    viewerOrgRole === "OWNER" ||
    viewerOrgRole === "ADMIN";
  // Mirrors the API's fine rule: only an owner (or super_admin) may promote to
  // OWNER or alter an existing OWNER. Derived from the already-resolved viewer.
  const canManageOwners =
    viewer.isSuperAdmin === true || viewerOrgRole === "OWNER";

  // Coerce to the client's system-role shape (the query already excludes null roles).
  const membersForClient = members.map((m) => ({
    ...m,
    roles: m.roles.map((r) => ({ role: r.role as string, scopeType: r.scopeType as string })),
  }));

  return (
    <MembersClient
      members={membersForClient}
      pendingInvitations={pendingInvitations}
      organizationId={orgId}
      canManage={canManage}
      canManageOwners={canManageOwners}
    />
  );
}
