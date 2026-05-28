import type { EmailMessage, EmailProvider } from "./email-provider";

// In-memory store exported for test assertions
export const mockSentEmails: EmailMessage[] = [];

export function clearMockSentEmails(): void {
  mockSentEmails.length = 0;
}

export class MockEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    mockSentEmails.push(message);
    // eslint-disable-next-line no-console
    console.log("[EMAIL MOCK]", {
      to: message.to,
      subject: message.subject,
      preview: message.text?.slice(0, 100) ?? message.html.slice(0, 100),
    });
  }
}
