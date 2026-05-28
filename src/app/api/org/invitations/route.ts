import { z } from "zod";
import { MemberRole } from "@prisma/client";
import { requireOrgRole } from "@/lib/permissions/require-org-role";
import { apiError } from "@/lib/api-utils";
import {
  createInvitation,
  listPendingInvitations,
} from "@/lib/invitations/invitation-service";
import { InvitationAlreadyExistsError } from "@/lib/invitations/errors";

const createInvitationSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER),
});

export async function POST(request: Request) {
  const session = await requireOrgRole(["OWNER", "ADMIN"]);
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body", 400);

  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const createdById = (session.user as { id?: string }).id;
  if (!createdById) return apiError("Profile ID missing from session", 401);

  try {
    const invitation = await createInvitation({
      organizationId: session.user.activeOrgId!,
      email: parsed.data.email,
      role: parsed.data.role,
      createdById,
    });
    return Response.json({ data: invitation }, { status: 201 });
  } catch (err) {
    if (err instanceof InvitationAlreadyExistsError) {
      return Response.json({ error: err.message, code: err.code }, { status: 409 });
    }
    throw err;
  }
}

export async function GET(_request: Request) {
  const session = await requireOrgRole(["OWNER", "ADMIN"]);
  if (session instanceof Response) return session;

  const invitations = await listPendingInvitations(session.user.activeOrgId!);
  return Response.json({ data: invitations });
}
