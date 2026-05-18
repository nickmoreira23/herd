import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { RechargeWebhookVerifier } from "../verifiers/recharge.verifier";

const CLIENT_SECRET = "recharge-test-client-secret-fixed-for-determinism";
const BODY = Buffer.from(
  JSON.stringify({ topic: "order/created", id: 123456 }),
);

/** Recharge's documented signing scheme: sha256(client_secret + body), hex. */
function signRecharge(body: Buffer, clientSecret: string): string {
  return createHash("sha256")
    .update(clientSecret, "utf8")
    .update(body)
    .digest("hex");
}

describe("RechargeWebhookVerifier", () => {
  it("accepts a payload signed with sha256(secret+body) literal", async () => {
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);
    const sig = signRecharge(BODY, CLIENT_SECRET);

    const result = await v.verify(BODY, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result).toEqual({ ok: true });
  });

  // ⚠️ This test is the load-bearing safeguard against accidental "fixes"
  // that swap createHash for createHmac. Recharge's wire format is the literal
  // concatenation, NOT HMAC. If a contributor switches to createHmac thinking
  // they're modernizing the code, this test fails immediately.
  it("uses sha256(secret+body) literal concatenation, NOT HMAC — changing to createHmac must fail this test", async () => {
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);

    // Build the HMAC signature that the WRONG implementation would compute.
    const wrongHmacSig = createHmac("sha256", CLIENT_SECRET)
      .update(BODY)
      .digest("hex");

    // Sanity: the two schemes produce different digests for the same input.
    // If this assertion ever stops holding, sha256 is broken (or the inputs
    // collided by miracle).
    const correctLiteralSig = signRecharge(BODY, CLIENT_SECRET);
    expect(wrongHmacSig).not.toBe(correctLiteralSig);

    // Verifying with the HMAC signature must FAIL. If this expectation
    // inverts, someone switched the implementation to createHmac.
    const result = await v.verify(BODY, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: wrongHmacSig,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects a payload with an incorrect signature", async () => {
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);
    const wrong = signRecharge(BODY, "different-secret");

    const result = await v.verify(BODY, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: wrong,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.statusCode).toBe(401);
  });

  it("rejects when the signature header is missing", async () => {
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);
    const result = await v.verify(BODY, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("missing");
  });

  it("rejects when the client secret is not configured (fail-closed)", async () => {
    const v = new RechargeWebhookVerifier("");
    const sig = signRecharge(BODY, CLIENT_SECRET);
    const result = await v.verify(BODY, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: sig,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("not configured");
  });

  it("rejects if the body is tampered after signing", async () => {
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);
    const sig = signRecharge(BODY, CLIENT_SECRET);
    const tampered = Buffer.concat([BODY, Buffer.from(" ")]);

    const result = await v.verify(tampered, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result.ok).toBe(false);
  });

  it("computes digest over raw bytes — non-UTF8 body still verifies", async () => {
    const binaryBody = Buffer.from([0x00, 0xff, 0x80, 0x7f, 0x42, 0x00, 0xfe]);
    const v = new RechargeWebhookVerifier(CLIENT_SECRET);
    const sig = signRecharge(binaryBody, CLIENT_SECRET);

    const result = await v.verify(binaryBody, {
      [RechargeWebhookVerifier.SIGNATURE_HEADER]: sig,
    });

    expect(result).toEqual({ ok: true });
  });
});
