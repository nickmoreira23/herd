import { MockEmailProvider } from "./mock-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";
import type { EmailProvider } from "./email-provider";

export { mockSentEmails, clearMockSentEmails } from "./mock-email-provider";
export type { EmailProvider, EmailMessage } from "./email-provider";

const DEFAULT_FROM = "noreply@comecaai.com.br";

let providerInstance: EmailProvider | null = null;

/**
 * Returns the active email provider, choosing by env PRESENCE (not NODE_ENV):
 * `RESEND_API_KEY` set → real ResendEmailProvider; absent → MockEmailProvider
 * (dev/test default — console.log + in-memory store). Cached as a singleton;
 * call `resetEmailProvider()` to re-evaluate after changing env (used by tests).
 */
export function getEmailProvider(): EmailProvider {
  if (!providerInstance) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
      providerInstance = new ResendEmailProvider(apiKey, from);
    } else {
      providerInstance = new MockEmailProvider();
    }
  }
  return providerInstance;
}

// For tests that need to swap the provider
export function setEmailProvider(provider: EmailProvider): void {
  providerInstance = provider;
}

// Reset singleton (useful in test teardown)
export function resetEmailProvider(): void {
  providerInstance = null;
}
