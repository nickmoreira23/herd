import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { IntercomWebhookVerifier } from "../verifiers/intercom.verifier";

const SECRET = "intercom-test-client-secret-fixed";
const BODY = Buffer.from(JSON.stringify({ type: "conversation.user.replied" }));

function signIntercom(body: Buffer, secret: string): string {
  const hex = createHmac("sha256", secret).update(body).digest("hex");
  return `${IntercomWebhookVerifier.PREFIX}${hex}`;
}

describe("IntercomWebhookVerifier", () => {
  it("accepts a payload with a valid sha256= HMAC signature", async () => {
    const v = new IntercomWebhookVerifier(SECRET);
    const sig = signIntercom(BODY, SECRET);

    const result = await v.verify(BODY, {
      [IntercomWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects a payload with an incorrect signature", async () => {
    const v = new IntercomWebhookVerifier(SECRET);
    const wrong = signIntercom(BODY, "different-secret");

    const result = await v.verify(BODY, {
      [IntercomWebhookVerifier.SIGNATURE_HEADER]: wrong,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when the signature header is missing", async () => {
    const v = new IntercomWebhookVerifier(SECRET);
    const result = await v.verify(BODY, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("missing");
  });

  it("rejects when the signature lacks the sha256= prefix", async () => {
    const v = new IntercomWebhookVerifier(SECRET);
    const noPrefix = createHmac("sha256", SECRET).update(BODY).digest("hex");
    const result = await v.verify(BODY, {
      [IntercomWebhookVerifier.SIGNATURE_HEADER]: noPrefix, // no "sha256=" prefix
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("sha256=");
  });

  it("rejects when the secret is not configured (fail-closed)", async () => {
    const v = new IntercomWebhookVerifier("");
    const sig = signIntercom(BODY, SECRET);
    const result = await v.verify(BODY, {
      [IntercomWebhookVerifier.SIGNATURE_HEADER]: sig,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("not configured");
  });

  it("rejects if the body is tampered after signing", async () => {
    const v = new IntercomWebhookVerifier(SECRET);
    const sig = signIntercom(BODY, SECRET);
    const tampered = Buffer.concat([BODY, Buffer.from(" ")]);

    const result = await v.verify(tampered, {
      [IntercomWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result.ok).toBe(false);
  });
});
