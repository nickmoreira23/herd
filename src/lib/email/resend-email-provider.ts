import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./email-provider";

/**
 * Real email delivery via Resend. Selected by `getEmailProvider()` when
 * `RESEND_API_KEY` is present; otherwise the MockEmailProvider is used.
 *
 * The API key and from-address come exclusively from env (wired in index.ts) —
 * never hardcoded. A send failure throws so the caller (e.g. the invitation
 * service) surfaces it, mirroring the at-most-once contract of `EmailProvider`.
 */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
    });

    if (error) {
      throw new Error(`Resend failed to send email: ${error.message}`);
    }
  }
}
