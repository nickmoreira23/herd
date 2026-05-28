import { MockEmailProvider } from "./mock-email-provider";
import type { EmailProvider } from "./email-provider";

export { mockSentEmails, clearMockSentEmails } from "./mock-email-provider";
export type { EmailProvider, EmailMessage } from "./email-provider";

let providerInstance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!providerInstance) {
    providerInstance = new MockEmailProvider();
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
