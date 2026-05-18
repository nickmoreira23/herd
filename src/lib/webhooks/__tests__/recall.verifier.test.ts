import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { RecallWebhookVerifier } from "../verifiers/recall.verifier";

// A `whsec_` secret in production is `whsec_<base64-encoded-key-bytes>`.
// For tests we build a synthetic one whose decoded bytes are deterministic.
const KEY_BYTES = Buffer.from(
  "test-key-32-bytes-fixed--deterministic",
).subarray(0, 32);
const RAW_SECRET = `whsec_${KEY_BYTES.toString("base64")}`;

const BODY = Buffer.from(
  JSON.stringify({ event: "bot.status_change", data: { bot_id: "abc" } }),
);

const ID = "msg_test_12345";
const TIMESTAMP = "1700000000";

function signSvix(
  body: Buffer,
  id: string,
  timestamp: string,
  key: Buffer,
): string {
  const payload = Buffer.concat([
    Buffer.from(`${id}.${timestamp}.`, "utf8"),
    body,
  ]);
  return createHmac("sha256", key).update(payload).digest("base64");
}

describe("RecallWebhookVerifier", () => {
  it("accepts a payload with a valid v1 Svix-style signature", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const sig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${sig}`,
    });

    expect(result).toEqual({ ok: true });
  });

  it("accepts the second signature when multiple are present (key rotation)", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const validSig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);
    const bogusSig = Buffer.from("0".repeat(32), "utf8").toString("base64");

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${bogusSig} v1,${validSig}`,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects a signature signed with a different timestamp", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const sigForOldTs = signSvix(BODY, ID, "1600000000", KEY_BYTES);

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${sigForOldTs}`,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects unknown signature versions", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const sig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v99,${sig}`,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when svix-id is missing", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const sig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${sig}`,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when the secret is not configured (fail-closed)", async () => {
    const v = new RecallWebhookVerifier("");
    const sig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);

    const result = await v.verify(BODY, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${sig}`,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("not configured");
  });

  it("rejects if the body is tampered after signing", async () => {
    const v = new RecallWebhookVerifier(RAW_SECRET);
    const sig = signSvix(BODY, ID, TIMESTAMP, KEY_BYTES);
    const tampered = Buffer.concat([BODY, Buffer.from(" ")]);

    const result = await v.verify(tampered, {
      [RecallWebhookVerifier.ID_HEADER]: ID,
      [RecallWebhookVerifier.TIMESTAMP_HEADER]: TIMESTAMP,
      [RecallWebhookVerifier.SIGNATURE_HEADER]: `v1,${sig}`,
    });

    expect(result.ok).toBe(false);
  });
});
