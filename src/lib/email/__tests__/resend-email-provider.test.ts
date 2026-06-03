import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Resend SDK so tests NEVER hit the network / send a real email.
const { sendMock, ResendCtor } = vi.hoisted(() => {
  const sendMock = vi.fn();
  // Must be a `function` (not an arrow) so it can be invoked with `new`.
  const ResendCtor = vi.fn(function (this: { emails: { send: unknown } }) {
    this.emails = { send: sendMock };
  });
  return { sendMock, ResendCtor };
});

vi.mock("resend", () => ({ Resend: ResendCtor }));

import { ResendEmailProvider } from "../resend-email-provider";

describe("ResendEmailProvider", () => {
  beforeEach(() => {
    sendMock.mockReset();
    ResendCtor.mockClear();
  });

  it("constructs the Resend client with the provided API key", () => {
    new ResendEmailProvider("re_key_123", "from@x.com");
    expect(ResendCtor).toHaveBeenCalledWith("re_key_123");
  });

  it("calls emails.send with from/to/subject/html (+text when present)", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    const provider = new ResendEmailProvider("re_key", "noreply@comecaai.com.br");

    await provider.send({
      to: "user@test.com",
      subject: "Convite",
      html: "<p>hi</p>",
      text: "hi",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      from: "noreply@comecaai.com.br",
      to: "user@test.com",
      subject: "Convite",
      html: "<p>hi</p>",
      text: "hi",
    });
  });

  it("omits text when the message has none", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    const provider = new ResendEmailProvider("re_key", "from@x.com");

    await provider.send({ to: "u@test.com", subject: "S", html: "<p>h</p>" });

    expect(sendMock).toHaveBeenCalledWith({
      from: "from@x.com",
      to: "u@test.com",
      subject: "S",
      html: "<p>h</p>",
    });
  });

  it("throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "domain not verified", name: "validation_error" },
    });
    const provider = new ResendEmailProvider("re_key", "from@x.com");

    await expect(
      provider.send({ to: "u@test.com", subject: "S", html: "<p>h</p>" })
    ).rejects.toThrow("Resend failed to send email: domain not verified");
  });
});
