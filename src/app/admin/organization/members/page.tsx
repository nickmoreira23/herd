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
          // System role (role≠null) AND custom-role assignments (roleId≠null,
          // R&P Fase 7c-2b SOMA). Split server-side below into `roles` (system)
          // and `customRoles` so the system-role path stays untouched.
          select: {
            role: true,
            scopeType: true,
            roleId: true,
            customRole: { select: { id: true, name: true } },
          },
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
    ?.roles.find((r) => r.scopeType === "ORG" && r.role)?.role;
  // R&P Fase 7b — `canManage` moved client-side (useCan in MembersClient). Only
  // `canManageOwners` stays a prop: it is the finer OWNER-only rule (promote/alter
  // an OWNER), not a plain members.update grant.
  const canManageOwners =
    viewer.isSuperAdmin === true || viewerOrgRole === "OWNER";

  // Split each member's rows: `roles` keeps the SYSTEM-role shape (role≠null) the
  // client's <Select> reads, unchanged; `customRoles` carries the SOMA custom-role
  // assignments (roleId≠null) for the chips control.
  const membersForClient = members.map((m) => ({
    ...m,
    roles: m.roles
      .filter((r) => r.role)
      .map((r) => ({ role: r.role as string, scopeType: r.scopeType as string })),
    customRoles: m.roles
      .filter((r) => r.roleId && r.customRole)
      .map((r) => ({ roleId: r.roleId as string, name: r.customRole!.name })),
  }));

  return (
    <MembersClient
      members={membersForClient}
      pendingInvitations={pendingInvitations}
      organizationId={orgId}
      canManageOwners={canManageOwners}
    />
  );
}
