import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvitationByToken } from "@/lib/invitations/invitation-service";
import { AcceptForm } from "./accept-form";
import {
  InvitationNotFoundView,
  InvitationAlreadyProcessedView,
  InvitationExpiredView,
} from "./views";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const data = await getInvitationByToken(token);

  if (!data) {
    return <InvitationNotFoundView />;
  }

  if (data.invitation.status !== "PENDING") {
    return <InvitationAlreadyProcessedView status={data.invitation.status} />;
  }

  if (data.invitation.expiresAt && new Date() > data.invitation.expiresAt) {
    return <InvitationExpiredView />;
  }

  const session = await auth();
  const existingProfile = await prisma.networkProfile.findUnique({
    where: { email: data.invitation.email },
    select: { id: true },
  });

  return (
    <AcceptForm
      token={token}
      organization={data.organization}
      invitationEmail={data.invitation.email}
      profileExists={!!existingProfile}
      sessionActive={!!session}
    />
  );
}
