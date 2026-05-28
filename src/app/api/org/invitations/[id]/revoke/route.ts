import { requireOrgRole } from "@/lib/permissions/require-org-role";
import { apiError } from "@/lib/api-utils";
import { revokeInvitation } from "@/lib/invitations/invitation-service";
import {
  InvitationNotFoundError,
  InvitationNotRevocableError,
} from "@/lib/invitations/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOrgRole(["OWNER", "ADMIN"]);
  if (session instanceof Response) return session;

  const { id } = await params;

  try {
    await revokeInvitation({
      invitationId: id,
      organizationId: session.user.activeOrgId!,
    });
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
