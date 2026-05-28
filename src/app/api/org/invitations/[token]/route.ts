import { apiError } from "@/lib/api-utils";
import { getInvitationByToken } from "@/lib/invitations/invitation-service";

// Public route — no auth required (token is the credential)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const data = await getInvitationByToken(token);
  if (!data) return apiError("Invitation not found", 404);

  const now = new Date();
  const expired =
    data.invitation.expiresAt != null && now > data.invitation.expiresAt;

  return Response.json({ data: { ...data, expired } });
}
