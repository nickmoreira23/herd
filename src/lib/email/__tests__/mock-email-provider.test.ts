import { describe, it, expect, beforeEach } from "vitest";
import {
  MockEmailProvider,
  mockSentEmails,
  clearMockSentEmails,
} from "../mock-email-provider";
import { getEmailProvider, resetEmailProvider } from "../index";
import { buildInvitationEmail } from "../templates/invitation";

describe("MockEmailProvider", () => {
  beforeEach(() => {
    clearMockSentEmails();
    resetEmailProvider();
  });

  it("send pushes message to mockSentEmails", async () => {
    const provider = new MockEmailProvider();
    await provider.send({ to: "a@test.com", subject: "Test", html: "<p>hi</p>" });
    expect(mockSentEmails).toHaveLength(1);
    expect(mockSentEmails[0].to).toBe("a@test.com");
    expect(mockSentEmails[0].subject).toBe("Test");
  });

  it("clearMockSentEmails resets the array", async () => {
    const provider = new MockEmailProvider();
    await provider.send({ to: "a@test.com", subject: "S", html: "<p>h</p>" });
    expect(mockSentEmails).toHaveLength(1);
    clearMockSentEmails();
    expect(mockSentEmails).toHaveLength(0);
  });

  it("multiple sends accumulate in mockSentEmails", async () => {
    const provider = new MockEmailProvider();
    await provider.send({ to: "a@test.com", subject: "S1", html: "<p>1</p>" });
    await provider.send({ to: "b@test.com", subject: "S2", html: "<p>2</p>" });
    await provider.send({ to: "c@test.com", subject: "S3", html: "<p>3</p>" });
    expect(mockSentEmails).toHaveLength(3);
    expect(mockSentEmails[2].to).toBe("c@test.com");
  });

  it("getEmailProvider returns same singleton instance", () => {
    const p1 = getEmailProvider();
    const p2 = getEmailProvider();
    expect(p1).toBe(p2);
  });

  it("resetEmailProvider clears singleton so next call creates new instance", () => {
    const p1 = getEmailProvider();
    resetEmailProvider();
    const p2 = getEmailProvider();
    expect(p1).not.toBe(p2);
  });
});

describe("buildInvitationEmail", () => {
  it("returns EmailMessage with correct to, subject, html, text", () => {
    const expiresAt = new Date("2026-06-04");
    const msg = buildInvitationEmail({
      recipientEmail: "test@example.com",
      organizationName: "Acme Corp",
      inviterName: "Alice",
      acceptUrl: "http://app.lvh.me:3000/accept/abc-token",
      expiresAt,
    });

    expect(msg.to).toBe("test@example.com");
    expect(msg.subject).toBe("Convite para Acme Corp");
    expect(msg.html).toContain("Acme Corp");
    expect(msg.html).toContain("http://app.lvh.me:3000/accept/abc-token");
    expect(msg.text).toContain("Alice");
    expect(msg.text).toContain("http://app.lvh.me:3000/accept/abc-token");
  });
});
