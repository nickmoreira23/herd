import { z } from "zod";
import { apiError } from "@/lib/api-utils";
import { acceptInvitation, getInvitationByToken } from "@/lib/invitations/invitation-service";
import {
  InvitationNotFoundError,
  InvitationAlreadyProcessedError,
  InvitationExpiredError,
  InvitationPasswordRequiredError,
  InvitationPasswordTooShortError,
} from "@/lib/invitations/errors";

const acceptSchema = z.object({
  password: z.string().min(8).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const body = await request.json().catch(() => ({}));
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { membership } = await acceptInvitation({
      token,
      password: parsed.data.password,
    });

    // Build redirect URL: protocol + subdomain + apex host
    const data = await getInvitationByToken(token);
    const apexHost = process.env.APEX_HOST ?? "lvh.me";
    const protocol = apexHost.includes("localhost") || apexHost === "lvh.me" ? "http" : "https";
    const subdomain = data?.organization.subdomain ?? "";
    const port = process.env.NEXTAUTH_URL?.match(/:(\d+)$/)?.[1];
    const portSuffix = port ? `:${port}` : "";
    const redirectUrl = `${protocol}://${subdomain}.${apexHost}${portSuffix}/admin`;

    return Response.json({ data: { redirectUrl, membershipId: membership.id } });
  } catch (err) {
    if (err instanceof InvitationNotFoundError) {
      return apiError(err.message, 404);
    }
    if (err instanceof InvitationAlreadyProcessedError) {
      return apiError(err.message, 409);
    }
    if (err instanceof InvitationExpiredError) {
      return apiError(err.message, 410);
    }
    if (err instanceof InvitationPasswordRequiredError || err instanceof InvitationPasswordTooShortError) {
      return apiError(err.message, 422);
    }
    throw err;
  }
}
