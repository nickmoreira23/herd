import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { GorgiasWebhookVerifier } from "../verifiers/gorgias.verifier";

const SECRET = "test-secret-fixed-for-deterministic-tests";
const BODY = Buffer.from(JSON.stringify({ event: "ticket.updated", id: 42 }));

function signGorgias(body: Buffer, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("GorgiasWebhookVerifier", () => {
  it("accepts a payload with a valid HMAC-SHA256 hex signature", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const sig = signGorgias(BODY, SECRET);

    const result = await v.verify(BODY, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects a payload with an incorrect signature", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const wrong = signGorgias(BODY, "different-secret");

    const result = await v.verify(BODY, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: wrong,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.statusCode).toBe(401);
  });

  it("rejects when the signature header is missing", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const result = await v.verify(BODY, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("missing");
  });

  it("rejects when the secret is not configured (fail-closed)", async () => {
    const v = new GorgiasWebhookVerifier("");
    const sig = signGorgias(BODY, SECRET); // any valid-looking sig
    const result = await v.verify(BODY, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: sig,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("not configured");
  });

  it("rejects when the signature is not valid hex", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const result = await v.verify(BODY, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: "zzzz".repeat(16),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects when the signature has wrong length", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const result = await v.verify(BODY, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: "abc123",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("length");
  });

  it("rejects if the body is tampered after signing", async () => {
    const v = new GorgiasWebhookVerifier(SECRET);
    const sig = signGorgias(BODY, SECRET);
    const tampered = Buffer.from(BODY.toString("utf8") + " ");

    const result = await v.verify(tampered, {
      [GorgiasWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result.ok).toBe(false);
  });
});
