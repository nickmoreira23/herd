import { createHash, timingSafeEqual } from "node:crypto";
import type {
  VerificationResult,
  WebhookVerifier,
} from "../verifier.interface";

/**
 * Recharge webhook signature verification.
 *
 * ⚠️ CRITICAL: Recharge uses LITERAL CONCATENATION, NOT HMAC.
 *
 * Algorithm: `sha256(client_secret + raw_body)` — hex digest computed over the
 * UTF-8 concatenation of the Client Secret string and the raw body bytes.
 *
 * This is NOT HMAC-SHA256. Standard HMAC mixes the key into the hash via the
 * inner/outer ipad/opad padding; Recharge's scheme is the older, vulnerable-ish
 * "length-extension-attack-adjacent" simple-concat hash. Many libraries and
 * blog posts wrongly use `createHmac` for Recharge; that produces a different
 * digest and fails verification against real Recharge webhooks.
 *
 * The test suite includes an explicit `it()` named so a future refactor that
 * "fixes" this to `createHmac` will fail loudly:
 *
 *   it("uses sha256(secret+body) literal concatenation, NOT HMAC — changing
 *      to createHmac must fail this test", ...)
 *
 * If that test ever fails, do NOT change the expected value — change the
 * implementation back. The literal concat is what Recharge sends.
 *
 * Header: `X-Recharge-Hmac-Sha256` (hex digest). The header name retains
 * "Hmac" historically even though the algorithm is not HMAC.
 */
export class RechargeWebhookVerifier implements WebhookVerifier {
  static readonly SIGNATURE_HEADER = "x-recharge-hmac-sha256";

  constructor(private readonly clientSecret: string) {}

  async verify(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    if (!this.clientSecret) {
      return {
        ok: false,
        reason: "recharge client secret not configured",
        statusCode: 401,
      };
    }

    const provided = headers[RechargeWebhookVerifier.SIGNATURE_HEADER];
    if (!provided) {
      return {
        ok: false,
        reason: `missing ${RechargeWebhookVerifier.SIGNATURE_HEADER} header`,
        statusCode: 401,
      };
    }

    // Literal string concatenation. createHash is used here, NOT createHmac.
    // The `update` is called twice on the same hash — the client_secret bytes
    // and the raw body bytes are streamed into the same digest, equivalent to
    // `sha256(client_secret_bytes ++ raw_body_bytes)`.
    const expectedHex = createHash("sha256")
      .update(this.clientSecret, "utf8")
      .update(rawBody)
      .digest("hex");

    if (provided.length !== expectedHex.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(provided, "hex");
    } catch {
      return { ok: false, reason: "signature not valid hex", statusCode: 401 };
    }
    const expectedBuf = Buffer.from(expectedHex, "hex");

    if (providedBuf.length !== expectedBuf.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    return timingSafeEqual(expectedBuf, providedBuf)
      ? { ok: true }
      : { ok: false, reason: "signature mismatch", statusCode: 401 };
  }
}
