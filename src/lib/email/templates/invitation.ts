import type { EmailMessage } from "../email-provider";

export interface InvitationEmailParams {
  recipientEmail: string;
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
  expiresAt: Date;
}

export function buildInvitationEmail(params: InvitationEmailParams): EmailMessage {
  const { recipientEmail, organizationName, inviterName, acceptUrl, expiresAt } = params;
  const expiresFormatted = expiresAt.toLocaleDateString("pt-BR");

  const text = `Você foi convidado para ${organizationName} por ${inviterName}.

Aceite o convite acessando: ${acceptUrl}

O convite expira em ${expiresFormatted}.

Se você não esperava esse email, ignore.`;

  const html = `
    <p>Você foi convidado para <strong>${organizationName}</strong> por ${inviterName}.</p>
    <p><a href="${acceptUrl}">Aceitar convite</a></p>
    <p>O convite expira em ${expiresFormatted}.</p>
    <p>Se você não esperava esse email, ignore.</p>
  `;

  return { to: recipientEmail, subject: `Convite para ${organizationName}`, html, text };
}
