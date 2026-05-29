import { requireOrgRole } from "@/lib/permissions/require-org-role";
import { apiError } from "@/lib/api-utils";
import { revokeInvitation } from "@/lib/invitations/invitation-service";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import {
  InvitationNotFoundError,
  InvitationNotRevocableError,
} from "@/lib/invitations/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await requireOrgRole(["OWNER", "ADMIN"]);
  if (session instanceof Response) return session;

  const { token } = await params;

  try {
    const orgId = session.user.activeOrgId!;
    await revokeInvitation({
      token,
      organizationId: orgId,
    });

    // Audit: invitation revoked. The actor (session.user.id) only exists at the
    // route layer, so the audit is written here rather than in the service.
    // The row survives revoke (expiresAt set to now), so we read its id + email
    // for the trail. Same tenant (orgId) as the revoke action. Best-effort.
    const revoked = await prisma.organizationInvitation.findFirst({
      where: { token, organizationId: orgId },
      select: { id: true, email: true },
    });
    if (revoked) {
      await writeAuditLog({
        tenantId: orgId,
        actorProfileId: session.user.id,
        action: "invitation.revoked",
        resourceType: "invitation",
        resourceId: revoked.id,
        metadata: { email: revoked.email },
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof InvitationNotFoundError) {
      return apiError(err.message, 404);
    }
    if (err instanceof InvitationNotRevocableError) {
      return apiError(err.message, 409);
    }
    throw err;
  }
}
